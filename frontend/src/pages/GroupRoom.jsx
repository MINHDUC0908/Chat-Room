import { useState, useRef, useEffect } from "react";
import { FiSend, FiImage, FiUsers, FiPhone, FiVideo } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";
import Emoji from "../components/Emoji";
import useGroup from "../hooks/useGroup";
import { useOutletContext, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { io } from "socket.io-client";
import src from "../api/src";
import axios from "axios";
import api from "../api/api";
import ChatGroupMessage from "../components/ChatGroupMessage";

const socket = io("http://192.168.1.14:3000");

function GroupRoom() {
    const { id } = useParams();
    const [message, setMessage] = useState("");
    const { messages, fetchMesGr, setMessages } = useGroup();
    const [emoji, setEmoji] = useState(false);
    const messagesEndRef = useRef(null);
    const { group, fetchGroup } = useGroup();
    const { user } = useAuth();
    const [previewImage, setPreviewImage] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);

    const { audioCallGroupRef } = useOutletContext();
    
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

    // ✅ Lắng nghe tin nhắn nhóm
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
                created_at: data.createdAt,
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
                    created_at: new Date().toISOString(),
                    sender: { name: data.name },
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
                        name: user.name,
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

    const handleVoiceCall = () => {
        if (!group) {
            alert("Không tìm thấy người nhận!");
            return;
        }
        audioCallGroupRef.current?.startGroupCall(parseInt(id), group.name);
        console.log("Gọi thoại nhóm:", parseInt(id), group.name)
    };
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
                        onClick={handleVoiceCall}
                    />
                    <FiVideo
                        className="w-6 h-6 text-blue-500 cursor-pointer hover:scale-110 transition-transform"
                        title="Gọi video"
                        onClick={() => console.log("Gọi video")}
                    />
                </div>
            </div>
            
            <ChatGroupMessage messages={messages} messagesEndRef={messagesEndRef} user={user} />
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
        </div>
    );
}

export default GroupRoom;