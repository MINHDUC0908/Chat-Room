import { Copy, MoreVertical, Share2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import src from "../api/src";
import VideoMessageUI from "./VideoMessageUI";
import ImageModal from "./Image";


export const ChatMessage = ({ chat, user, handleDeleteMessage }) => {
    const [showMenu, setShowMenu] = useState(null); // ID của tin nhắn có menu mở
    const [selectedImage, setSelectedImage] = useState(null); // URL ảnh được chọn để xem lớn
    const messagesEndRef = useRef(null);
        // Lấy tất cả ảnh trong chat
    const allImages = chat
        .filter((msg) => msg.image_url)
        .map((msg) => msg.image_url);
    return (
        <div>
            {chat.map((msg, i) => {
                const isCurrentUser = msg.sender_id === user?.id;
                const prevMsg = i > 0 ? chat[i - 1] : null;
                const nextMsg = i < chat.length - 1 ? chat[i + 1] : null;
                const showAvatar = !isCurrentUser && (!nextMsg || nextMsg.sender_id !== msg.sender_id);
                const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                const isMenuOpen = showMenu === msg.id;
                return (
                    <div
                        key={i}
                        className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
                    >
                        <div
                            className={`flex mb-1 ${
                                isCurrentUser ? 'justify-end' : 'justify-start'
                            } ${isFirstInGroup ? 'mt-2' : ''}`}
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
                                className={`relative group flex items-end gap-2 ${
                                    isCurrentUser ? 'justify-end' : 'justify-start'
                                }`}
                            >
                                {/* --- Nếu là người gửi: Dấu 3 chấm nằm bên trái --- */}
                                {isCurrentUser && (
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowMenu(isMenuOpen ? null : msg.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-gray-200"
                                        >
                                            <MoreVertical className="w-4 h-4 text-gray-600" />
                                        </button>

                                        {isMenuOpen && (
                                            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-lg py-2 w-40 z-10">
                                                {/* <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(
                                                            msg.content || msg.video_url || ''
                                                        );
                                                        setShowMenu(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                                >
                                                    <Copy className="w-4 h-4" /> Sao chép
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        console.log('Chuyển tiếp', msg);
                                                        setShowMenu(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                                >
                                                    <Share2 className="w-4 h-4" /> Chuyển tiếp
                                                </button> */}
                                                <button
                                                    onClick={() => {
                                                        handleDeleteMessage(msg.id, msg.receiver_id);
                                                        setShowMenu(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Xoá
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* --- Bong bóng tin nhắn --- */}
                                <div
                                    className={`max-w-xs text-sm ${
                                        isCurrentUser
                                            ? msg.image_url || msg.video_url
                                                ? 'bg-blue-500 text-white rounded-2xl'
                                                : 'bg-blue-500 text-white rounded-2xl px-3 py-2'
                                            : msg.image_url || msg.video_url
                                            ? 'bg-gray-200 text-black rounded-2xl'
                                            : 'bg-gray-200 text-black rounded-2xl px-3 py-2'
                                    }`}
                                >
                                    {msg.video_url ? (
                                        <VideoMessageUI msg={msg} />
                                    ) : msg.image_url ? (
                                        <img
                                            src={src + msg.image_url}
                                            alt="message"
                                            onClick={() => setSelectedImage(src + msg.image_url)}
                                            onLoad={() => { messagesEndRef.current?.scrollIntoView({ behavior: "auto" }); }}
                                            onError={(e) => { console.error("❌ Image load failed:", msg.image_url); e.target.src = "/placeholder.png"; }}
                                            className="max-w-[200px] max-h-[200px] rounded-lg cursor-pointer"
                                        />
                                    ) : (
                                        msg.content
                                    )}
                                </div>

                                {/* --- Nếu là người nhận: Dấu 3 chấm nằm bên phải --- */}
                                {!isCurrentUser && (
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowMenu(isMenuOpen ? null : msg.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-gray-200"
                                        >
                                            <MoreVertical className="w-4 h-4 text-gray-600" />
                                        </button>

                                        {isMenuOpen && (
                                            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-lg py-2 w-40 z-10">
                                                <button
                                                    onClick={() => {
                                                        handleDeleteMessage(msg.id, msg.receiver_id);
                                                        setShowMenu(null);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Xoá
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Hiển thị "Đã xem" */}
                        {isCurrentUser &&
                            msg.is_read &&
                            i ===
                                chat
                                    .map((m, index) =>
                                        m.sender_id === user.id && m.is_read ? index : -1
                                    )
                                    .filter((x) => x !== -1)
                                    .pop() && (
                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <img
                                        src={`https://i.pravatar.cc/30?u=${msg.receiver_id}`}
                                        alt="Đã xem"
                                        className="w-4 h-4 rounded-full inline-block"
                                    />
                                </div>
                            )}
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
            <ImageModal
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                imageUrl={selectedImage}
                images={allImages}
            />
        </div>
    )
}

export default ChatMessage;