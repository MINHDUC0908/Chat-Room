import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import socket from "../../utils/socket";
import { FiPhone, FiPhoneOff, FiMic, FiMicOff, FiMoreVertical } from "react-icons/fi";
import useUser from "../../hooks/useUser";

const AudioCall = forwardRef(({ user }, ref) => {
    const [showCallModal, setShowCallModal] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null);
    const [callStatus, setCallStatus] = useState("");
    const [pc, setPc] = useState(null);
    const [isInCall, setIsInCall] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [showEndCallScreen, setShowEndCallScreen] = useState(false);
    const [currentReceiverId, setCurrentReceiverId] = useState(null);
    const [isMuted, setIsMuted] = useState(false);

    const isEndingCallRef = useRef(false);
    const callTimerRef = useRef(null);
    const callStartTimeRef = useRef(null);
    const localAudioRef = useRef();
    const remoteAudioRef = useRef();
    const { receiverInfo, fetchReceiver } = useUser();

    // Cleanup khi unmount
    useEffect(() => {
        return () => {
            cleanupLocalOnly();
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
            }
        };
    }, []);

    // Setup WebRTC listeners
    useEffect(() => {
        if (!user?.id) return;

        const userId = String(user.id);
        socket.emit("join", userId);

        socket.on("incoming-call", ({ from, offer }) => {
            setIncomingCall({ from, offer });
            setCurrentReceiverId(from);
            setShowCallModal(true);
            setCallStatus(`Cuộc gọi đến từ User ${from}`);
            isEndingCallRef.current = false;
            fetchReceiver(from);
        });

        socket.on("call-answered", async ({ from, answer }) => {
            setCallStatus("Đang kết nối...");
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
                setCallStatus("Đang gọi");
            }
        });

        socket.on("ice-candidate", async ({ from, candidate }) => {
            try {
                if (candidate && pc) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (err) {
                console.error("❌ Lỗi khi thêm ICE candidate:", err);
            }
        });

        socket.on("call-ended", ({ from }) => {
            isEndingCallRef.current = true;
            
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
                callTimerRef.current = null;
            }
            
            cleanupLocalOnly();
            setShowEndCallScreen(true);
            setCallStatus("Cuộc gọi đã kết thúc");
            
            setTimeout(() => {
                setShowCallModal(false);
                setShowEndCallScreen(false);
                setIncomingCall(null);
                setCurrentReceiverId(null);
                setCallDuration(0);
                isEndingCallRef.current = false;
            }, 3000);
        });

        return () => {
            socket.off("incoming-call");
            socket.off("call-answered");
            socket.off("ice-candidate");
            socket.off("call-ended");
        };
    }, [pc, user]);

    // Hàm tạo kết nối WebRTC
    const createPeer = (targetId) => {
        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" }
            ]
        });

        peer.ontrack = (event) => {
            console.log("🎧 Nhận âm thanh từ User", targetId);
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = event.streams[0];
            }
            setCallStatus("Đang trong cuộc gọi");
            setIsInCall(true);
            
            if (!callTimerRef.current) {
                callStartTimeRef.current = Date.now();
                callTimerRef.current = setInterval(() => {
                    const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
                    setCallDuration(elapsed);
                }, 1000);
            }
        };

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("📤 Gửi ICE candidate");
                socket.emit("ice-candidate", {
                    senderId: String(user.id),
                    receiverId: String(targetId),
                    candidate: event.candidate,
                });
            }
        };

        peer.oniceconnectionstatechange = () => {
            console.log("ICE State:", peer.iceConnectionState);
            if (peer.iceConnectionState === "connected") {
                setCallStatus("Kết nối thành công ✅");
            } else if (peer.iceConnectionState === "failed") {
                setCallStatus("Kết nối thất bại");
                hangUpCall();
            }
        };

        return peer;
    };

    // 📞 Gọi thoại
    const startCall = async (receiverId) => {
        if (!receiverId || !user?.id) {
            console.error("❌ Thiếu receiverId hoặc user.id:", { receiverId, userId: user?.id });
            alert("Vui lòng chọn người dùng để gọi!");
            return;
        }

        try {
            isEndingCallRef.current = false;
            setCurrentReceiverId(receiverId);
            setShowCallModal(true);
            setCallStatus("Đang gọi...");
            setIsInCall(false);
            fetchReceiver(receiverId);
            
            const peer = createPeer(receiverId);
            setPc(peer);

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((track) => peer.addTrack(track, stream));
            
            if (localAudioRef.current) {
                localAudioRef.current.srcObject = stream;
            }

            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            socket.emit("call-user", { 
                senderId: String(user.id), 
                receiverId: String(receiverId), 
                offer 
            });
            console.log("📤 Gửi yêu cầu gọi tới User", receiverId);
        } catch (err) {
            console.error("❌ Lỗi khi gọi:", err);
            setCallStatus("Lỗi: " + err.message);
            alert("Không thể truy cập microphone!");
            cleanupLocalOnly();
            setShowCallModal(false);
            setCurrentReceiverId(null);
        }
    };

    // ✅ Chấp nhận cuộc gọi
    const acceptCall = async () => {
        if (!incomingCall) return;

        try {
            isEndingCallRef.current = false;
            setCallStatus("Đang chấp nhận...");
            const { from, offer } = incomingCall;
            const peer = createPeer(from);
            setPc(peer);

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((track) => peer.addTrack(track, stream));
            
            if (localAudioRef.current) {
                localAudioRef.current.srcObject = stream;
            }

            await peer.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            socket.emit("answer-call", { 
                senderId: String(from), 
                receiverId: String(user.id), 
                answer 
            });
            console.log("✅ Đã chấp nhận cuộc gọi");

            setIncomingCall(null);
        } catch (err) {
            console.error("❌ Lỗi:", err);
            setCallStatus("Lỗi: " + err.message);
            cleanupLocalOnly();
        }
    };

    // ❌ Từ chối cuộc gọi
    const rejectCall = () => {
        if (!incomingCall) return;
        
        isEndingCallRef.current = true;
        socket.emit("end-call", {
            senderId: String(user.id),
            receiverId: String(incomingCall.from)
        });
        
        setIncomingCall(null);
        setShowCallModal(false);
        setCallStatus("");
        setCallDuration(0);
        setCurrentReceiverId(null);
        
        setTimeout(() => {
            isEndingCallRef.current = false;
        }, 500);
    };

    // Ngắt cuộc gọi
    const hangUpCall = () => {
        if (isEndingCallRef.current) {
            console.log("⚠️ Already ending call, skip emit");
            cleanupLocalOnly();
            return;
        }

        isEndingCallRef.current = true;
        
        if (callTimerRef.current) {
            clearInterval(callTimerRef.current);
            callTimerRef.current = null;
        }
        
        const targetReceiverId = currentReceiverId || incomingCall?.from;
        
        if (targetReceiverId) {
            socket.emit("end-call", {
                senderId: String(user.id),
                receiverId: String(targetReceiverId)
            });
        }
        
        cleanupLocalOnly();
        setShowEndCallScreen(true);
        setCallStatus("Cuộc gọi đã kết thúc");
        setIncomingCall(null);
        
        setTimeout(() => {
            setShowCallModal(false);
            setShowEndCallScreen(false);
            setCallDuration(0);
            setCurrentReceiverId(null);
            isEndingCallRef.current = false;
        }, 3000);
    };

    // Toggle mute
    const toggleMute = () => {
        if (localAudioRef.current?.srcObject) {
            const audioTrack = localAudioRef.current.srcObject.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    // Cleanup local
    const cleanupLocalOnly = () => {
        if (pc) {
            pc.close();
            setPc(null);
        }
        if (localAudioRef.current?.srcObject) {
            localAudioRef.current.srcObject.getTracks().forEach(track => track.stop());
            localAudioRef.current.srcObject = null;
        }
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
        }
        setIsInCall(false);
        setIsMuted(false);
    };

    // Format thời gian
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Expose methods qua ref
    useImperativeHandle(ref, () => ({
        startCall,
        hangUpCall,
    }));

    return (
        <>
            {showCallModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/90">
                    <div className="w-full h-full max-w-2xl mx-auto flex flex-col">
                        {incomingCall && !isInCall && !showEndCallScreen && (
                            <div className="flex-1 flex flex-col items-center justify-center text-white px-8">
                                <div className="mb-8">
                                    <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center text-4xl font-semibold mb-6">
                                        {receiverInfo?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <h2 className="text-3xl font-normal text-center mb-2">
                                        {receiverInfo?.name || `User ${incomingCall.from}`}
                                    </h2>
                                    <p className="text-gray-400 text-center">Đang gọi đến...</p>
                                </div>

                                <div className="flex gap-12 mt-12">
                                    <button
                                        onClick={rejectCall}
                                        className="flex flex-col items-center gap-3 group"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all">
                                            <FiPhoneOff size={28} className="text-white" />
                                        </div>
                                        <span className="text-sm text-gray-300">Từ chối</span>
                                    </button>

                                    <button
                                        onClick={acceptCall}
                                        className="flex flex-col items-center gap-3 group"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center transition-all">
                                            <FiPhone size={28} className="text-white" />
                                        </div>
                                        <span className="text-sm text-gray-300">Chấp nhận</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {!incomingCall && !showEndCallScreen && (
                            <div className="flex-1 flex flex-col items-center justify-between text-white px-8 py-12">
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center text-4xl font-semibold mb-6">
                                        {receiverInfo?.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <h2 className="text-3xl font-normal mb-3">
                                        {receiverInfo?.name || user?.name}
                                    </h2>
                                    <p className="text-gray-400 mb-2">{callStatus}</p>
                                    {isInCall && (
                                        <p className="text-xl font-light text-gray-300 mt-4">
                                            {formatDuration(callDuration)}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-8">
                                    <button
                                        onClick={toggleMute}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                                            isMuted ? 'bg-white text-black' : 'bg-gray-700 hover:bg-gray-600 text-white'
                                        }`}>
                                            {isMuted ? <FiMicOff size={24} /> : <FiMic size={24} />}
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {isMuted ? 'Bật mic' : 'Tắt tiếng'}
                                        </span>
                                    </button>

                                    <button
                                        onClick={hangUpCall}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all">
                                            <FiPhoneOff size={28} className="text-white" />
                                        </div>
                                        <span className="text-xs text-gray-400">Kết thúc</span>
                                    </button>

                                    <button className="flex flex-col items-center gap-2 group opacity-50 cursor-not-allowed">
                                        <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                                            <FiMoreVertical size={24} className="text-white" />
                                        </div>
                                        <span className="text-xs text-gray-400">Thêm</span>
                                    </button>
                                </div>
                            </div>
                        )}
                        {showEndCallScreen && (
                            <div className="flex-1 flex flex-col items-center justify-center text-white px-8">
                                <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center text-4xl font-semibold mb-6">
                                    {receiverInfo?.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <h2 className="text-2xl font-normal mb-2">Cuộc gọi đã kết thúc</h2>
                                <p className="text-gray-400 text-lg">{formatDuration(callDuration)}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
});

export default AudioCall;