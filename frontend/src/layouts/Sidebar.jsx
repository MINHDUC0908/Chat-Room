// SideBar.jsx
import { useEffect, useState } from "react";
import { FiEdit2, FiLogOut, FiSearch, FiSettings } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { formatTime } from "../utils/format";
import Group from "../components/Group";
import useUser from "../hooks/useUser";
import ChatItem from "../components/ChatList";

const socket = io("http://192.168.1.20:3000");

function SideBar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { id: currentChatId } = useParams();
    const location = useLocation();
    const [search, setSearch] = useState("");
    const [groupOpen, setGroupOpen] = useState(false);
    const { conversations, fetchConversations, setConversations } = useUser();

    useEffect(() => {
        const initializeSocket = async () => {
            await fetchConversations();
            
            if (user?.id) {
                socket.emit("user_online", user.id);
                socket.emit("join", user.id);
            }
        };
        
        initializeSocket();
    }, [user?.id]);

    // Join vào tất cả các nhóm sau khi conversations được load
    useEffect(() => {
        if (conversations.length > 0 && user?.id) {
            conversations.forEach((conv) => {
                if (conv.isGroup === 1 || conv.isGroup === true) {
                    const groupId = conv.conversationId || conv.id || conv.chatId;
                    socket.emit("join_group", { groupId });
                }
            });
        }
    }, [conversations.length, user?.id]);

    // Join vào nhóm hiện tại khi chuyển trang
    useEffect(() => {
        if (currentChatId && location.pathname.startsWith("/group-room")) {
            socket.emit("join_group", { groupId: currentChatId });
        }
    }, [currentChatId, location.pathname]);

    useEffect(() => {

        socket.on("user_status_change", ({ userId, isOnline }) => {
            setConversations((prev) =>
                prev.map((conv) => {
                    if (!conv.isGroup && parseInt(conv.id) === parseInt(userId)) {
                        return { ...conv, isOnline: isOnline };
                    }
                    return conv;
                })
            );
        });
        socket.on("send_image_message", (msg, senderInfo) => {
            const otherUserId = parseInt(
                msg.senderId === user?.id ? msg.receiverId : msg.senderId
            );
            const isMyMessage = msg.senderId === user?.id;

            setConversations((prev) => {
                const existingIndex = prev.findIndex((c) => {
                    if (c.isGroup === 1 || c.isGroup === true) return false;
                    const convId = parseInt(c.id);
                    return convId === otherUserId;
                });

                if (existingIndex !== -1) {
                    const exists = prev[existingIndex];
                    const updated = [...prev];
                    updated.splice(existingIndex, 1);
                    const newConv = {
                        ...exists,
                        lastMessage: "📷 Đã gửi 1 ảnh",
                        lastTime: msg.createdAt || new Date().toISOString(),
                        lastSenderId: msg.senderId,
                        unreadCount: isMyMessage
                            ? exists.unreadCount
                            : (parseInt(exists.unreadCount) || 0) + 1,
                    };

                    return [newConv, ...updated];
                } else if (senderInfo) {
                    // Tạo conversation mới nếu chưa tồn tại
                    const newConv = {
                        id: senderInfo.id,
                        name: senderInfo.name,
                        email: senderInfo.email,
                        avatar: senderInfo.avatar || `https://i.pravatar.cc/50?u=${senderInfo.id}`,
                        lastMessage: "📷 Đã gửi 1 ảnh",
                        lastTime: msg.createdAt || new Date().toISOString(),
                        unreadCount: isMyMessage ? 0 : 1,
                        isGroup: 0,
                        isOnline: Boolean(senderInfo.is_online),
                        lastSenderId: msg.senderId,
                    };
                    return [newConv, ...prev];
                }
                return prev;
            });
        });


        // Cập nhật handler cho group_message
        socket.on("group_message", (data) => {
            setConversations((prev) => {
                const existingIndex = prev.findIndex((c) => {
                    // Kiểm tra isGroup === 1 hoặc isGroup === true
                    const isGroupConv = c.isGroup === 1 || c.isGroup === true;
                    if (!isGroupConv) return false;
                    // So sánh với groupId từ data
                    const groupId = parseInt(c.conversationId || c.id || c.chatId);
                    return groupId === parseInt(data.groupId);
                });
                
                if (existingIndex !== -1) {
                    const exists = prev[existingIndex];
                    const updated = [...prev];
                    updated.splice(existingIndex, 1);

                    // Tạo conversation mới với thông tin cập nhật
                    const updatedConv = {
                        ...exists,
                        lastMessage: data.content,
                        lastTime: data.createdAt || new Date().toISOString(),
                        lastSenderId: data.senderId,
                    };

                    // Đưa conversation lên đầu danh sách
                    return [updatedConv, ...updated];
                } else {
                    console.warn("⚠️ Group not found in conversations:", data.groupId);
                }
                return prev;
            });
        });
        socket.on("send_group_image", (msg, senderInfo) => {
            console.log("🔵 Received send_group_image:", msg, senderInfo);
            setConversations((prev) => {
                const existingIndex = prev.findIndex((c) => {
                    // Kiểm tra isGroup === 1 hoặc isGroup === true
                    const isGroupConv = c.isGroup === 1 || c.isGroup === true;
                    if (!isGroupConv) return false;
                    // So sánh với groupId từ data
                    const groupId = parseInt(c.conversationId || c.id || c.chatId);
                    return groupId === parseInt(msg.groupId);
                });
                
                if (existingIndex !== -1) {
                    const exists = prev[existingIndex];
                    const updated = [...prev];
                    updated.splice(existingIndex, 1);

                    // Tạo conversation mới với thông tin cập nhật
                    const updatedConv = {
                        ...exists,
                        lastMessage: "📷 Đã gửi 1 ảnh",
                        lastTime: msg.createdAt || new Date().toISOString(),
                        lastSenderId: msg.senderId,
                    };

                    // Đưa conversation lên đầu danh sách
                    return [updatedConv, ...updated];
                } else {
                    console.warn("⚠️ Group not found in conversations:", msg.groupId);
                }
                return prev;
            });
        })

        socket.on("private_message", (msg, senderInfo) => {
            const otherUserId = parseInt(
                msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id
            );
            const isMyMessage = msg.sender_id === user?.id;

            setConversations((prev) => {
                const existingIndex = prev.findIndex((c) => {
                    // Chỉ tìm trong chat 1-1, không phải nhóm
                    if (c.isGroup === 1 || c.isGroup === true) return false;
                    
                    const convId = parseInt(c.id);
                    return convId === otherUserId;
                });

                if (existingIndex !== -1) {
                    const exists = prev[existingIndex];
                    const updated = [...prev];
                    updated.splice(existingIndex, 1);

                    const newConv = {
                        ...exists,
                        lastMessage: msg.content,
                        lastTime: msg.created_at || new Date().toISOString(),
                        lastSenderId: msg.sender_id,
                        unreadCount: isMyMessage
                            ? exists.unreadCount
                            : (parseInt(exists.unreadCount) || 0) + 1,
                    };

                    return [newConv, ...updated];
                } else if (senderInfo) {
                    const newConv = {
                        id: senderInfo.id,
                        name: senderInfo.name,
                        email: senderInfo.email,
                        avatar:
                            senderInfo.avatar ||
                            `https://i.pravatar.cc/50?u=${senderInfo.id}`,
                        lastMessage: msg.content,
                        lastTime: msg.created_at || new Date().toISOString(),
                        unreadCount: isMyMessage ? 0 : 1,
                        isGroup: 0,
                        isOnline: Boolean(senderInfo.is_online),
                        lastSenderId: msg.sender_id,
                    };
                    return [newConv, ...prev];
                }
                return prev;
            });
        });

        socket.on("group_created", (newGroup) => {
            console.log("🎉 Group created event received:", newGroup);
            
            const normalizedGroup = {
                ...newGroup,
                chatId: newGroup.id,
                conversationId: newGroup.id,
                conversationName: newGroup.name,
                displayName: newGroup.name || "Nhóm không tên",
                displayMessage: newGroup.lastMessage || "Chưa có tin nhắn",
                avatar: newGroup.avatar || "/group-icon.png",
                unreadCount: 0,
                isGroup: 1,
            };
            
            setConversations((prev) => [normalizedGroup, ...prev]);
            
            // Tự động join vào nhóm vừa tạo
            socket.emit("join_group", { groupId: newGroup.id });
            console.log(`🔗 Auto-joined newly created group: ${newGroup.id}`);
        });

        return () => {
            socket.off("user_status_change");
            socket.off("private_message");
            socket.off("group_created");
            socket.off("group_message");
            socket.off("send_image_message");
            socket.off("send_group_image");
        };
    }, [user?.id, currentChatId, location.pathname]);

    const normalizedConversations = conversations.map((c) => ({
        ...c,
        chatId: c.isGroup ? c.conversationId : c.id,
        displayName: c.isGroup ? c.conversationName || "Nhóm không tên" : c.name || "Người dùng không tên",
        displayMessage: c.lastMessage || "Chưa có tin nhắn",
        avatar: c.avatar || (c.isGroup ? "/group-icon.png" : `https://i.pravatar.cc/50?u=${c.id || c.conversationId}`),
        lastSenderId: c.lastSenderId,
        isOnline: c.isGroup
            ? null
            : "isOnline" in c
            ? c.isOnline
            : Boolean(Number(c.is_online)),
        // Chỉ hiển thị unreadCount cho tin nhắn cá nhân, không cho nhóm
        unreadCount: c.isGroup ? 0   : c.unreadCount,
        name: c.name,
    }));

    const filteredConversations = normalizedConversations.filter((conv) =>
        conv.displayName.toLowerCase().includes(search.toLowerCase())
    );

    const handleMarkAsRead = (chatId) => {
        setConversations((prev) =>
            prev.map((conv) =>
                (conv.isGroup ? conv.conversationId : conv.id) === chatId
                    ? { ...conv, unreadCount: 0 }
                    : conv
            )
        );
        const conv = conversations.find(
            (c) => (c.isGroup ? c.conversationId : c.id) === chatId
        );
        if (conv && !conv.isGroup && user?.id) {
            socket.emit("mark_as_read", { userId: user.id, senderId: conv.id });
        }
    };

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
                {filteredConversations.map((c, index) => (
                    <ChatItem
                        key={`${c.chatId}-${index}`}
                        conversation={c}
                        formatTime={formatTime}
                        isSelected={
                            isGroupChat
                                ? c.isGroup && c.chatId == currentConversationId
                                : !c.isGroup && c.chatId == currentConversationId
                        }
                        onClick={() => {
                            if (c.isGroup) {
                                navigate(`/group-room/${c.chatId}`);
                            } else {
                                navigate(`/chat-room/${c.chatId}`);
                            }
                            handleMarkAsRead(c.chatId);
                        }}
                        currentUserId={user?.id}
                    />
                ))}
            </div>

            <div className="border-t border-gray-300 bg-gray-50">
                <div className="px-3 pt-3 pb-3 flex gap-2">
                    <button
                        onClick={() => {}}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                    >
                        <FiSettings size={16} />
                        Cài đặt
                    </button>
                    <button
                        onClick={logout}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors text-sm font-medium text-white"
                    >
                        <FiLogOut size={16} />
                        Đăng xuất
                    </button>
                </div>
            </div>

            {groupOpen && <Group setGroup={setGroupOpen} />}
        </div>
    );
}

export default SideBar;