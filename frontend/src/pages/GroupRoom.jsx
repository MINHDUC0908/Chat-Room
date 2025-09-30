import { useState, useRef, useEffect } from "react";
import { FiSend, FiImage, FiUsers, FiPhone, FiVideo } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";
import Emoji from "../components/Emoji"; // nếu có component emoji riêng
import useGroup from "../hooks/useGroup";
import { useParams } from "react-router-dom";

function GroupRoom() {
    const [messages, setMessages] = useState([
        { id: 1, user: "Alice", text: "Hello group 👋", isMe: false },
        { id: 2, user: "Me", text: "Hi Alice 😁", isMe: true },
    ]);
    const { id } = useParams();
    const [message, setMessage] = useState("");
    const [emoji, setEmoji] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const messagesEndRef = useRef(null);
    const { group, fetchGroup } = useGroup()

    useEffect(() => {
        if (id) fetchGroup(id)
    }, [id])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, previewImage]);

    useEffect(() => {
        if (id) fetchGroup(id);
    }, [id]);

    // Cuộn xuống cuối khi có tin nhắn mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Lắng nghe tin nhắn từ server
    useEffect(() => {
        socket.on("group_message", (msg) => {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    user: msg.senderId === userId ? userName : msg.senderName,
                    text: msg.content,
                    isMe: msg.senderId === userId,
                },
            ]);
        });

        return () => socket.off("group_message");
    }, []);

    // Gửi tin nhắn
    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        // Cập nhật giao diện trước
        setMessages((prev) => [
            ...prev,
            { id: Date.now(), user: userName, text: message, isMe: true },
        ]);

        // Gửi tin nhắn lên server
        socket.emit("send_group_message", {
            groupId: id,
            senderId: userId,
            senderName: userName,
            content: message,
        });

        setMessage("");
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreviewImage(url);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <div className="flex items-center justify-between p-4 bg-white shadow-md border-b">
                <div className="flex items-center gap-3">
                    <FiUsers className="w-6 h-6 text-blue-500" />
                    <h2 className="font-semibold text-lg">{group.name} ({group.memberCount})</h2>
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
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex mb-3 ${msg.isMe ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-xs px-3 py-2 rounded-2xl ${
                                msg.isMe ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
                            }`}
                        >
                            {!msg.isMe && <p className="text-xs font-bold mb-1">{msg.user}</p>}
                            {msg.image && (
                                <img
                                    src={msg.image}
                                    alt="upload"
                                    className="max-w-[200px] max-h-[200px] rounded-lg mb-2"
                                />
                            )}
                            <p>{msg.text}</p>
                        </div>
                    </div>
                ))}
                {previewImage && (
                    <div className="flex justify-end mb-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <img
                                src={previewImage}
                                alt="preview"
                                className="max-w-[200px] max-h-[200px] rounded-lg"
                            />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form
                onSubmit={handleSend}
                className="p-3 bg-white border-t flex items-center gap-2"
            >
                <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-gray-500 hover:text-blue-500"
                >
                    <FiImage size={22} />
                </label>
                <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                />

                <button
                    type="button"
                    onClick={() => setEmoji(!emoji)}
                    className="text-gray-500 hover:text-yellow-500"
                >
                    <BsEmojiSmile size={22} />
                </button>

                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                <button
                    type="submit"
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center"
                >
                    <FiSend size={20} />
                </button>
            </form>

            {emoji && <Emoji onSelect={(emo) => setMessage((prev) => prev + emo)} />}
        </div>
    );
}

export default GroupRoom;
