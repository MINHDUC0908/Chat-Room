import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import socket from "../utils/socket";
import { FiVideo, FiPhoneOff, FiX } from "react-icons/fi";
import useUser from "../hooks/useUser";

const VideoCall = forwardRef(({ user }, ref) => {
    const [showCallModal, setShowCallModal] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null);
    const [callStatus, setCallStatus] = useState("");
    const [pc, setPc] = useState(null);
    const [isInCall, setIsInCall] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [showEndCallScreen, setShowEndCallScreen] = useState(false);
    const [currentReceiverId, setCurrentReceiverId] = useState(null);
    const isEndingCallRef = useRef(false);
    const callTimerRef = useRef(null);
    const callStartTimeRef = useRef(null);
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const { receiverInfo, fetchReceiver } = useUser();

    useEffect(() => {
        return () => {
            cleanupLocalOnly();
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
            }
        };
    }, []);

    // 🎥 Setup WebRTC listeners - VIDEO EVENTS
    useEffect(() => {
        if (!user?.id) return;

        const userId = String(user.id);
        socket.emit("join", userId);

        // ✅ VIDEO: Sử dụng event riêng "incoming-video-call"
        socket.on("incoming-video-call", ({ from, offer }) => {
            console.log("📹 Có cuộc gọi VIDEO đến từ userId:", from);
            setIncomingCall({ from, offer });
            setCurrentReceiverId(from);
            setShowCallModal(true);
            setCallStatus(`Cuộc gọi video đến từ User ${from}`);
            isEndingCallRef.current = false;
            fetchReceiver(from);
        });

        // ✅ VIDEO: Event "video-call-answered"
        socket.on("video-call-answered", async ({ from, answer }) => {
            console.log("✅ User", from, "đã chấp nhận cuộc gọi video");
            setCallStatus("Đang kết nối...");
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
                setCallStatus("Đang gọi video");
            }
        });

        // ✅ VIDEO: Event "video-ice-candidate"
        socket.on("video-ice-candidate", async ({ from, candidate }) => {
            try {
                if (candidate && pc) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log("✅ Đã thêm VIDEO ICE candidate từ", from);
                }
            } catch (err) {
                console.error("❌ Lỗi khi thêm VIDEO ICE candidate:", err);
            }
        });

        // ✅ VIDEO: Event "video-call-ended"
        socket.on("video-call-ended", ({ from }) => {
            console.log("📴 Cuộc gọi video bị ngắt bởi User", from);
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
            socket.off("incoming-video-call");
            socket.off("video-call-answered");
            socket.off("video-ice-candidate");
            socket.off("video-call-ended");
        };
    }, [pc, user]);

    const createPeer = (targetId) => {
        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" }
            ]
        });

        peer.ontrack = (event) => {
            console.log("🎥 Nhận video từ User", targetId);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
            setCallStatus("Đang trong cuộc gọi video");
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
                console.log("📤 Gửi VIDEO ICE candidate");
                // ✅ VIDEO: Emit "video-ice-candidate"
                socket.emit("video-ice-candidate", {
                    senderId: String(user.id),
                    receiverId: String(targetId),
                    candidate: event.candidate,
                });
            }
        };

        peer.oniceconnectionstatechange = () => {
            console.log("VIDEO ICE State:", peer.iceConnectionState);
            if (peer.iceConnectionState === "connected") {
                setCallStatus("Kết nối video thành công ✅");
            } else if (peer.iceConnectionState === "failed") {
                setCallStatus("Kết nối video thất bại");
                hangUpCall();
            }
        };

        return peer;
    };

    const startCall = async (receiverId) => {
        try {
            isEndingCallRef.current = false;
            setCurrentReceiverId(receiverId);
            setShowCallModal(true);
            setCallStatus("Đang gọi video...");
            setIsInCall(false);
            
            fetchReceiver(receiverId);
            
            const peer = createPeer(receiverId);
            setPc(peer);

            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: { 
                    width: { ideal: 640 }, 
                    height: { ideal: 480 },
                    facingMode: 'user'
                } 
            });
            stream.getTracks().forEach((track) => peer.addTrack(track, stream));
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            // ✅ VIDEO: Emit "call-video-user"
            socket.emit("call-video-user", { 
                senderId: String(user.id), 
                receiverId: String(receiverId), 
                offer 
            });
        } catch (err) {
            console.error("❌ Lỗi khi gọi video:", err);
            setCallStatus("Lỗi: " + err.message);
            if (err.name === 'NotAllowedError') {
                alert("Cần quyền camera và mic! Kiểm tra browser settings.");
            } else {
                alert("Không thể truy cập camera/mic!");
            }
            cleanupLocalOnly();
            setShowCallModal(false);
            setCurrentReceiverId(null);
        }
    };

    const acceptCall = async () => {
        if (!incomingCall) return;

        try {
            isEndingCallRef.current = false;
            setCallStatus("Đang chấp nhận video...");
            const { from, offer } = incomingCall;
            const peer = createPeer(from);
            setPc(peer);

            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } 
            });
            stream.getTracks().forEach((track) => peer.addTrack(track, stream));
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            await peer.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            // ✅ VIDEO: Emit "answer-video-call"
            socket.emit("answer-video-call", { 
                senderId: String(from), 
                receiverId: String(user.id), 
                answer 
            });
            console.log("✅ Đã chấp nhận cuộc gọi video");

            setIncomingCall(null);
        } catch (err) {
            console.error("❌ Lỗi:", err);
            setCallStatus("Lỗi: " + err.message);
            if (err.name === 'NotAllowedError') {
                alert("Cần quyền camera!");
            }
            cleanupLocalOnly();
        }
    };

    const rejectCall = () => {
        if (!incomingCall) return;
        
        isEndingCallRef.current = true;
        // ✅ VIDEO: Emit "end-video-call"
        socket.emit("end-video-call", {
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

    const hangUpCall = () => {
        console.log("📴 hangUpCall VIDEO called");
        
        if (isEndingCallRef.current) {
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
            // ✅ VIDEO: Emit "end-video-call"
            socket.emit("end-video-call", {
                senderId: String(user.id),
                receiverId: String(targetReceiverId)
            });
        }
        
        cleanupLocalOnly();
        setShowEndCallScreen(true);
        setCallStatus("Cuộc gọi video đã kết thúc");
        setIncomingCall(null);
        
        setTimeout(() => {
            setShowCallModal(false);
            setShowEndCallScreen(false);
            setCallDuration(0);
            setCurrentReceiverId(null);
            isEndingCallRef.current = false;
        }, 3000);
    };

    const cleanupLocalOnly = () => {
        console.log("🧹 Cleaning up video resources");
        
        if (pc) {
            pc.close();
            setPc(null);
        }
        if (localVideoRef.current?.srcObject) {
            localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
            localVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        setIsInCall(false);
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useImperativeHandle(ref, () => ({
        startCall,
        hangUpCall,
    }));

    return (
        <>
            {showCallModal && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
                    <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">
                                🎥 Cuộc gọi video
                            </h3>
                            <button onClick={hangUpCall} className="text-gray-400 hover:text-white">
                                <FiX size={24} />
                            </button>
                        </div>

                        {/* Incoming Call */}
                        {incomingCall && !isInCall && !showEndCallScreen && (
                            <div className="text-center mb-4">
                                <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-3 flex items-center justify-center animate-pulse">
                                    <FiVideo size={40} className="text-green-600" />
                                </div>
                                <p className="text-gray-300 mb-2">Cuộc gọi video đến từ</p>
                                <p className="font-bold text-lg text-white mb-4">
                                    {receiverInfo?.name || `User ${incomingCall.from}`}
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={acceptCall}
                                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center gap-2"
                                    >
                                        <FiVideo /> Chấp nhận
                                    </button>
                                    <button
                                        onClick={rejectCall}
                                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg flex items-center gap-2"
                                    >
                                        <FiPhoneOff /> Từ chối
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Video Screens */}
                        {!incomingCall && !showEndCallScreen && (
                            <div className="relative bg-black rounded-lg overflow-hidden" style={{ height: '500px' }}>
                                {/* Remote Video (Full Screen) */}
                                <video 
                                    ref={remoteVideoRef} 
                                    autoPlay 
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                
                                {/* Local Video (Picture-in-Picture) */}
                                <video 
                                    ref={localVideoRef} 
                                    autoPlay 
                                    muted 
                                    playsInline
                                    className="absolute bottom-4 right-4 w-40 h-32 object-cover rounded-lg border-2 border-white shadow-lg"
                                />
                                
                                {/* Overlay Info */}
                                <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-3 py-2 rounded">
                                    <p className="font-bold text-white">{receiverInfo?.name || user?.name}</p>
                                    <p className="text-sm text-gray-300">{callStatus}</p>
                                </div>
                                
                                {/* Call Duration */}
                                {isInCall && (
                                    <div className="absolute top-4 right-4 bg-black bg-opacity-50 px-3 py-2 rounded">
                                        <p className="text-xl font-mono text-white">
                                            {formatDuration(callDuration)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* End Call Screen */}
                        {showEndCallScreen && (
                            <div className="text-center py-20">
                                <div className="w-20 h-20 bg-red-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                                    <FiPhoneOff size={40} className="text-red-600" />
                                </div>
                                <p className="font-bold text-lg text-white mb-1">
                                    Cuộc gọi đã kết thúc
                                </p>
                                <p className="text-sm text-gray-300">
                                    Thời gian: <span className="font-mono font-bold text-blue-400">{formatDuration(callDuration)}</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-2">Đang đóng...</p>
                            </div>
                        )}

                        {/* Hang Up Button */}
                        {(isInCall || (!incomingCall && pc)) && !showEndCallScreen && (
                            <button
                                onClick={hangUpCall}
                                className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium"
                            >
                                <FiPhoneOff size={20} /> Ngắt kết nối
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
});

export default VideoCall;