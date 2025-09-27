import { useEffect, useState } from "react";
import { FiEdit2, FiSearch } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import api from "../api/api";
import { io } from "socket.io-client";
import { formatTime } from "../utils/format";
import ChatItem from "../components/ChatList";

const socket = io("http://192.168.1.77:3000"); // backend socket

function SideBar() {
    const { user } = useAuth();
    const navigate = useNavigate(); 
    const { id: currentChatId } = useParams();
    console.log("🟢 currentChatId:", currentChatId);
    
    const [users, setUsers] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [search, setSearch] = useState("");

    const fetchUsers = async () => {
        try {
            const res = await axios.get(api + "auth/users", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            if (res.data) {
                setUsers(res.data);
                console.log("✅ Fetch users thành công:", res.data);
            }
        } catch (error) {
            console.error("❌ Lỗi khi fetch users:", error);
        }
    }

    const fetchConversations = async () => {
        try {
            const res = await axios.get(api + "chat/conversations", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            if (res.data) {
                // map thêm avatar vào cho đồng nhất
                const mapped = res.data.map(c => ({
                    id: c.id,
                    name: c.name,
                    email: c.email,
                    avatar: `https://i.pravatar.cc/50?u=${c.id}`,
                    lastMessage: c.lastMessage,
                    lastTime: c.lastTime
                }));
                setConversations(mapped);
                console.log("✅ Fetch conversations thành công:", mapped);
            }
        } catch (error) {
            console.error("❌ Lỗi khi fetch conversations:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchConversations(); // 👈 gọi thêm

        if (user?.id) {
            socket.emit("join", user.id);
        }

        socket.on("private_message", (msg) => {
            console.log("📩 Nhận tin nhắn:", msg);

            const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;

            setConversations((prev) => {
                const exists = prev.find((c) => c.id === otherUserId);
                if (exists) {
                    const updated = prev.filter((c) => c.id !== otherUserId);
                    return [
                        {
                            ...exists,
                            lastMessage: msg.content,
                            lastTime: new Date().toISOString()
                        },
                        ...updated
                    ];
                } else {
                    const u = users.find((u) => u.id === otherUserId);
                    if (!u) return prev;

                    return [
                        {
                            id: u.id,
                            name: u.name,
                            email: u.email,
                            avatar: `https://i.pravatar.cc/50?u=${u.id}`,
                            lastMessage: msg.content,
                            lastTime: new Date().toISOString()
                        },
                        ...prev
                    ];
                }
            });
        });

        return () => {
            socket.off("private_message");
        };
    }, [user]);

    // lọc tìm kiếm
    const filteredConversations = conversations.filter(conv =>
        conv.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{
            width: "350px",
            borderRight: "1px solid #ddd",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            background: "#fff"
        }}>
            {/* Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "15px",
                fontWeight: "bold",
                fontSize: "18px"
            }}>
                <span>{user?.name}</span>
                <FiEdit2 style={{ cursor: "pointer" }} />
            </div>

            {/* Search */}
            <div style={{ padding: "0 15px 10px" }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#f1f1f1",
                    borderRadius: "8px",
                    padding: "0px 10px"
                }}>
                    <FiSearch style={{ marginRight: "8px", color: "#888" }} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            flex: 1
                        }}
                    />
                </div>
            </div>

            {/* Danh sách chat */}
            <div style={{ padding: "10px 0px", borderTop: "1px solid #ddd" }}>
                <div className="font-bold mb-[10px] px-[15px]">Tin nhắn</div>
                {filteredConversations.map(c => (
                    <ChatItem
                        key={c.id}
                        conversation={c}
                        formatTime={formatTime}
                        isSelected={c.id == currentChatId} // so sánh với id trên URL
                        onClick={() => navigate(`/chat-room/${c.id}`)}
                    />
                ))}
            </div>
        </div>
    );
}

export default SideBar;
