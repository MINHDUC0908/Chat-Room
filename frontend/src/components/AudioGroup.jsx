import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { FiPhone, FiPhoneOff, FiMic, FiMicOff, FiVideo, FiVideoOff, 
    FiMonitor, FiMoreVertical, FiMessageSquare, FiUsers, FiSettings } from "react-icons/fi";
import { io } from "socket.io-client";

const socket = io("http://192.168.1.77:3000");

const AudioGroup = forwardRef(({ user }, ref) => {
    const [showCallModal, setShowCallModal] = useState(false);
    const [currentGroup, setCurrentGroup] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [isInCall, setIsInCall] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(true);
    const [participants, setParticipants] = useState([]);
    const [speaking, setSpeaking] = useState(new Set());
    const [callDuration, setCallDuration] = useState(0);
    const [callStartTime, setCallStartTime] = useState(null);

    const localStreamRef = useRef(null);
    const localVideoRef = useRef(null);
    const peerConnectionsRef = useRef({});
    const timerRef = useRef(null);
    const audioContextRef = useRef(null);
    const currentGroupRef = useRef(null);
    const isInCallRef = useRef(false);

    const iceServers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

    useEffect(() => { currentGroupRef.current = currentGroup; }, [currentGroup]);
    useEffect(() => { isInCallRef.current = isInCall; }, [isInCall]);

    // ✅ ĐĂNG KÝ USER VÀ CHECK ACTIVE CALLS - CHỈ 1 LẦN
    useEffect(() => {
        if (!user?.id) return;

        console.log("🔌 [INIT] Connecting user:", user.id);
        socket.emit("user-connected", { userId: user.id });

        const checkTimer = setTimeout(() => {
            console.log("🔍 [CHECK] Checking active calls for user:", user.id);
            socket.emit("check-active-calls", { userId: user.id });
        }, 1000);

        return () => clearTimeout(checkTimer);
    }, [user?.id]);

    // ✅ ĐĂNG KÝ TẤT CẢ LISTENERS - CHỈ 1 LẦN
    useEffect(() => {
        if (!user?.id) return;

        console.log("📡 [LISTENERS] Registering all socket listeners for user:", user.id);

        // Handler cho incoming call
        const handleIncomingCall = ({ groupId, from, startTime }) => {
            console.log("🔥 [INCOMING CALL] Received!", { groupId, from, startTime });
            setIncomingCall({ groupId, from, startTime });
            setShowCallModal(true);
        };

        // Handler cho active calls
        const handleActiveCallsList = ({ activeCalls }) => {
            console.log("📋 [ACTIVE CALLS]", activeCalls);
            if (activeCalls && activeCalls.length > 0) {
                const firstCall = activeCalls[0];
                setIncomingCall({
                    groupId: firstCall.groupId,
                    from: "Nhóm",
                    startTime: firstCall.startTime,
                    isOngoing: true
                });
                setShowCallModal(true);
            }
        };

        // Handler cho call info
        const handleCallInfo = ({ startTime }) => {
            console.log("ℹ️ [CALL INFO] Start time:", startTime);
            setCallStartTime(startTime);
        };

        // Handler cho user joined
        const handleUserJoined = ({ userId, allParticipants, startTime }) => {
            console.log(`👋 [USER JOINED] User ${userId}, Total: ${allParticipants?.length}`);
            if (allParticipants) setParticipants(allParticipants);
            if (startTime && !callStartTime) setCallStartTime(startTime);
            if (userId !== user?.id && isInCallRef.current) {
                setTimeout(() => createPeerConnection(userId), 500);
            }
        };

        // Handler cho user left
        const handleUserLeft = ({ userId, remainingParticipants }) => {
            console.log(`🚪 [USER LEFT] User ${userId}`);
            if (remainingParticipants) setParticipants(remainingParticipants);
            if (peerConnectionsRef.current[userId]) {
                peerConnectionsRef.current[userId].close();
                delete peerConnectionsRef.current[userId];
            }
        };

        // Handler cho call ended
        const handleCallEnded = () => {
            console.log("🛑 [CALL ENDED]");
            cleanupCall();
        };

        // Đăng ký tất cả listeners
        socket.on("incoming-group-call", handleIncomingCall);
        socket.on("active-calls-list", handleActiveCallsList);
        socket.on("group-call-info", handleCallInfo);
        socket.on("receive-offer", handleReceiveOffer);
        socket.on("receive-answer", handleReceiveAnswer);
        socket.on("receive-ice-candidate", handleReceiveIce);
        socket.on("user-joined-call", handleUserJoined);
        socket.on("user-left-call", handleUserLeft);
        socket.on("group-call-ended", handleCallEnded);

        console.log("✅ [LISTENERS] All registered successfully!");

        return () => {
            console.log("🧹 [CLEANUP] Removing listeners");
            socket.off("incoming-group-call", handleIncomingCall);
            socket.off("active-calls-list", handleActiveCallsList);
            socket.off("group-call-info", handleCallInfo);
            socket.off("receive-offer", handleReceiveOffer);
            socket.off("receive-answer", handleReceiveAnswer);
            socket.off("receive-ice-candidate", handleReceiveIce);
            socket.off("user-joined-call", handleUserJoined);
            socket.off("user-left-call", handleUserLeft);
            socket.off("group-call-ended", handleCallEnded);
        };
    }, [user?.id]);

    // Audio detection
    useEffect(() => {
        if (!isInCall || !localStreamRef.current) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(localStreamRef.current);
        source.connect(analyser);
        analyser.fftSize = 512;

        const checkVolume = () => {
            const data = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(data);
            const average = data.reduce((a, b) => a + b) / data.length;

            if (average > 40) {
                setSpeaking(prev => new Set(prev).add(user?.id));
            } else {
                setSpeaking(prev => {
                    const next = new Set(prev);
                    next.delete(user?.id);
                    return next;
                });
            }

            if (isInCallRef.current) requestAnimationFrame(checkVolume);
        };

        checkVolume();
        audioContextRef.current = audioContext;

        return () => audioContext.close();
    }, [isInCall, user?.id]);

    const createPeerConnection = async (targetUserId) => {
        if (!currentGroupRef.current?.id || targetUserId === user?.id || peerConnectionsRef.current[targetUserId]) return;

        console.log("🔗 [PEER] Creating connection to:", targetUserId);
        const pc = new RTCPeerConnection(iceServers);
        localStreamRef.current?.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));

        pc.ontrack = (e) => {
            const remoteVideo = document.getElementById(`video-${targetUserId}`);
            if (remoteVideo) remoteVideo.srcObject = e.streams[0];
        };

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                socket.emit("send-ice-candidate", {
                    groupId: currentGroupRef.current.id,
                    fromUserId: user?.id,
                    toUserId: targetUserId,
                    candidate: e.candidate
                });
            }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("send-offer-to-group", {
            groupId: currentGroupRef.current.id,
            fromUserId: user?.id,
            toUserId: targetUserId,
            offer
        });

        peerConnectionsRef.current[targetUserId] = pc;
    };

    const handleReceiveOffer = async ({ fromUserId, offer, groupId }) => {
        if (fromUserId === user?.id || peerConnectionsRef.current[fromUserId]) return;

        if (!currentGroupRef.current?.id && groupId) {
            setCurrentGroup({ id: groupId });
            currentGroupRef.current = { id: groupId };
        }

        const pc = new RTCPeerConnection(iceServers);
        localStreamRef.current?.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));

        pc.ontrack = (e) => {
            const remoteVideo = document.getElementById(`video-${fromUserId}`);
            if (remoteVideo) remoteVideo.srcObject = e.streams[0];
        };

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                socket.emit("send-ice-candidate", {
                    groupId: currentGroupRef.current.id,
                    fromUserId: user?.id,
                    toUserId: fromUserId,
                    candidate: e.candidate
                });
            }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("send-answer-to-user", {
            groupId: currentGroupRef.current.id,
            fromUserId: user?.id,
            toUserId: fromUserId,
            answer
        });

        peerConnectionsRef.current[fromUserId] = pc;
    };

    const handleReceiveAnswer = async ({ fromUserId, answer }) => {
        const pc = peerConnectionsRef.current[fromUserId];
        if (pc && !pc.remoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    };

    const handleReceiveIce = async ({ fromUserId, candidate }) => {
        const pc = peerConnectionsRef.current[fromUserId];
        if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    };

    useEffect(() => {
        if (isInCall && callStartTime) {
            const updateDuration = () => {
                const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
                setCallDuration(elapsed);
            };

            updateDuration();
            timerRef.current = setInterval(updateDuration, 1000);
        } else {
            clearInterval(timerRef.current);
            if (!isInCall) setCallDuration(0);
        }

        return () => clearInterval(timerRef.current);
    }, [isInCall, callStartTime]);

    const startGroupCall = async (group) => {
        try {
            console.log("🎙️ [START CALL] For group:", group.id);
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: !isVideoOff 
            });
            localStreamRef.current = stream;
            
            if (localVideoRef.current && !isVideoOff) {
                localVideoRef.current.srcObject = stream;
            }
            
            const startTime = Date.now();
            setCallStartTime(startTime);
            setCurrentGroup(group);
            currentGroupRef.current = group;
            setIsInCall(true);
            setShowCallModal(true);
            setParticipants([user?.id]);

            socket.emit("start-group-call", {
                groupId: group.id,
                senderId: user?.id,
                startTime
            });
            
            socket.emit("user-joined-group-call", {
                groupId: group.id,
                userId: user?.id
            });

            console.log("✅ [START CALL] Success!");
        } catch (err) {
            console.error("❌ [START CALL] Error:", err);
            alert("Không thể truy cập microphone/camera");
        }
    };

    const acceptCall = async () => {
        try {
            console.log("✅ [ACCEPT CALL] Group:", incomingCall.groupId);
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: !isVideoOff 
            });
            localStreamRef.current = stream;
            
            if (localVideoRef.current && !isVideoOff) {
                localVideoRef.current.srcObject = stream;
            }
            
            const group = { id: incomingCall.groupId };
            setCurrentGroup(group);
            currentGroupRef.current = group;
            setIsInCall(true);
            
            if (incomingCall.startTime) {
                setCallStartTime(incomingCall.startTime);
            }
            
            setIncomingCall(null);

            socket.emit("user-joined-group-call", {
                groupId: group.id,
                userId: user?.id
            });

            console.log("✅ [ACCEPT] Success!");
        } catch (err) {
            console.error("❌ [ACCEPT] Error:", err);
            alert("Không thể tham gia cuộc gọi");
        }
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

    const toggleVideo = async () => {
        if (!localStreamRef.current) return;

        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        
        if (isVideoOff) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newVideoTrack = stream.getVideoTracks()[0];
                
                if (videoTrack) {
                    localStreamRef.current.removeTrack(videoTrack);
                    videoTrack.stop();
                }
                
                localStreamRef.current.addTrack(newVideoTrack);
                
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = localStreamRef.current;
                }
                
                Object.values(peerConnectionsRef.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(newVideoTrack);
                    } else {
                        pc.addTrack(newVideoTrack, localStreamRef.current);
                    }
                });
                
                setIsVideoOff(false);
            } catch (err) {
                console.error("Không thể bật camera:", err);
            }
        } else {
            if (videoTrack) {
                videoTrack.stop();
                localStreamRef.current.removeTrack(videoTrack);
            }
            setIsVideoOff(true);
        }
    };

    const endCall = () => {
        socket.emit("leave-group-call", {
            groupId: currentGroupRef.current?.id,
            userId: user?.id
        });
        cleanupCall();
    };

    const cleanupCall = () => {
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
        peerConnectionsRef.current = {};
        audioContextRef.current?.close();
        setShowCallModal(false);
        setIsInCall(false);
        setParticipants([]);
        setCurrentGroup(null);
        setIncomingCall(null);
        setSpeaking(new Set());
        setCallStartTime(null);
        setCallDuration(0);
    };

    const formatTime = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
    };

    useImperativeHandle(ref, () => ({ startGroupCall }));

    if (!showCallModal) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-gray-900 flex flex-col">
            {incomingCall && !isInCall ? (
                <div className="h-full flex flex-col items-center justify-center gap-8 text-center bg-gray-900">
                    <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center animate-pulse">
                        <FiPhone className="text-white text-6xl" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-semibold text-white mb-2">
                            {incomingCall.isOngoing ? "Cuộc gọi đang diễn ra" : "Cuộc gọi đến"}
                        </h3>
                        <p className="text-gray-400 text-lg">Nhóm {incomingCall.groupId}</p>
                    </div>
                    <div className="flex gap-8">
                        <button
                            onClick={() => {
                                setShowCallModal(false);
                                setIncomingCall(null);
                            }}
                            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition shadow-lg"
                        >
                            <FiPhoneOff className="text-3xl text-white" />
                        </button>
                        <button
                            onClick={acceptCall}
                            className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center transition shadow-lg animate-pulse"
                        >
                            <FiPhone className="text-3xl text-white" />
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex-1 relative overflow-hidden bg-gray-900">
                        <div className="absolute top-4 left-4 flex items-center gap-3 bg-gray-800/90 backdrop-blur px-4 py-2 rounded-full z-10">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-white text-sm font-medium">{formatTime(callDuration)}</span>
                        </div>

                        <div className="w-full h-full p-4 grid gap-4 auto-rows-fr" style={{
                            gridTemplateColumns: participants.length === 1 ? '1fr' : 
                                                participants.length === 2 ? 'repeat(2, 1fr)' :
                                                participants.length <= 4 ? 'repeat(2, 1fr)' :
                                                participants.length <= 9 ? 'repeat(3, 1fr)' :
                                                'repeat(4, 1fr)'
                        }}>
                            {participants.map(id => {
                                const isMe = id === user?.id;
                                const talking = speaking.has(id);
                                return (
                                    <div key={id} className="relative bg-gray-800 rounded-2xl overflow-hidden group">
                                        {isMe && !isVideoOff ? (
                                            <video
                                                ref={localVideoRef}
                                                autoPlay
                                                muted
                                                playsInline
                                                className="w-full h-full object-cover"
                                            />
                                        ) : !isMe ? (
                                            <video
                                                id={`video-${id}`}
                                                autoPlay
                                                playsInline
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                                                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-5xl font-bold">
                                                    {user?.name?.charAt(0).toUpperCase() || "U"}
                                                </div>
                                            </div>
                                        )}

                                        {talking && (
                                            <div className="absolute inset-0 ring-4 ring-green-500 rounded-2xl pointer-events-none"></div>
                                        )}

                                        <div className="absolute bottom-3 left-3 bg-gray-900/80 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2">
                                            <span className="text-white text-sm font-medium">
                                                {isMe ? "Bạn" : `User ${id}`}
                                            </span>
                                            {isMe && isMuted && (
                                                <FiMicOff className="text-red-400 text-sm" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-gray-900 border-t border-gray-800 px-6 py-4">
                        <div className="max-w-2xl mx-auto flex justify-center items-center gap-3">
                            <button
                                onClick={toggleMute}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg
                                    ${isMuted ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"}`}
                            >
                                {isMuted ? <FiMicOff className="text-xl text-white" /> : <FiMic className="text-xl text-white" />}
                            </button>

                            <button
                                onClick={toggleVideo}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg
                                    ${isVideoOff ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"}`}
                            >
                                {isVideoOff ? <FiVideoOff className="text-xl text-white" /> : <FiVideo className="text-xl text-white" />}
                            </button>

                            <button
                                onClick={endCall}
                                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition shadow-lg ml-4"
                            >
                                <FiPhoneOff className="text-xl text-white" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
});

export default AudioGroup;