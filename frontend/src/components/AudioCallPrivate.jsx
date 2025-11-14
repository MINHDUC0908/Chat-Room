import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import socket from "../utils/socket";
import { FiPhone, FiPhoneOff, FiX } from "react-icons/fi";
import useUser from "../hooks/useUser";

const AudioCall = forwardRef(({ user }, ref) => {
    const [showCallModal, setShowCallModal] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null);
    const [callStatus, setCallStatus] = useState("");
    const [pc, setPc] = useState(null);
    const [isInCall, setIsInCall] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [showEndCallScreen, setShowEndCallScreen] = useState(false);
    const [currentReceiverId, setCurrentReceiverId] = useState(null); // ✅ Lưu receiverId hiện tại

    // Nhạc chuông
    const [isRinging, setIsRinging] = useState(false);

    // HÀM PHÁT NHẠC CHUÔNG
    const playRingtone = () => {
        if (ringtoneRef.current) {
            ringtoneRef.current.loop = false; // ❌ Không lặp, để có thể nghe "hết nhạc"
            ringtoneRef.current.volume = 0.5;
            ringtoneRef.current.currentTime = 0;
            ringtoneRef.current.play().catch(err => {
                console.log("Không thể phát ringtone:", err);
            });
            setIsRinging(true);

            // ✅ Khi nhạc chuông phát xong mà vẫn chưa trong cuộc gọi -> tự ngắt
            ringtoneRef.current.onended = () => {
                console.log("🎵 Nhạc chuông kết thúc");
                if (!isInCall && !isEndingCallRef.current) {
                    console.log("📴 Người nhận không bắt máy - tự ngắt cuộc gọi");
                    setCallStatus("Người nhận không bắt máy");
                    hangUpCall(); // 🔹 Gọi hàm ngắt cuộc gọi
                }
            };
        }
    };

    // 4. HÀM DỪNG NHẠC CHUÔNG
    const stopRingtone = () => {
        if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0; // Reset về đầu
            setIsRinging(false);
        }
    };

    const isEndingCallRef = useRef(false);
    const callTimerRef = useRef(null);
    const callStartTimeRef = useRef(null);
    const localAudioRef = useRef();
    const remoteAudioRef = useRef();
    const ringtoneRef = useRef(null);
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

    // 🎧 Setup WebRTC listeners
    useEffect(() => {
        if (!user?.id) return;

        const userId = String(user.id);
        socket.emit("join", userId);

        // Sự kiện nhận cuộc gọi
        socket.on("incoming-call", ({ from, offer }) => {
            console.log("📞 Có cuộc gọi đến từ userId:", from);
            setIncomingCall({ from, offer });
            setCurrentReceiverId(from); // ✅ Set receiverId khi nhận cuộc gọi
            setShowCallModal(true);
            setCallStatus(`Cuộc gọi đến từ User ${from}`);
            isEndingCallRef.current = false;
            
            // ✅ Fetch thông tin người gọi
            fetchReceiver(from);

            // Phát nhạc chuông 
            playRingtone();
        });

        // Khi đối phương chấp nhận
        socket.on("call-answered", async ({ from, answer }) => {
            console.log("✅ User", from, "đã chấp nhận cuộc gọi");
            // Dừng nhạc chuông
            stopRingtone();
            setCallStatus("Đang kết nối...");
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
                setCallStatus("Đang gọi");
            }
        });

        // Khi nhận ICE candidate
        socket.on("ice-candidate", async ({ from, candidate }) => {
            try {
                if (candidate && pc) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log("✅ Đã thêm ICE candidate từ", from);
                }
            } catch (err) {
                console.error("❌ Lỗi khi thêm ICE candidate:", err);
            }
        });

        // Khi cuộc gọi bị ngắt
        socket.on("call-ended", ({ from }) => {
            console.log("📴 Cuộc gọi bị ngắt bởi User", from);
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

    // 🎧 Hàm tạo kết nối WebRTC
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

    // 📞 Gọi thoại - ✅ Nhận receiverId từ parameter
    const startCall = async (receiverId) => {
        if (!receiverId || !user?.id) {
            console.error("❌ Thiếu receiverId hoặc user.id:", { receiverId, userId: user?.id });
            alert("Vui lòng chọn người dùng để gọi!");
            return;
        }

        try {
            isEndingCallRef.current = false;
            setCurrentReceiverId(receiverId); // ✅ Lưu receiverId
            setShowCallModal(true);
            setCallStatus("Đang gọi...");
            setIsInCall(false);
            
            // ✅ Fetch thông tin người nhận
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
        // Dừng nhạc chuông nếu đang reo
        stopRingtone();
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
        // Dừng nhạc chuông nếu đang reo
        stopRingtone();
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

    // 📴 Ngắt cuộc gọi (chủ động)
    const hangUpCall = () => {
        console.log("📴 hangUpCall called, isEndingCallRef:", isEndingCallRef.current);

        // Dừng nhạc chuông nếu đang reo
        stopRingtone();
        
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
        
        // ✅ Sử dụng currentReceiverId
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

    // Cleanup local
    const cleanupLocalOnly = () => {
        console.log("🧹 Cleaning up local resources");
        stopRingtone();
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
            <audio 
                ref={ringtoneRef} 
                preload="auto"
                style={{ display: 'none' }}
            >
                <source src="/sounds/ngaytetqueem.mp3" type="audio/mpeg" />
            </audio>

            <div className="hidden">
                <audio ref={localAudioRef} autoPlay muted />
                <audio ref={remoteAudioRef} autoPlay playsInline />
            </div>

            {/* Audio Elements cho cuộc gọi */}
            {showCallModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
                    <div className="relative w-full max-w-xl">
                        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-700/50">
                            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-2xl"></div>
                            <button 
                                onClick={hangUpCall}
                                className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:rotate-90 duration-300"
                            >
                                <FiX size={18} />
                            </button>
                            <div className="relative px-6 py-8">
                                
                                {/* ========== INCOMING CALL ========== */}
                                {incomingCall && !isInCall && !showEndCallScreen && (
                                    <div className="space-y-6">
                                        <div className="flex flex-col items-center">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-xl animate-pulse opacity-40"></div>
                                                <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-full p-1 shadow-xl">
                                                    <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center">
                                                        <FiPhone size={36} className="text-green-400 animate-bounce" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-6 text-center">
                                                <p className="text-xs text-slate-400 mb-1.5">Cuộc gọi đến từ</p>
                                                <h3 className="text-xl font-bold text-white mb-1">
                                                    {receiverInfo?.name || `User ${incomingCall.from}`}
                                                </h3>
                                                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400">
                                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                                                    <span>Đang đổ chuông...</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={rejectCall}
                                                className="flex-1 group relative overflow-hidden bg-red-500/10 hover:bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-2xl py-3.5 transition-all duration-300"
                                            >
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <div className="w-11 h-11 bg-red-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                                        <FiPhoneOff size={20} className="text-white" />
                                                    </div>
                                                    <span className="text-xs font-medium text-red-400">Từ chối</span>
                                                </div>
                                            </button>

                                            <button
                                                onClick={acceptCall}
                                                className="flex-1 group relative overflow-hidden bg-green-500/10 hover:bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-2xl py-3.5 transition-all duration-300"
                                            >
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <div className="w-11 h-11 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                                        <FiPhone size={20} className="text-white" />
                                                    </div>
                                                    <span className="text-xs font-medium text-green-400">Chấp nhận</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ========== CALLING / IN CALL ========== */}
                                {!incomingCall && !showEndCallScreen && (
                                    <div className="space-y-6">
                                        <div className="flex flex-col items-center">
                                            <div className="relative">
                                                {!isInCall && (
                                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl animate-pulse opacity-50"></div>
                                                )}
                                                <div className={`relative w-24 h-24 rounded-full p-1 shadow-2xl ${
                                                    isInCall 
                                                        ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                                                        : 'bg-gradient-to-br from-blue-500 to-purple-500'
                                                }`}>
                                                    <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center">
                                                        <FiPhone size={36} className={`${isInCall ? 'text-green-400' : 'text-blue-400 animate-pulse'}`} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-6 text-center space-y-2">
                                                <h3 className="text-xl font-bold text-white">
                                                    {receiverInfo?.name || user?.name}
                                                </h3>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isInCall ? 'bg-green-400' : 'bg-blue-400'} animate-pulse`}></div>
                                                    <p className="text-xs text-slate-400">{callStatus}</p>
                                                </div>
                                            </div>
                                            {isInCall && (
                                                <div className="mt-4 bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl px-6 py-3 shadow-lg">
                                                    <div className="text-center">
                                                        <p className="text-3xl font-mono font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                                            {formatDuration(callDuration)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {(isInCall || (!incomingCall && pc)) && (
                                            <button
                                                onClick={hangUpCall}
                                                className="group w-full bg-red-500/10 hover:bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-2xl py-4 transition-all duration-300"
                                            >
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className="w-11 h-11 bg-red-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                                        <FiPhoneOff size={20} className="text-white" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-red-400">Kết thúc</span>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* ========== END CALL SCREEN ========== */}
                                {showEndCallScreen && (
                                    <div className="space-y-6 text-center">
                                        <div className="flex justify-center">
                                            <div className="w-24 h-24 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full p-1 shadow-2xl">
                                                <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700">
                                                    <FiPhoneOff size={36} className="text-slate-400" onClick={() => setShowEndCallScreen(false)} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-lg font-bold text-white">
                                                Cuộc gọi đã kết thúc
                                            </h3>
                                            <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-xl px-5 py-3 inline-block">
                                                <p className="text-xs text-slate-400 mb-1">Thời gian</p>
                                                <p className="text-2xl font-mono font-bold text-white">
                                                    {formatDuration(callDuration)}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                                                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse"></div>
                                                <span>Đang đóng...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Debug Panel */}
                            <div className="px-6 pb-6">
                                <div className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/30 rounded-xl px-3 py-2.5 space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">User Name:</span>
                                        <span className="text-slate-300 font-mono">{user?.name || "None"}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">Receiver Name:</span>
                                        <span className="text-slate-300 font-mono">{receiverInfo?.name || "None"}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">Peer:</span>
                                        <span className={`font-mono ${pc ? 'text-green-400' : 'text-red-400'}`}>
                                            {pc ? "✅ Active" : "❌ None"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">Status:</span>
                                        <span className="text-slate-300">{callStatus || "Idle"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Audio Elements */}
                            <div className="hidden">
                                <audio ref={localAudioRef} autoPlay muted />
                                <audio ref={remoteAudioRef} autoPlay playsInline />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
});

export default AudioCall;