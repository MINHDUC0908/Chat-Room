
import { useState } from "react";
import { FiEdit2, FiSearch } from "react-icons/fi";

function SideBar() {
    const [conversations] = useState([
        {
            id: 1,
            name: "phomaiconbocuoi.hehe",
            lastActive: "Hoạt động 1 giờ trước",
            avatar: "https://i.pravatar.cc/50?img=11"
        },
        {
            id: 2,
            name: "Hiền Linh",
            lastActive: "Hoạt động 1 giờ trước",
            avatar: "https://i.pravatar.cc/50?img=12"
        }
    ]);

    const [search, setSearch] = useState("");
    const [filteredConversations, setFilteredConversations] = useState(conversations);

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearch(value);

        if (value.trim() === "") {
            setFilteredConversations(conversations);
        } else {
            const filtered = conversations.filter(conv =>
                conv.name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredConversations(filtered);
        }
    };

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
                <span>minhduc9805</span>
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
                        onChange={handleSearch}
                        style={{
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            flex: 1
                        }}
                    />
                </div>
            </div>

            {/* Ghi chú */}
            <div style={{ padding: "10px 15px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <img
                        src="https://i.pravatar.cc/50?img=1"
                        alt="note"
                        style={{ width: "50px", height: "50px", borderRadius: "50%" }}
                    />
                    <span style={{ fontSize: "14px", color: "#555" }}>Ghi chú của bạn</span>
                </div>
            </div>

            <hr />

            {/* Tabs */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0 15px",
                fontSize: "14px",
                fontWeight: "bold"
            }}>
                <span>Tin nhắn</span>
                <span style={{ color: "#888" }}>Tin nhắn đang chờ</span>
            </div>

            {/* Danh sách chat */}
            <div style={{ flex: 1, overflowY: "auto" }}>
                {filteredConversations.map(conv => (
                    <div
                        key={conv.id}
                        onClick={() => console.log(`Navigate to chat ${conv.id}`)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 15px",
                            textDecoration: "none",
                            color: "#000",
                            cursor: "pointer"
                        }}
                    >
                        <img
                            src={conv.avatar}
                            alt={conv.name}
                            style={{ width: "50px", height: "50px", borderRadius: "50%" }}
                        />
                        <div>
                            <div style={{ fontWeight: "500" }}>{conv.name}</div>
                            <div style={{ fontSize: "12px", color: "#666" }}>{conv.lastActive}</div>
                        </div>
                    </div>
                ))}
                
                {filteredConversations.length === 0 && (
                    <div style={{
                        padding: "20px 15px",
                        textAlign: "center",
                        color: "#888",
                        fontSize: "14px"
                    }}>
                        Không tìm thấy cuộc trò chuyện nào
                    </div>
                )}
            </div>
        </div>
    );
}

export default SideBar;
