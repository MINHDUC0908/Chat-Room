import { useState } from "react";
import ImageModal from "./Image";
import src from "../api/src";


function ChatGroupMessage( { messages, messagesEndRef, user})
{
    console.log("📨 Rendering ChatGroupMessage with messages:", messages);
    const [selectedImage, setSelectedImage] = useState(null); 
    const getMessageTimestamp = (msg) => msg.created_at;

    const getDateDisplay = (msg) => {
        const date = new Date(getMessageTimestamp(msg));
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });
    };
    const getTime = (msg) => new Date(getMessageTimestamp(msg)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timeDiffMin = (prevMsg, msg) => (new Date(getMessageTimestamp(msg)) - new Date(getMessageTimestamp(prevMsg))) / (1000 * 60);

    const isToday = (msg) => {
        const msgDate = new Date(getMessageTimestamp(msg));
        const today = new Date();
        return msgDate.toDateString() === today.toDateString();
    };

    const allImages = messages
        .filter((msg) => msg.image_url)
        .map((msg) => src + msg.image_url);
    return (
        <>
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((msg, i) => {
                    const isCurrentUser = msg.sender_id === user?.id;
                    const prevMsg = i > 0 ? messages[i - 1] : null;
                    const nextMsg = i < messages.length - 1 ? messages[i + 1] : null;
                    const showAvatar = !isCurrentUser && (!nextMsg || nextMsg.sender_id !== msg.sender_id);
                    const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                    const showTime = !prevMsg || timeDiffMin(prevMsg, msg) > 10;
                    return (
                        <div key={msg.id} className="mb-1">
                            {showTime && (
                                <div className="w-full flex justify-center mt-0.5 sm:mt-1">
                                    <span className="text-[10px] sm:text-xs text-gray-500">
                                        {getTime(msg)} {!isToday(msg) && ` ${getDateDisplay(msg)}`}
                                    </span>
                                </div>
                            )}
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
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <ImageModal
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                imageUrl={selectedImage}
                images={allImages}
            />
        </>
    )
}


export default ChatGroupMessage;