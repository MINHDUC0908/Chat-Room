import { Copy, MoreVertical, Share2, Trash2, ChevronDown } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import src from "../../api/src";
import VideoMessageUI from "../VideoMessageUI";
import ImageModal from "../Image";

export const ChatMessage = ({ chat, user, handleDeleteMessage, messagesEndRef }) => {
    const [showMenu, setShowMenu] = useState(null); // ID của tin nhắn có menu mở
    const [selectedImage, setSelectedImage] = useState(null); // URL ảnh được chọn để xem lớn
    const [showScrollDown, setShowScrollDown] = useState(false); // hiển thị nút cuộn xuống

    const chatContainerRef = useRef(null); // tham chiếu container chat

    // Lấy tất cả ảnh trong chat
    const allImages = chat
        .filter((msg) => msg.image_url)
        .map((msg) => src + msg.image_url);

    const getMessageTimestamp = (msg) => msg.call?.started_at || msg.created_at;

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

    // theo dõi scroll để hiện nút cuộn xuống ---
    useEffect(() => {
        const handleScroll = () => {
            if (chatContainerRef.current) {
                const container = chatContainerRef.current;
                const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
                // Nếu cách cuối > 200px thì hiện nút, ngược lại ẩn
                setShowScrollDown(distanceFromBottom > 2500);
            }
        };

        const container = chatContainerRef.current;
        container?.addEventListener('scroll', handleScroll);

        // Kiểm tra ngay khi load
        handleScroll();

        return () => container?.removeEventListener('scroll', handleScroll);
    }, [chat]);

    return (
        <div className="relative" ref={chatContainerRef} style={{ overflowY: 'auto', maxHeight: '100%' }}>
            {chat.map((msg, i) => {
                const isCurrentUser = msg.sender_id === user?.id;
                const prevMsg = i > 0 ? chat[i - 1] : null;
                const nextMsg = i < chat.length - 1 ? chat[i + 1] : null;
                const showAvatar = !isCurrentUser && (!nextMsg || nextMsg.sender_id !== msg.sender_id);
                const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                const isMenuOpen = showMenu === msg.id;
                const showTime = !prevMsg || timeDiffMin(prevMsg, msg) > 10;

                return (
                    <div key={msg.id || i}>
                        {showTime && (
                            <div className="w-full flex justify-center mt-0.5 sm:mt-1">
                                <span className="text-[10px] sm:text-xs text-gray-500">
                                    {getTime(msg)} {!isToday(msg) && ` ${getDateDisplay(msg)}`}
                                </span>
                            </div>
                        )}
                        <div
                            key={msg.id || i}
                            className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
                        >
                            <div
                                className={`flex mb-0.5 sm:mb-1 ${
                                    isCurrentUser ? 'justify-end' : 'justify-start'
                                } ${isFirstInGroup ? 'mt-1 sm:mt-2' : ''}`}
                            >
                                {!isCurrentUser && (
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 mr-1.5 sm:mr-2 mt-auto flex-shrink-0">
                                        {showAvatar && (
                                            <img
                                                src={`https://i.pravatar.cc/50?u=${msg.sender_id}`}
                                                alt=""
                                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover flex-shrink-0"
                                            />
                                        )}
                                    </div>
                                )}

                                <div
                                    className={`relative group flex items-end gap-1 sm:gap-2 ${
                                        isCurrentUser ? 'justify-end' : 'justify-start'
                                    }`}
                                >
                                    {/* --- Dấu 3 chấm cho người gửi --- */}
                                    {isCurrentUser && (
                                        <div className="relative flex-shrink-0">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowMenu(isMenuOpen ? null : msg.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-0.5 sm:p-1 rounded-full hover:bg-gray-200"
                                            >
                                                <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                                            </button>

                                            {isMenuOpen && (
                                                <div className="absolute right-full mr-1 sm:mr-2 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-lg py-1.5 sm:py-2 w-44 sm:w-40 z-10 border border-gray-200">
                                                    <button
                                                        onClick={() => {
                                                            handleDeleteMessage(msg.id, msg.receiver_id);
                                                            setShowMenu(false);
                                                        }}
                                                        className="w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                                                    >
                                                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /> Xoá
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* --- Bong bóng tin nhắn --- */}
                                    <div
                                        className={`max-w-[75vw] sm:max-w-xs text-xs sm:text-sm ${
                                            isCurrentUser
                                                ? (msg.call || msg.image_url || msg.video_url
                                                    ? 'bg-blue-500 text-white rounded-2xl'
                                                    : 'bg-blue-500 text-white rounded-2xl px-2 sm:px-3 py-1.5 sm:py-2')
                                                : (msg.call || msg.image_url || msg.video_url
                                                ? 'bg-gray-200 text-black rounded-2xl'
                                                : 'bg-gray-200 text-black rounded-2xl px-2 sm:px-3 py-1.5 sm:py-2')
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
                                                className="w-full max-w-[150px] sm:max-w-[200px] max-h-[150px] sm:max-h-[200px] rounded-lg cursor-pointer object-cover"
                                            />
                                        ) : msg.call ? (
                                            <div
                                                className={`max-w-[75vw] sm:max-w-xs border border-gray-300 rounded-xl p-3 flex flex-col gap-2 ${
                                                    msg.sender_id === user?.id ? 'bg-blue-50' : 'bg-gray-100'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5 text-gray-700"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.5 4.5a1 1 0 01-.217 1.03l-2.257 2.257a16.023 16.023 0 006.516 6.516l2.257-2.257a1 1 0 011.03-.217l4.5 1.5a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.163 21 3 14.837 3 7V5z"
                                                        />
                                                    </svg>
                                                    <span className="font-medium text-gray-800">
                                                        {msg.call.status === 'missed' ? 'Đã bỏ lỡ cuộc gọi' : 'Cuộc gọi'}
                                                    </span>
                                                </div>
                                                {msg.call.status === 'missed' && (
                                                    <button
                                                        onClick={() => console.log('Gọi lại', msg.call.receiver_id)}
                                                        className="bg-blue-500 text-white py-1 px-3 rounded-lg text-sm hover:bg-blue-600"
                                                    >
                                                        Gọi lại
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                                        )}
                                    </div>

                                    {/* --- Dấu 3 chấm cho người nhận --- */}
                                    {!isCurrentUser && (
                                        <div className="relative flex-shrink-0">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowMenu(isMenuOpen ? null : msg.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-0.5 sm:p-1 rounded-full hover:bg-gray-200"
                                            >
                                                <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                                            </button>

                                            {isMenuOpen && (
                                                <div className="absolute left-full ml-1 sm:ml-2 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-lg py-1.5 sm:py-2 w-44 sm:w-40 z-10 border border-gray-200">
                                                    <button
                                                        onClick={() => {
                                                            handleDeleteMessage(msg.id, msg.receiver_id);
                                                            setShowMenu(null);
                                                        }}
                                                        className="w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                                                    >
                                                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /> Xoá
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
                                    <div className="text-xs text-gray-500 mt-0.5 sm:mt-1 flex items-center gap-0.5 sm:gap-1">
                                        <img
                                            src={`https://i.pravatar.cc/30?u=${msg.receiver_id}`}
                                            alt="Đã xem"
                                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full inline-block"
                                        />
                                    </div>
                                )}
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />

            {/* --- Mở modal ảnh --- */}
            <ImageModal
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                imageUrl={selectedImage}
                images={allImages}
            />

            {/* --- Nút cuộn xuống --- */}
            {showScrollDown && (
                <button
                    onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                            className="fixed  xl:ml-40 bottom-20 left-1/2 -translate-x-1 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg z-50 flex items-center justify-center"
                >
                    <ChevronDown className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

export default ChatMessage;
