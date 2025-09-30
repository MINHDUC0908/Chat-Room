import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import api from "../api/api";
import { FiImage, FiPhone, FiSend, FiVideo } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";
import Emoji from "../components/Emoji";
import useUser from "../hooks/useUser";
import useChat from "../hooks/useChat";
import ImageModal from "../components/Image";
import VideoCallModal from "../components/VideoCallModal";

const socket = io("http://192.168.1.77:3000");

// STUN servers (Google's free STUN server)
const iceServers = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ]
};

function ChatRoom({ setCurrentTitle }) {
    const { id: receiverId } = useParams();
    const { user } = useAuth();
    const [message, setMessage] = useState("");
    const [previewImage, setPreviewImage] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);

    const { receiverInfo, fetchReceiver } = useUser();
    const { chat, setChat, fetchMessages } = useChat();
    const messagesEndRef = useRef(null);
    const imageRef = useRef(null);
    const [emoji, setEmoji] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    // Video Call States
    const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
    const [isCalling, setIsCalling] = useState(false);
    const [isReceiving, setIsReceiving] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [peerConnection, setPeerConnection] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [incomingCallerId, setIncomingCallerId] = useState(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, [chat]);

    useEffect(() => {
        if (receiverId) fetchReceiver(receiverId);
    }, [receiverId]);

    useEffect(() => {
        setCurrentTitle(`Hộp thư - Direct`);
    }, [receiverId, setCurrentTitle]);

    useEffect(() => {
        if (user) fetchMessages(receiverId);
    }, [receiverId, user]);

    // Socket handlers for chat
    useEffect(() => {
        if (!user) return;

        socket.emit("join", user.id);

        socket.on("private_message", (msg) => {
            if (
                (msg.sender_id === user.id && msg.receiver_id === parseInt(receiverId)) ||
                (msg.sender_id === parseInt(receiverId) && msg.receiver_id === user.id)
            ) {
                setChat((prev) => [...prev, msg]);
            }
        });

        socket.on("new_message", (msg) => {
            if (
                (msg.senderId === user.id && msg.receiverId === parseInt(receiverId)) ||
                (msg.senderId === parseInt(receiverId) && msg.receiverId === user.id)
            ) {
                setChat((prev) => [...prev, {
                    sender_id: msg.senderId,
                    receiver_id: msg.receiverId,
                    content: msg.content || null,
                    image_url: msg.imageUrl,
                    is_read: msg.isRead || false,
                    created_at: msg.createdAt
                }]);
            }
        });

        socket.emit("mark_as_read", {
            userId: user.id,
            senderId: receiverId
        });

        return () => {
            socket.off("private_message");
            socket.off("new_message");
            socket.off("messages_read");
        };
    }, [user, receiverId]);

    // Video Call Socket Handlers
    useEffect(() => {
        if (!user) return;

        // Nhận cuộc gọi đến
        socket.on("incoming_video_call", ({ callerId, callerName }) => {
            console.log("📞 Incoming call from:", callerId);
            setIncomingCallerId(callerId);
            setIsReceiving(true);
            setIsVideoCallOpen(true);
        });

        // Cuộc gọi được chấp nhận
        socket.on("video_call_accepted", async () => {
            console.log("✅ Call accepted, creating offer...");
            setIsCalling(false);
            await createOffer();
        });

        // Cuộc gọi bị từ chối
        socket.on("video_call_rejected", () => {
            alert("Cuộc gọi bị từ chối");
            endCall();
        });

        // Nhận WebRTC offer
        socket.on("video_offer", async ({ offer }) => {
            console.log("📥 Received offer");
            await handleReceiveOffer(offer);
        });

        // Nhận WebRTC answer
        socket.on("video_answer", async ({ answer }) => {
            console.log("📥 Received answer");
            await handleReceiveAnswer(answer);
        });

        // Nhận ICE candidate
        socket.on("ice_candidate", async ({ candidate }) => {
            console.log("🧊 Received ICE candidate");
            if (peerConnection && candidate) {
                try {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error("Error adding ICE candidate:", err);
                }
            }
        });

        // Cuộc gọi kết thúc
        socket.on("video_call_ended", () => {
            console.log("☎️ Call ended by remote user");
            endCall();
        });

        return () => {
            socket.off("incoming_video_call");
            socket.off("video_call_accepted");
            socket.off("video_call_rejected");
            socket.off("video_offer");
            socket.off("video_answer");
            socket.off("ice_candidate");
            socket.off("video_call_ended");
        };
    }, [user, peerConnection]);

    // Khởi tạo WebRTC Connection
    const initializePeerConnection = () => {
        const pc = new RTCPeerConnection(iceServers);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("🧊 Sending ICE candidate");
                socket.emit("ice_candidate", {
                    candidate: event.candidate,
                    receiverId: parseInt(receiverId)
                });
            }
        };

        pc.ontrack = (event) => {
            console.log("📹 Received remote stream");
            setRemoteStream(event.streams[0]);
        };

        pc.oniceconnectionstatechange = () => {
            console.log("ICE Connection State:", pc.iceConnectionState);
        };

        setPeerConnection(pc);
        return pc;
    };

    // Bắt đầu gọi video
    const startVideoCall = async () => {
    try {
        console.log("📞 Starting video call...");
        
        // 1. LẤY CAMERA TRƯỚC - Quan trọng!
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        setLocalStream(stream);
        console.log("✅ Got local stream");

        // 2. Mới hiển thị modal
        setIsCalling(true);
        setIsVideoCallOpen(true);

        // 3. Gửi yêu cầu gọi
        socket.emit("video_call_request", {
            callerId: user.id,
            receiverId: parseInt(receiverId),
            callerName: user.name
        });
        
        console.log("📞 Call request sent");

    } catch (error) {
        console.error("❌ Error starting video call:", error);
        alert("Không thể truy cập camera/microphone");
        endCall();
    }
};

    // Tạo WebRTC Offer
    const createOffer = async () => {
    try {
        console.log("📤 Creating offer...");
        
        // Đảm bảo có localStream
        if (!localStream) {
            console.error("❌ No local stream when creating offer!");
            // Thử lấy lại
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            setLocalStream(stream);
            console.log("✅ Got local stream (retry)");
        }
        
        // Đợi 100ms để đảm bảo state đã update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const currentStream = localStream;
        if (!currentStream) {
            console.error("❌ Still no stream!");
            return;
        }
        
        const pc = initializePeerConnection();

        // Thêm tracks
        currentStream.getTracks().forEach(track => {
            console.log("➕ Adding track to offer:", track.kind, track.enabled);
            pc.addTrack(track, currentStream);
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        console.log("📤 Sending offer");
        socket.emit("video_offer", {
            offer: offer,
            receiverId: parseInt(receiverId)
        });

        console.log("✅ Offer sent");
    } catch (error) {
        console.error("❌ Error creating offer:", error);
    }
};
    // Xử lý khi nhận offer
    const handleReceiveOffer = async (offer) => {
        try {
            console.log("📥 Handling received offer...");
            const pc = initializePeerConnection();

            // Lấy local stream nếu chưa có
            if (!localStream) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                setLocalStream(stream);

                stream.getTracks().forEach(track => {
                    pc.addTrack(track, stream);
                });
            } else {
                localStream.getTracks().forEach(track => {
                    pc.addTrack(track, localStream);
                });
            }

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit("video_answer", {
                answer: answer,
                receiverId: parseInt(receiverId)
            });

            console.log("✅ Answer sent");
        } catch (error) {
            console.error("❌ Error handling offer:", error);
        }
    };

    // Xử lý khi nhận answer
    const handleReceiveAnswer = async (answer) => {
        try {
            if (peerConnection) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                console.log("✅ Answer processed");
            }
        } catch (error) {
            console.error("❌ Error handling answer:", error);
        }
    };

    // Chấp nhận cuộc gọi
    const acceptCall = async () => {
        try {
            console.log("✅ Accepting call...");
            setIsReceiving(false);
            
            // Lấy local stream trước khi accept
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            setLocalStream(stream);

            socket.emit("accept_video_call", {
                callerId: incomingCallerId,
                receiverId: user.id
            });
        } catch (error) {
            console.error("❌ Error accepting call:", error);
            alert("Không thể truy cập camera/microphone");
            endCall();
        }
    };

    // Từ chối cuộc gọi
    const rejectCall = () => {
        console.log("❌ Rejecting call");
        socket.emit("reject_video_call", {
            callerId: incomingCallerId,
            receiverId: user.id
        });
        endCall();
    };

    // Kết thúc cuộc gọi
    const endCall = () => {
        console.log("☎️ Ending call...");
        
        // Dừng tất cả tracks
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
        }

        // Đóng peer connection
        if (peerConnection) {
            peerConnection.close();
        }

        // Thông báo cho người kia
        if (isVideoCallOpen) {
            socket.emit("end_video_call", {
                receiverId: parseInt(receiverId)
            });
        }

        // Reset states
        setIsVideoCallOpen(false);
        setIsCalling(false);
        setIsReceiving(false);
        setLocalStream(null);
        setRemoteStream(null);
        setPeerConnection(null);
        setIsMuted(false);
        setIsVideoOff(false);
        setIncomingCallerId(null);
    };

    // Toggle mute
    const toggleMute = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    // Toggle video
    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        setPreviewImage(previewUrl);
        setUploadFile(file);
    };

    const sendMessage = async (e) => {
        e.preventDefault();

        if (message.trim()) {
            const newMsg = {
                sender_id: user.id,
                receiver_id: parseInt(receiverId),
                content: message,
            };
            socket.emit("private_message", newMsg);
            setMessage("");
        }

        if (uploadFile) {
            const formData = new FormData();
            formData.append("image", uploadFile);
            formData.append("receiverId", receiverId);
            try {
                const res = await axios.post(api + "image/upload-message-image", formData, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "multipart/form-data",
                    },
                });
                if (res.data.success && res.data.message?.imageUrl) {
                    const imageUrl = res.data.message.imageUrl;
                    socket.emit("send_image_message", {
                        senderId: user.id,
                        receiverId: parseInt(receiverId),
                        fileUrl: imageUrl,
                    });
                    setPreviewImage(null);
                    setUploadFile(null);
                } else {
                    alert("Upload ảnh thất bại!");
                }
            } catch (error) {
                console.error("❌ Lỗi upload ảnh:", error);
                alert("Có lỗi khi upload ảnh!");
            }
        }
    };

    const handleSelectEmoji = (emoji) => {
        setMessage(prev => prev + emoji);
    };

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white shadow-md rounded-t-lg border-b mb-1">
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg">
                        {receiverInfo?.name}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <FiPhone
                        className="w-6 h-6 text-green-500 cursor-pointer hover:scale-110 transition-transform"
                        title="Gọi thoại"
                        onClick={() => console.log("Gọi thoại")}
                    />
                    <FiVideo
                        className="w-6 h-6 text-blue-500 cursor-pointer hover:scale-110 transition-transform"
                        title="Gọi video"
                        onClick={startVideoCall}
                    />
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-white">
                {chat.map((msg, i) => {
                    const isCurrentUser = msg.sender_id === user?.id;
                    const prevMsg = i > 0 ? chat[i - 1] : null;
                    const nextMsg = i < chat.length - 1 ? chat[i + 1] : null;
                    const showAvatar = !isCurrentUser && (!nextMsg || nextMsg.sender_id !== msg.sender_id);
                    const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                    const isLastMessage = i === chat.length - 1;

                    return (
                        <div key={i} className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                            <div
                                className={`flex mb-1 ${isCurrentUser ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-2' : ''}`}
                            >
                                {!isCurrentUser && (
                                    <div className="w-8 h-8 mr-2 mt-auto">
                                        {showAvatar && (
                                            <img
                                                src={`https://i.pravatar.cc/50?u=${msg.sender_id}`}
                                                alt=""
                                                className="w-7 h-7 rounded-full object-cover"
                                            />
                                        )}
                                    </div>
                                )}

                                <div
                                    className={`max-w-xs px-3 py-2 text-sm ${
                                        isCurrentUser
                                            ? 'bg-blue-500 text-white rounded-2xl'
                                            : 'bg-gray-200 text-black rounded-2xl'
                                    }`}
                                >
                                    {msg.image_url && (
                                        <img
                                            src={`http://192.168.1.77:3000${msg.image_url}`}
                                            alt="message"
                                            className="max-w-[200px] max-h-[200px] rounded-lg mb-2 cursor-pointer"
                                            onClick={() =>
                                                setSelectedImage(`http://192.168.1.77:3000${msg.image_url}`)
                                            }
                                            onLoad={() => {
                                                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                                            }}
                                            onError={(e) => {
                                                e.target.style.display = "none";
                                            }}
                                        />
                                    )}
                                    {msg.content}
                                </div>
                            </div>
                            {isLastMessage && msg.is_read && (
                                <div className="text-xs text-gray-500 mt-1">
                                    <img
                                        src={`https://i.pravatar.cc/30?u=${1}`}
                                        alt="Đã xem"
                                        className="w-4 h-4 rounded-full inline-block"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Image Preview */}
            {previewImage && (
                <div className="flex justify-end mb-2 px-4">
                    <div className="rounded-2xl max-w-xs">
                        <img
                            src={previewImage}
                            alt="preview"
                            className="max-w-[200px] max-h-[200px] rounded-lg"
                        />
                        <div className="flex justify-end mt-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setPreviewImage(null);
                                    setUploadFile(null);
                                }}
                                className="text-red-500 text-xs"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Input Form */}
            <form onSubmit={sendMessage} className="flex items-center p-2 border-t bg-white">
                <label htmlFor="file-upload" className="p-2 text-gray-500 hover:text-gray-700 cursor-pointer">
                    <FiImage size={20} />
                </label>
                <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                />
                <button
                    type="button"
                    onClick={() => setEmoji(!emoji)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                >
                    <BsEmojiSmile size={20} />
                </button>
                <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onClick={() => {
                        if (user?.id && receiverId) {
                            socket.emit("mark_as_read", {
                                userId: user.id,
                                senderId: receiverId,
                            });
                        }
                    }}
                    className="flex-1 mx-2 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <div ref={imageRef} />
                <button
                    type="submit"
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center"
                >
                    <FiSend />
                </button>
            </form>

            {emoji && <Emoji onSelect={handleSelectEmoji} />}

            {/* Video Call Modal */}
            <VideoCallModal
                isOpen={isVideoCallOpen}
                onClose={endCall}
                localStream={localStream}
                remoteStream={remoteStream}
                isCalling={isCalling}
                isReceiving={isReceiving}
                onAccept={acceptCall}
                onReject={rejectCall}
                callerName={receiverInfo?.name}
                isMuted={isMuted}
                isVideoOff={isVideoOff}
                onToggleMute={toggleMute}
                onToggleVideo={toggleVideo}
            />

            {/* Image Modal */}
            <ImageModal
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                imageUrl={selectedImage}
            />
        </div>
    );
}

export default ChatRoom;