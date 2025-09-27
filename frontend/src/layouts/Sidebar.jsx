import { useEffect, useState } from "react";
import { FiEdit2, FiSearch } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../api/api";
import { io } from "socket.io-client";

const socket = io("http://192.168.1.77:3000"); // backend socket

function SideBar() {
    const { user } = useAuth();
    const navigate = useNavigate(); 

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
                        lastTime: new Date().toLocaleTimeString()
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
                        lastTime: new Date().toLocaleTimeString()
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
                    padding: "5px 10px"
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
            <div style={{ padding: "10px 15px", borderTop: "1px solid #ddd" }}>
                <div style={{ fontWeight: "bold", marginBottom: "10px" }}>Tin nhắn</div>
                {filteredConversations.map(c => (
                    <div
                        key={c.id}
                        onClick={() => navigate(`/chat-room/${c.id}`)}
                        style={{
                            display: "flex",        
                            alignItems: "center",
                            gap: "10px",
                            padding: "8px 0",
                            cursor: "pointer"
                        }}
                    >
                        <img    
                            src={c.avatar}
                            alt={c.name}
                            style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                        />  
                        <div>
                            <div style={{ fontWeight: "500" }}>{c.name}</div>
                            <div style={{ fontSize: "12px", color: "#666" }}>
                                {c.lastMessage || c.email}
                            </div>
                        </div>
                        <div style={{ marginLeft: "auto", fontSize: "11px", color: "#888" }}>
                            {c.lastTime}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SideBar;
