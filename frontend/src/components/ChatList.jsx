function ChatItem({ conversation, isSelected, onClick, formatTime }) {
    return (
        <div
            onClick={onClick}
            className={`
                flex items-center gap-2 p-2
                cursor-pointer transition-colors duration-200 px-5 py-4
                ${isSelected ? "bg-gray-300" : "bg-transparent"}
            `}
        >
            <img
                src={conversation.avatar}
                alt={conversation.displayName || "Nhóm hoặc người dùng"}
                className="w-10 h-10 rounded-full"
            />

            <div className="flex-1">
                <div className="font-medium">{conversation.displayName}</div>

                <div
                    className={`text-xs ${
                        conversation.unreadCount > 0
                            ? "text-red-500 font-semibold"
                            : "text-black"  // khi đã đọc thì màu đen
                    }`}
                >
                    {
                        conversation.displayMessage === null ? "Đã gửi 1 ảnh" : conversation.displayMessage
                    }
                </div>
            </div>

            <div className="ml-auto text-[11px] text-gray-400">
                {formatTime(conversation.lastTime)}
            </div>
        </div>
    );
}

export default ChatItem;
