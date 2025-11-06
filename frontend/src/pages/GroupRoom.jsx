import { useState, useRef, useEffect } from "react";
import { FiSend, FiImage, FiUsers, FiPhone, FiVideo } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";
import Emoji from "../components/Emoji";
import useGroup from "../hooks/useGroup";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { io } from "socket.io-client";
import useUser from "../hooks/useUser";
import src from "../api/src";
import axios from "axios";
import api from "../api/api";
import ImageModal from "../components/Image";

const socket = io("http://192.168.1.15:3000");

function GroupRoom() {
    const { id } = useParams();
    const [message, setMessage] = useState("");
    const { messages, fetchMesGr, setMessages } = useGroup();
    const [emoji, setEmoji] = useState(false);
    const messagesEndRef = useRef(null);
    const { group, fetchGroup } = useGroup();
    const { user } = useAuth();
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, [messages])
    
    useEffect(() => {
        if (user?.id) {
            socket.emit("join", user.id);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchMesGr(id);
    }, [id]);

    useEffect(() => {
        if (id && user?.id) {
            fetchGroup(id);
            // ✅ Join room group
            socket.emit("join_group", { groupId: id });
        }
    }, [id, user?.id]);

    // ✅ Lắng nghe tin nhắn nhóm - ĐÃ SỬA: Kiểm tra groupId
    useEffect(() => {
        socket.on("group_message", (data) => {
            // ✅ QUAN TRỌNG: Chỉ thêm tin nhắn nếu thuộc nhóm hiện tại
            if (parseInt(data.groupId) !== parseInt(id)) {
                console.log(`⏭️ Skipping message from group ${data.groupId}, current group is ${id}`);
                return;
            }

            console.log(`✅ Adding message to group ${id}:`, data);
            
            const newMessage = {
                id: data.id || Date.now(),
                sender_id: data.senderId,
                content: data.content,
                imageUrl: data.imageUrl || null,
                createdAt: data.createdAt,
                sender: data.senderInfo || null, // Lưu thông tin sender để hiển thị tên
            };
            
            setMessages(prev => [...prev, newMessage]);
        });

        socket.on("send_group_image", (data) => {
            // ✅ QUAN TRỌNG: Kiểm tra groupId cho ảnh
            if (parseInt(data.groupId) !== parseInt(id)) {
                console.log(`⏭️ Skipping image from group ${data.groupId}, current group is ${id}`);
                return;
            }

            console.log(`✅ Adding image to group ${id}:`, data);

            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    sender_id: data.senderId,
                    content: null,
                    image_url: data.imageUrl || data.fileUrl,
                    createdAt: new Date().toISOString(),
                },
            ]);
        });

        return () => {
            socket.off("group_message");
            socket.off("send_group_image");
        };
    }, [setMessages, id]); // ✅ Thêm 'id' vào dependencies

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        setPreviewImage(previewUrl);
        setUploadFile(file);
    };

    // ✅ Gửi tin nhắn
    const handleSend = async (e) => {
        e.preventDefault();
        if (message.trim())
        {
            socket.emit("send_group_message", {
                groupId: id,
                senderId: user?.id,
                content: message
            });
            setMessage("");
            setEmoji(false);
        }
        if (uploadFile) {
            const formData = new FormData();
            formData.append("image", uploadFile);
            formData.append("groupId", id);
            
            try {
                const res = await axios.post(api + "image/upload-group-image", formData, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "multipart/form-data",
                    },
                });
                if (res.data.success && res.data.message?.imageUrl) {
                    const imageUrl = res.data.message.imageUrl;
                    socket.emit("send_group_image", {
                        senderId: user.id,
                        groupId: parseInt(id),
                        fileUrl: imageUrl,  
                    });
                    setPreviewImage(null);
                    setUploadFile(null);
                } else {
                    alert("Upload ảnh thất bại!");
                }
            } catch (error) {
                console.error("Upload error:", error);
                alert("Có lỗi khi upload ảnh!");
            }
        }
    };
    
    // Lấy tất cả ảnh trong chat
    const allImages = messages
        .filter((msg) => msg.image_url)
        .map((msg) => msg.image_url);
        
    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <div className="flex items-center justify-between p-4 bg-white shadow-md border-b">
                <div className="flex items-center gap-3">
                    <FiUsers className="w-6 h-6 text-blue-500" />
                    <h2 className="font-semibold text-lg">
                        {group?.name || "Nhóm"} ({group?.memberCount || 0})
                    </h2>
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
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((msg, i) => {
                    const isCurrentUser = msg.sender_id === user?.id;
                    const prevMsg = i > 0 ? messages[i - 1] : null;
                    const nextMsg = i < messages.length - 1 ? messages[i + 1] : null;
                    const showAvatar = !isCurrentUser && (!nextMsg || nextMsg.sender_id !== msg.sender_id);
                    const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                    return (
                        <div key={i} className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                            <div
                                className={`flex flex-col mb-1 ${isCurrentUser ? 'items-end' : 'items-start'} ${
                                    isFirstInGroup ? 'mt-2' : ''
                                }`}
                            >
                                {isFirstInGroup && !isCurrentUser && (
                                    <span className="text-sm text-gray-600 font-semibold mb-1 ml-10">
                                        {msg.sender?.name ? msg.sender.name.split(" ").pop() : "Người dùng"}
                                    </span>
                                )}
                                <div className="flex items-end">
                                    {!isCurrentUser && (
                                        <div className="w-8 h-8 mr-2">
                                            {showAvatar && (
                                                <img
                                                    src={`https://i.pravatar.cc/50?u=${msg.sender_id}`}
                                                    alt="avatar"
                                                    className="w-7 h-7 rounded-full object-cover"
                                                />
                                            )}
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-xs text-sm ${
                                            isCurrentUser
                                                ? msg.image_url
                                                    ? 'bg-blue-500 text-white rounded-2xl'
                                                    : 'bg-blue-500 text-white rounded-2xl px-3 py-2'
                                                : msg.image_url
                                                    ? 'bg-gray-200 text-black rounded-2xl'
                                                    : 'bg-gray-200 text-black rounded-2xl px-3 py-2'
                                        }`}
                                    >
                                        {msg.image_url ? (
                                            <img
                                                src={src + msg.image_url}
                                                alt="message"
                                                className="max-w-[200px] max-h-[200px] rounded-lg cursor-pointer"
                                                onClick={() => setSelectedImage(src + msg.image_url)}
                                                onLoad={() => {
                                                    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
                                                }}
                                                onError={(e) => {
                                                    console.error("❌ Image load failed:", msg.image_url);
                                                    e.target.style.display = "none";
                                                }}
                                            />
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                </div>
                            </div>
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

            <form onSubmit={handleSend} className="flex items-center p-2 border-t bg-white">
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
                    className="flex-1 mx-2 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                    type="submit"
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center"
                >
                    <FiSend />
                </button>
            </form>
            {emoji && <Emoji onSelect={(emo) => setMessage((prev) => prev + emo)} />}
            <ImageModal
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                imageUrl={selectedImage}
                images={allImages}
            />
        </div>
    );
}

export default GroupRoom;