// ChatItem.jsx
import React from 'react';

function ChatItem({ conversation, formatTime, isSelected, onClick }) {
    return (
        <div
            onClick={onClick}
            className={`px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors ${
                isSelected ? 'bg-blue-50 border-r-4 border-blue-500' : ''
            }`}
        >
            <div className="flex items-center gap-3">
                <div className="relative">
                    <img
                        src={conversation.avatar}
                        alt={conversation.displayName}
                        className="w-12 h-12 rounded-full object-cover"
                    />
                    {!conversation.isGroup && (
                        <div
                            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                conversation.isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                            title={conversation.isOnline ? 'Đang online' : 'Offline'}
                        />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                        <h3 className="font-semibold text-sm truncate">
                            {conversation.displayName}
                        </h3>
                        {conversation.lastTime && (
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                {formatTime(conversation.lastTime)}
                            </span>
                        )}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <p className={`text-xs ${
                            conversation.unreadCount > 0 ? "text-red-500 font-semibold" : "text-gray-500"
                            }`}
                        >
                            {conversation.displayMessage}
                        </p>
                        {conversation.unreadCount > 0 && (
                            <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 font-semibold flex-shrink-0">
                                {conversation.unreadCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatItem;
