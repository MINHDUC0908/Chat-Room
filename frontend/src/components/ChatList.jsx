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
                alt={conversation.name}
                className="w-10 h-10 rounded-full"
            />
            <div>
                <div className="font-medium">{conversation.name}</div>
                <div className="text-xs text-gray-500">
                    {conversation.lastMessage || conversation.email}
                </div>
            </div>
            <div className="ml-auto text-[11px] text-gray-400">
                {formatTime(conversation.lastTime)}
            </div>
        </div>
    );
}

export default ChatItem;
