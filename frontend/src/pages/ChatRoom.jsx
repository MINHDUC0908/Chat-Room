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

const socket = io("http://192.168.1.77:3000");
function ChatRoom({ setCurrentTitle }) {
    const { id: receiverId } = useParams();
    const { user } = useAuth();
    const [message, setMessage] = useState("");
    const [previewImage, setPreviewImage] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);

    const {receiverInfo, fetchReceiver } = useUser();
    const { chat, setChat, fetchMessages } = useChat()
    const messagesEndRef = useRef(null);
    const imageRef = useRef(null);
    const [emoji, setEmoji] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, [chat]);
    // Hiển thị tin nhắn
    useEffect(() => {
        if (receiverId) fetchReceiver();
    }, [receiverId]);
    useEffect(() => {
        setCurrentTitle(`Hộp thư - Direct`);
    }, [receiverId, setCurrentTitle]);

    useEffect(() => {
        if (user) fetchMessages(receiverId);
    }, [receiverId, user]);

    useEffect(() => {
        if (!user) return;

        socket.emit("join", user.id);

        // Lắng nghe tin nhắn văn bản
        socket.on("private_message", (msg) => {
            if (
                (msg.sender_id === user.id && msg.receiver_id === parseInt(receiverId)) ||
                (msg.sender_id === parseInt(receiverId) && msg.receiver_id === user.id)
            ) {
                setChat((prev) => [...prev, msg]);
            }
        });

        // Lắng nghe tin nhắn ảnh từ server
        socket.on("new_message", (msg) => {
            if (
                (msg.senderId === user.id && msg.receiverId === parseInt(receiverId)) ||
                (msg.senderId === parseInt(receiverId) && msg.receiverId === user.id)
            ) {
                // ✅ Map đúng field từ server sang client
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

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        setPreviewImage(previewUrl);
        setUploadFile(file);
    };

    const sendMessage = async (e) => {
        e.preventDefault();

        // Gửi tin nhắn text trước (nếu có)
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
                    console.log("📷 Sending image via socket:", imageUrl);

                    socket.emit("send_image_message", {
                        senderId: user.id,
                        receiverId: parseInt(receiverId),
                        fileUrl: imageUrl,  
                    });

                    // Reset preview
                    setPreviewImage(null);
                    setUploadFile(null);
                } else {
                    console.error("❌ Upload failed:", res.data);
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
        <div className="p-4 flex flex-col h-screen">
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
                        onClick={() => console.log("Gọi video")}
                    />
                </div>
            </div>
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
                                                console.error("❌ Image load failed:", msg.image_url);
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
            {previewImage && (
                <div className="flex justify-end mb-2">
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
            <ImageModal
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                imageUrl={selectedImage}
            />
        </div>
    );
}

export default ChatRoom;