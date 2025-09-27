import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext"; // 👈 lấy user đăng nhập

const socket = io("http://192.168.1.77:3000");

function ChatRoom({ setCurrentTitle }) {
    const { id: receiverId } = useParams(); // 👉 id của người muốn chat cùng
    const { user } = useAuth(); // 👈 lấy user hiện tại từ context
    const [message, setMessage] = useState("");
    const [chat, setChat] = useState([]);

    useEffect(() => {
        setCurrentTitle(`Chat với user ${receiverId}`);
    }, [receiverId, setCurrentTitle]);
    useEffect(() => {
        if (!user) return;

        // join socket bằng userId (định danh socket với user)
        socket.emit("join", user.id);

        socket.on("private_message", (msg) => {
            // chỉ push tin nhắn liên quan tới cuộc trò chuyện hiện tại
            if (
                (msg.sender_id === user.id && msg.receiver_id === parseInt(receiverId)) ||
                (msg.sender_id === parseInt(receiverId) && msg.receiver_id === user.id)
            ) {
                setChat((prev) => [...prev, msg]);
            }
        });

        return () => socket.off("private_message");
    }, [user, receiverId]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim() && user) {
            const newMsg = {
                sender_id: user.id,
                receiver_id: parseInt(receiverId),
                content: message,
            };

            socket.emit("private_message", newMsg); // gửi lên server
            setMessage("");
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">
                💬 Chat với user {receiverId}
            </h2>
            <div className="border rounded p-2 h-64 overflow-y-auto bg-gray-50">
                {chat.map((msg, i) => (
                    <div
                        key={i}
                        className={`p-1 border-b ${
                            msg.sender_id === user?.id ? "text-blue-600" : "text-green-600"
                        }`}
                    >
                        <b>{msg.sender_id === user?.id ? "Me" : `User ${msg.sender_id}`}:</b>{" "}
                        {msg.content}
                    </div>
                ))}
            </div>
            <form onSubmit={sendMessage} className="flex mt-2">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 border rounded p-2"
                />
                <button
                    type="submit"
                    className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
                >
                    Gửi
                </button>
            </form>
        </div>
    );
}

export default ChatRoom;
