// SideBar.jsx
import { useEffect, useState } from "react";
import { FiEdit2, FiSearch } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { formatTime } from "../utils/format";
import Group from "../components/Group";
import useUser from "../hooks/useUser";
import ChatItem from "../components/ChatList";

const socket = io("http://192.168.1.77:3000");

function SideBar() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id: currentChatId } = useParams();
    const location = useLocation();
    const [search, setSearch] = useState("");
    const [groupOpen, setGroupOpen] = useState(false);
    const { conversations, fetchConversations, setConversations } = useUser();
    console.log("Conversations from useUser hook:", conversations);
    useEffect(() => {
        fetchConversations();

        if (user?.id) {
            socket.emit("join", user.id);
        }

        socket.on("private_message", (msg, senderInfo) => {
            const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
            const isMyMessage = msg.sender_id === user.id;

            setConversations((prev) => {
                const exists = prev.find(
                    (c) => (c.isGroup ? c.conversationId : c.id) === otherUserId
                );
                if (exists) {
                    // Cập nhật tin nhắn cuối và unreadCount
                    const updated = prev.filter(
                        (c) => (c.isGroup ? c.conversationId : c.id) !== otherUserId
                    );
                    return [
                        {
                            ...exists,
                            lastMessage: msg.content,
                            lastTime: new Date().toISOString(),
                            unreadCount: isMyMessage ? exists.unreadCount : exists.unreadCount + 1
                        },
                        ...updated
                    ];
                } else if (senderInfo) {
                    // Tạo conversation mới nếu chưa có
                    return [
                        {
                            ...senderInfo,
                            id: senderInfo.id,
                            name: senderInfo.name,
                            email: senderInfo.email,
                            avatar: `https://i.pravatar.cc/50?u=${senderInfo.id}`,
                            lastMessage: msg.content,
                            lastTime: new Date().toISOString(),
                            unreadCount: isMyMessage ? 0 : 1,
                            isGroup: 0,
                        },
                        ...prev
                    ];
                } else {
                    return prev;
                }
            });
        });

        socket.on("group_created", (newGroup) => {
            const normalizedGroup = {
                ...newGroup,
                chatId: newGroup.id, // đúng field từ backend
                conversationId: newGroup.id,
                conversationName: newGroup.name,
                displayName: newGroup.name || "Nhóm không tên",
                displayMessage: newGroup.lastMessage || "Chưa có tin nhắn",
                avatar: newGroup.avatar || "/group-icon.png",
                unreadCount: 0,
                isGroup: 1
            };

            setConversations((prev) => [normalizedGroup, ...prev]);
        });

        return () => {
            socket.off("private_message");
            socket.off("group_created");
        };
    }, [user]);

    // Chuẩn hóa dữ liệu để hiển thị
    const normalizedConversations = conversations.map((c) => {
        const normalized = {
            ...c,
            chatId: c.isGroup ? c.conversationId : c.id,
            displayName: c.isGroup ? c.conversationName || "Nhóm không tên" : c.name || "Người dùng không tên",
            displayMessage: c.lastMessage || c.email || "Chưa có tin nhắn",
            avatar: c.avatar || (c.isGroup ? "/group-icon.png" : `https://i.pravatar.cc/50?u=${c.id || c.conversationId}`)
        };
        return normalized;
    });

    const filteredConversations = normalizedConversations.filter((conv) =>
        conv.displayName.toLowerCase().includes(search.toLowerCase())
    );

    
    const handleMarkAsRead = (chatId) => {
        setConversations(prev =>
            prev.map(conv =>
                (conv.isGroup ? conv.conversationId : conv.id) === chatId
                    ? { ...conv, unreadCount: 0 }
                    : conv
            )
        );
        // gửi socket
        const conv = conversations.find(c => (c.isGroup ? c.conversationId : c.id) === chatId);
        if (conv && !conv.isGroup && user?.id) {
            socket.emit("mark_as_read", { userId: user.id, senderId: conv.id });
        }
    };

    // Kiểm tra loại cuộc trò chuyện dựa trên đường dẫn
    const isGroupChat = location.pathname.startsWith("/group-room");
    const currentConversationId = currentChatId ? parseInt(currentChatId) : null;
    return (
        <div className="w-[350px] border-r border-gray-300 h-screen flex flex-col bg-white">
            <div className="flex justify-between items-center p-4">
                <span className="font-bold text-lg">{user?.name}</span>
                <div className="flex items-center gap-2 text-gray-600 cursor-pointer">
                    <FiEdit2
                        onClick={() => setGroupOpen(true)}
                        className="hover:scale-110 transition-transform"
                    />
                    <span>Tạo nhóm</span>
                </div>
            </div>

            <div className="px-4 pb-2">
                <div className="flex items-center bg-gray-100 rounded-lg px-3">
                    <FiSearch className="mr-2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none py-2 text-sm"
                    />
                </div>
            </div>

            <div className="pt-2 border-t border-gray-300 flex-1 overflow-y-auto">
                <div className="font-bold mb-2 px-4">Tin nhắn</div>
                {filteredConversations.map((c) => (
                    <ChatItem
                        key={c.chatId}
                        conversation={c}
                        formatTime={formatTime}
                        isSelected={
                            isGroupChat
                                ? c.isGroup && c.chatId == currentConversationId
                                : !c.isGroup && c.chatId == currentConversationId
                        } // Phân biệt dựa trên isGroup và chatId
                        onClick={() => {
                            if (c.isGroup) {
                                navigate(`/group-room/${c.chatId}`);
                            } else {
                                navigate(`/chat-room/${c.chatId}`);
                            }
                            handleMarkAsRead(c.chatId);
                        }}
                    />
                ))}
            </div>

            {groupOpen && <Group setGroup={setGroupOpen} />}
        </div>
    );
}

export default SideBar;
