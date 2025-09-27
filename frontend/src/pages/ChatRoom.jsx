import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import api from "../api/api";
import { FiImage, FiPaperclip, FiPhone, FiSend, FiVideo } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";
import Emoji from "../components/Emoji";

const socket = io("http://192.168.1.77:3000", {
    transports: ["websocket"], // Đảm bảo sử dụng websocket để hỗ trợ UTF-8
    reconnection: true,
});

function ChatRoom({ setCurrentTitle }) {
    const { id: receiverId } = useParams(); // id của người muốn chat cùng
    const { user } = useAuth(); // user hiện tại
    const [message, setMessage] = useState("");
    const [chat, setChat] = useState([]);

    const [receiverInfo, setReceiverInfo] = useState(null);
    const messagesEndRef = useRef(null);

    const [emoji, setEmoji] = useState(false);

    // Tự động scroll xuống cuối khi có tin nhắn mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, [chat]);
    useEffect(() => {
        const fetchReceiver = async () => {
            try {
                const res = await axios.get(api + `auth/user/${receiverId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
                setReceiverInfo(res.data);
            } catch (err) {
                console.error("❌ Lỗi fetch receiver:", err);
            }
        };
        if (receiverId) fetchReceiver();
    }, [receiverId]);

    // Đặt tiêu đề khi vào phòng chat
    useEffect(() => {
        setCurrentTitle(`Hộp thư - Direct`);
    }, [receiverId, setCurrentTitle]);

    // Load tin nhắn cũ từ backend
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await axios.get(
                    api + `chat/messages/${receiverId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );
                setChat(res.data); // gán toàn bộ tin nhắn cũ
                console.log("✅ Tin nhắn cũ:", res.data);
            } catch (err) {
                console.error("❌ Lỗi load tin nhắn:", err);
            }
        };

        if (user) fetchMessages();
    }, [receiverId, user]);

    // Kết nối socket & lắng nghe tin nhắn mới
    useEffect(() => {
        if (!user) return;

        socket.emit("join", user.id);

        socket.on("private_message", (msg) => {
            if (
                (msg.sender_id === user.id && msg.receiver_id === parseInt(receiverId)) ||
                (msg.sender_id === parseInt(receiverId) && msg.receiver_id === user.id)
            ) {
                setChat((prev) => [...prev, msg]); // thêm tin nhắn mới vào danh sách
            }
        });

        return () => socket.off("private_message");
    }, [user, receiverId]);

    // Gửi tin nhắn
    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim() && user) {
            const newMsg = {
                sender_id: user.id,
                receiver_id: parseInt(receiverId),
                content: message,
            };

            socket.emit("private_message", newMsg);
            setMessage("");
        }
    };

    const handleSelectEmoji = (emoji) => {
        setMessage(prev => prev + emoji); // Thêm emoji vào cuối input
    };

    return (
        <div className="p-4 flex flex-col h-screen">
            <div className="flex items-center justify-between p-4 bg-white shadow-md rounded-t-lg border-b mb-1">
                {/* Avatar và tên người chat */}
                <div className="flex items-center gap-3">
                    {/* Avatar giả lập */}
                    <img
                        src={receiverInfo?.avatar || `https://i.pravatar.cc/40?u=${receiverId}`}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="font-semibold text-lg">
                        {receiverInfo?.name }
                    </span>
                </div>

                {/* Icon gọi điện */}
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

            {/* Danh sách tin nhắn */}
            <div className="flex-1 p-4 overflow-y-auto bg-white">
                {chat.map((msg, i) => {
                    const isCurrentUser = msg.sender_id === user?.id;
                    const prevMsg = i > 0 ? chat[i - 1] : null;
                    const nextMsg = i < chat.length - 1 ? chat[i + 1] : null;
                    const showAvatar = !isCurrentUser && (!nextMsg || nextMsg.sender_id !== msg.sender_id);
                    const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                    
                    return (
                        <div key={i} className={`flex mb-1 ${isCurrentUser ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-2' : ''}`}>
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
                            
                            {/* Tin nhắn */}
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
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="flex items-center p-2 border-t bg-white">
                <button className="p-2 text-gray-500 hover:text-gray-700">
                    <FiPaperclip size={20} />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700">
                    <FiImage size={20} />
                </button>
                <button onClick={() => setEmoji(!emoji)} className="p-2 text-gray-500 hover:text-gray-700">
                    <BsEmojiSmile size={20} />
                </button>
                <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    onChange={(e) => setMessage(e.target.value)}
                    value={message}
                    className="flex-1 mx-2 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center">
                    <FiSend />
                </button>
            </form>
            {
                emoji && <Emoji onSelect={handleSelectEmoji} />
            }
        </div>
    );
}

export default ChatRoom;
