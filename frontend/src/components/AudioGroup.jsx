import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { FiPhone, FiPhoneOff, FiMic, FiMicOff, FiUsers, FiX } from "react-icons/fi";
import { io } from "socket.io-client";

const socket = io("http://192.168.1.77:3000/");

const AudioGroup = forwardRef(({ groupId, groupName, user, onClose }, ref) => {
    const [showCallModal, setShowCallModal] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null);
    const [callStatus, setCallStatus] = useState("");
    const [peerConnections, setPeerConnections] = useState({});
    const [isInCall, setIsInCall] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [showEndCallScreen, setShowEndCallScreen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [localStream, setLocalStream] = useState(null);
    
    const localStreamRef = useRef(null);
    const timerRef = useRef(null);
    const remoteAudiosRef = useRef({});

    const iceServers = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
        ],
    };

    useEffect(() => {
        socket.emit("join_group", { groupId });

        socket.on("incoming-group-call", handleIncomingCall);
        socket.on("user-joined-call", handleUserJoined);
        socket.on("group-call-answered", handleCallAnswered);
        socket.on("group-ice-candidate", handleIceCandidate);
        socket.on("user-left-call", handleUserLeft);
        socket.on("group-call-ended", handleCallEnded);

        return () => {
            socket.off("incoming-group-call");
            socket.off("user-joined-call");
            socket.off("group-call-answered");
            socket.off("group-ice-candidate");
            socket.off("user-left-call");
            socket.off("group-call-ended");
            cleanupCall();
        };
    }, [groupId]);

    useEffect(() => {
        if (isInCall) {
            timerRef.current = setInterval(() => {
                setCallDuration((prev) => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isInCall]);

    const handleIncomingCall = ({ groupId: incomingGroupId, from, offer, callId }) => {
        if (incomingGroupId === groupId) {
            setIncomingCall({ from, offer, callId });
            setShowCallModal(true);
            setCallStatus("Cuộc gọi nhóm đến...");
        }
    };

    const handleUserJoined = async ({ userId, offer }) => {
        console.log(`User ${userId} joined call`);
        
        const pc = new RTCPeerConnection(iceServers);
        
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        pc.ontrack = (event) => {
            console.log(`Received track from user ${userId}`);
            if (!remoteAudiosRef.current[userId]) {
                const audio = new Audio();
                audio.srcObject = event.streams[0];
                audio.autoplay = true;
                remoteAudiosRef.current[userId] = audio;
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("group-ice-candidate", {
                    groupId,
                    fromUserId: user.id,
                    toUserId: userId,
                    candidate: event.candidate,
                });
            }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("answer-group-call", {
            groupId,
            fromUserId: user.id,
            toUserId: userId,
            answer,
        });

        setPeerConnections(prev => ({ ...prev, [userId]: pc }));
        setParticipants(prev => [...new Set([...prev, userId])]);
    };

    const handleCallAnswered = async ({ from, answer }) => {
        console.log(`User ${from} answered`);
        const pc = peerConnections[from];
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    };

    const handleIceCandidate = async ({ from, candidate }) => {
        const pc = peerConnections[from];
        if (pc && candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    };

    const handleUserLeft = ({ userId }) => {
        console.log(`User ${userId} left call`);
        
        if (peerConnections[userId]) {
            peerConnections[userId].close();
            setPeerConnections(prev => {
                const newPCs = { ...prev };
                delete newPCs[userId];
                return newPCs;
            });
        }

        if (remoteAudiosRef.current[userId]) {
            remoteAudiosRef.current[userId].pause();
            delete remoteAudiosRef.current[userId];
        }

        setParticipants(prev => prev.filter(id => id !== userId));
    };

    const handleCallEnded = ({ endedBy }) => {
        console.log(`Call ended by user ${endedBy}`);
        setCallStatus(`Cuộc gọi đã kết thúc`);
        setShowEndCallScreen(true);
        setTimeout(() => {
            cleanupCall();
            if (onClose) onClose();
        }, 2000);
    };

    const startGroupCall = async () => {
        try {
            setCallStatus("Đang bắt đầu cuộc gọi...");
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: false 
            });
            
            localStreamRef.current = stream;
            setLocalStream(stream);

            const pc = new RTCPeerConnection(iceServers);
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit("start-group-call", {
                groupId,
                senderId: user.id,
                offer,
                type: "voice"
            });

            console.log("Group call started, waiting for others to join", offer, groupId, user.id);

            setIsInCall(true);
            setShowCallModal(true);
            setCallStatus("Đang trong cuộc gọi");
            setParticipants([user.id]);
        } catch (error) {
            console.error("Error starting call:", error);
            alert("Không thể bắt đầu cuộc gọi. Vui lòng cho phép quyền truy cập microphone.");
        }
    };

    const acceptCall = async () => {
        if (!incomingCall) return;

        try {
            setCallStatus("Đang tham gia...");
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: false 
            });
            
            localStreamRef.current = stream;
            setLocalStream(stream);

            const pc = new RTCPeerConnection(iceServers);
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.ontrack = (event) => {
                const audio = new Audio();
                audio.srcObject = event.streams[0];
                audio.autoplay = true;
                remoteAudiosRef.current[incomingCall.from] = audio;
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("group-ice-candidate", {
                        groupId,
                        fromUserId: user.id,
                        toUserId: incomingCall.from,
                        candidate: event.candidate,
                    });
                }
            };

            await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
            
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit("answer-group-call", {
                groupId,
                fromUserId: user.id,
                toUserId: incomingCall.from,
                answer,
            });

            socket.emit("join-group-call", {
                groupId,
                userId: user.id,
                offer: answer
            });

            setPeerConnections(prev => ({ ...prev, [incomingCall.from]: pc }));
            setParticipants([user.id, incomingCall.from]);
            setIsInCall(true);
            setCallStatus("Đang trong cuộc gọi");
            setIncomingCall(null);
        } catch (error) {
            console.error("Error accepting call:", error);
            alert("Không thể tham gia cuộc gọi. Vui lòng cho phép quyền truy cập microphone.");
        }
    };

    const rejectCall = () => {
        setIncomingCall(null);
        setShowCallModal(false);
        setCallStatus("");
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const endCall = () => {
        socket.emit("leave-group-call", {
            groupId,
            userId: user.id
        });

        cleanupCall();
        if (onClose) onClose();
    };

    const endCallForAll = () => {
        socket.emit("end-group-call", {
            groupId,
            userId: user.id
        });

        cleanupCall();
        if (onClose) onClose();
    };

    const cleanupCall = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        Object.values(peerConnections).forEach(pc => pc.close());
        setPeerConnections({});

        Object.values(remoteAudiosRef.current).forEach(audio => audio.pause());
        remoteAudiosRef.current = {};

        setIsInCall(false);
        setShowCallModal(false);
        setCallDuration(0);
        setIsMuted(false);
        setParticipants([]);
        setLocalStream(null);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Expose methods qua ref
    useImperativeHandle(ref, () => ({
        startGroupCall,
        handleCallAnswered,
    }));

    return (
        <div className="relative">
            {showCallModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl w-full max-w-md p-8 text-white">
                        
                        {/* Màn hình kết thúc cuộc gọi */}
                        {showEndCallScreen ? (
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                                    <FiPhoneOff size={40} className="text-red-300" />
                                </div>
                                <h3 className="text-2xl font-bold">Cuộc gọi đã kết thúc</h3>
                                <p className="text-white/80">Thời gian: {formatTime(callDuration)}</p>
                            </div>
                        ) : incomingCall && !isInCall ? (
                            /* Màn hình cuộc gọi đến */
                            <div className="text-center space-y-6">
                                <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                                    <FiUsers size={48} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold mb-2">{groupName || "Nhóm"}</h3>
                                    <p className="text-white/80">{callStatus}</p>
                                </div>

                                <div className="flex justify-center gap-6 pt-4">
                                    <button
                                        onClick={rejectCall}
                                        className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all hover:scale-110"
                                    >
                                        <FiPhoneOff size={28} />
                                    </button>
                                    <button
                                        onClick={acceptCall}
                                        className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-all hover:scale-110 animate-pulse"
                                    >
                                        <FiPhone size={28} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Màn hình trong cuộc gọi */
                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                                        <FiUsers size={48} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-1">{groupName || "Nhóm"}</h3>
                                    <p className="text-white/80 mb-2">{callStatus}</p>
                                    <p className="text-3xl font-mono font-bold">{formatTime(callDuration)}</p>
                                </div>

                                {/* Danh sách thành viên */}
                                <div className="bg-white/10 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FiUsers size={18} />
                                        <span className="font-semibold">Thành viên ({participants.length})</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {participants.slice(0, 6).map((participantId) => (
                                            <div
                                                key={participantId}
                                                className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5"
                                            >
                                                <img
                                                    src={`https://i.pravatar.cc/40?u=${participantId}`}
                                                    alt="avatar"
                                                    className="w-6 h-6 rounded-full"
                                                />
                                                <span className="text-sm">
                                                    {participantId === user.id ? "Bạn" : `User ${participantId}`}
                                                </span>
                                            </div>
                                        ))}
                                        {participants.length > 6 && (
                                            <div className="flex items-center justify-center bg-white/10 rounded-full w-10 h-10 text-sm">
                                                +{participants.length - 6}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Các nút điều khiển */}
                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={toggleMute}
                                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                                            isMuted 
                                                ? 'bg-red-500 hover:bg-red-600' 
                                                : 'bg-white/20 hover:bg-white/30'
                                        }`}
                                    >
                                        {isMuted ? <FiMicOff size={24} /> : <FiMic size={24} />}
                                    </button>
                                    <button
                                        onClick={endCall}
                                        className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all hover:scale-110"
                                    >
                                        <FiPhoneOff size={24} />
                                    </button>
                                    <button
                                        onClick={endCallForAll}
                                        className="px-4 h-14 bg-red-700 hover:bg-red-800 rounded-full flex items-center justify-center gap-2 transition-all hover:scale-105 text-sm font-semibold"
                                    >
                                        <FiX size={20} />
                                        <span>Kết thúc cho tất cả</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

export default AudioGroup;