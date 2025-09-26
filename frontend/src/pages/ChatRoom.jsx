import { useEffect, useState } from "react";
import { io } from "socket.io-client";

// ⚡ Sử dụng IP máy A thay cho localhost
const socket = io("http://192.168.1.77:3000");

function ChatRoom() {
    const [message, setMessage] = useState("");
    const [chat, setChat] = useState([]);

    useEffect(() => {
        socket.on("chatMessage", (msg) => {
            setChat((prev) => [...prev, msg]);
        });

        return () => socket.off("chatMessage");
    }, []);

    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            socket.emit("chatMessage", message);
            setMessage("");
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">💬 Chat Room</h2>
            <div className="border rounded p-2 h-64 overflow-y-auto bg-gray-50">
                {chat.map((msg, i) => (
                    <div key={i} className="p-1 border-b">{msg}</div>
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
                <button type="submit" className="ml-2 px-4 py-2 bg-blue-500 text-white rounded">
                    Gửi
                </button>
            </form>
        </div>
    );
}

export default ChatRoom;
