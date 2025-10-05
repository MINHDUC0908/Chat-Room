import { useState, useRef, useEffect } from "react";
import { FiSend, FiImage, FiUsers, FiPhone, FiVideo } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";
import Emoji from "../components/Emoji";
import useGroup from "../hooks/useGroup";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { io } from "socket.io-client";

const socket = io("http://192.168.1.18:3000");

function GroupRoom() {
    const { id } = useParams();
    const [message, setMessage] = useState("");
    const { messages, fetchMesGr, setMessages } = useGroup();
    const [emoji, setEmoji] = useState(false);
    const messagesEndRef = useRef(null);
    const { group, fetchGroup } = useGroup();
    const { user } = useAuth();
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
            const newMessage = {
                id: data.id || Date.now(),
                sender_id: data.senderId,
                content: data.content,
                imageUrl: data.imageUrl || null,
                createdAt: data.createdAt,
            };
            
            setMessages(prev => [...prev, newMessage]);
        });

        return () => {
            socket.off("group_message");
        };
    }, [setMessages]);

    // ✅ Gửi tin nhắn
    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        
        socket.emit("send_group_message", {
            groupId: id,
            senderId: user?.id,
            content: message
        });
        
        setMessage("");
        setEmoji(false);
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
                                    {msg.content}
                                </div>
                            </div>

                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="flex items-center p-2 border-t bg-white">
                <label htmlFor="file-upload" className="p-2 text-gray-500 hover:text-gray-700 cursor-pointer">
                    <FiImage size={20} />
                </label>
                <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
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