import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import socket from "../utils/socket";
import { FiPhone, FiPhoneOff, FiX } from "react-icons/fi";
import useUser from "../hooks/useUser";

const AudioCall = forwardRef(({ user, receiverId }, ref) => {
    const [showCallModal, setShowCallModal] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null);
    const [callStatus, setCallStatus] = useState("");
    const [pc, setPc] = useState(null);
    const [isInCall, setIsInCall] = useState(false);
    const [isEndingCall, setIsEndingCall] = useState(false); // Flag mới để tránh loop khi ngắt
    const localAudioRef = useRef();
    const remoteAudioRef = useRef();
    const { receiverInfo, fetchReceiver } = useUser();

    // Cleanup local streams và peer khi unmount hoặc thay đổi user
    useEffect(() => {
        return () => {
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
            setShowCallModal(true);
            setCallStatus(`Cuộc gọi đến từ User ${from}`);
        });

        // Khi đối phương chấp nhận
        socket.on("call-answered", async ({ from, answer }) => {
            console.log("✅ User", from, "đã chấp nhận cuộc gọi");
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

        // Khi cuộc gọi bị ngắt (từ đối phương)
        socket.on("call-ended", ({ from }) => {
            console.log("📴 Cuộc gọi bị ngắt bởi User", from);
            // ✅ Chỉ cleanup local, KHÔNG emit lại (sử dụng flag)
            setIsEndingCall(true); // Đánh dấu đang ending để tránh emit
            cleanupLocalOnly(); // Cleanup chỉ local, không emit
            setCallStatus("Cuộc gọi đã kết thúc");
        });

        return () => {
            socket.off("incoming-call");
            socket.off("call-answered");
            socket.off("ice-candidate");
            socket.off("call-ended");
        };
    }, [pc, user]);


    useEffect(() => {
        if (incomingCall?.from) {
            fetchReceiver(incomingCall.from);
        }   
    }, [incomingCall, fetchReceiver]);

    // 🎧 Hàm tạo kết nối WebRTC (không thay đổi)
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
                hangUpCall(); // Tự động ngắt nếu kết nối fail
            }
        };

        return peer;
    };

    // 📞 Gọi thoại (không thay đổi)
    const startCall = async () => {
        if (!receiverId || !user?.id) return;

        try {
            setShowCallModal(true);
            setCallStatus("Đang gọi...");
            
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
        }
    };

    // ✅ Chấp nhận cuộc gọi (không thay đổi)
    const acceptCall = async () => {
        if (!incomingCall) return;

        try {
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
        }
    };

    // ❌ Từ chối cuộc gọi (không thay đổi, nhưng dùng flag)
    const rejectCall = () => {
        if (!incomingCall) return;
        
        setIsEndingCall(true); // Đánh dấu để tránh loop nếu cần
        socket.emit("end-call", {
            senderId: String(user.id),
            receiverId: String(incomingCall.from)
        });
        
        setIncomingCall(null);
        setShowCallModal(false);
        setCallStatus("");
    };

    // 📴 Ngắt cuộc gọi (chủ động) - Sửa để tránh loop
    const hangUpCall = () => {
        if (isEndingCall) {
            // Nếu đang ending từ event nhận, chỉ cleanup local
            cleanupLocalOnly();
            return;
        }

        // Nếu chủ động ngắt, emit end-call
        setIsEndingCall(true);
        if (receiverId) {
            socket.emit("end-call", {
                senderId: String(user.id),
                receiverId: String(receiverId)
            });
        }
        cleanupLocalOnly(); // Luôn cleanup local
        
        setShowCallModal(false);
        setCallStatus("");
        setIsInCall(false);
        setIncomingCall(null);
    };

    // Cleanup chỉ local (không emit) - Tách riêng để dùng khi nhận event
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
    };

    // Expose methods qua ref
    useImperativeHandle(ref, () => ({
        startCall,
        hangUpCall,
    }));

    // 🎧 Audio Call Modal (không thay đổi)
    return (
        <>
            {showCallModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">
                                🎧 Cuộc gọi thoại
                            </h3>
                            <button onClick={hangUpCall} className="text-gray-500 hover:text-gray-700">
                                <FiX size={24} />
                            </button>
                        </div>

                        {/* Incoming Call */}
                        {incomingCall && !isInCall && (
                            <div className="text-center mb-4">
                                <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-3 flex items-center justify-center animate-pulse">
                                    <FiPhone size={40} className="text-green-600" />
                                </div>
                                <p className="text-gray-700 mb-2">Cuộc gọi đến từ</p>
                                <p className="font-bold text-lg text-blue-600">
                                    {receiverInfo?.name || `User ${incomingCall.from}`}
                                </p>
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={acceptCall}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                                    >
                                        <FiPhone /> Chấp nhận
                                    </button>
                                    <button
                                        onClick={rejectCall}
                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                                    >
                                        <FiPhoneOff /> Từ chối
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Calling / In Call */}
                        {!incomingCall && (
                            <div className="text-center mb-4">
                                <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                                    <FiPhone size={40} className={`text-blue-600 ${!isInCall ? 'animate-pulse' : ''}`} />
                                </div>
                                <p className="font-bold text-lg text-gray-800 mb-1">
                                    {receiverInfo?.name || user?.name }
                                </p>
                                <p className="text-sm text-gray-600">{callStatus}</p>
                            </div>
                        )}

                        {/* Audio Elements */}
                        <div className="hidden">
                            <audio ref={localAudioRef} autoPlay muted />
                            <audio ref={remoteAudioRef} autoPlay playsInline />
                        </div>

                        {/* Hang Up Button */}
                        {(isInCall || (!incomingCall && pc)) && (
                            <button
                                onClick={hangUpCall}
                                className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium"
                            >
                                <FiPhoneOff size={20} /> Ngắt kết nối
                            </button>
                        )}

                        {/* Debug Info */}
                        <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
                            <p><b>Peer:</b> {pc ? "✅ Active" : "❌ None"}</p>
                            <p><b>Status:</b> {callStatus || "Idle"}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
});


export default AudioCall;