// Hàm xử lý tin nhắn private
export const handlePrivateMessage = (msg) => {
    setConversations((prev) => {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const isMyMessage = msg.sender_id === user.id;

        const exists = prev.find(c => c.id === otherUserId);

        if (exists) {
            return [
                {
                    ...exists,
                    lastMessage: msg.content,
                    lastTime: new Date().toISOString(),
                    unreadCount: isMyMessage ? exists.unreadCount : exists.unreadCount + 1
                },
                ...prev.filter(c => c.id !== otherUserId)
            ];
        } else {
            const u = users.find(u => u.id === otherUserId);
            if (!u) return prev;
            return [
                {
                    id: u.id,
                    name: u.name,
                    avatar: `https://i.pravatar.cc/50?u=${u.id}`,
                    lastMessage: msg.content,
                    lastTime: new Date().toISOString(),
                    unreadCount: isMyMessage ? 0 : 1
                },
                ...prev
            ];
        }
    });
};