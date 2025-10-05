import axios from "axios";
import { useEffect, useState } from "react";
import api from "../api/api";

function useUser()
{
    const [usersGr, setUsersGr] = useState([])
    const [conversations, setConversations] = useState([]);
    const [receiverInfo, setReceiverInfo] = useState(null);
    const fetchUsersGr = async () => {
        try {
            const res = await axios.get(api + "users", {   
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            if (res.data) {
                setUsersGr(res.data)
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
                    avatar: `https://i.pravatar.cc/50?u=${c.id ? c.id : c.conversationId}`,
                    lastMessage: c.lastMessage,
                    lastTime: c.lastTime,
                    unreadCount: c.unreadCount || 0 ,
                    isGroup: c.isGroup,
                    conversationId: c.conversationId,
                    conversationName: c.conversationName
                }));
                setConversations(mapped);
                console.log("✅ Fetch conversations thành công:", mapped);
            }
        } catch (error) {
            console.error("❌ Lỗi khi fetch conversations:", error);
        }
    };

    // Hiển thị tất cả tin nhắn
    const fetchReceiver = async (receiverId) => {
        try {
            const res = await axios.get(api + `auth/user/${receiverId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setReceiverInfo(res.data);
        } catch (err) {
            console.error("❌ Lỗi fetch receiver:", err);
        }
    };
    useEffect(() => {
        fetchUsersGr()    
    }, [])
    return { usersGr, conversations, fetchConversations, setConversations, fetchReceiver, receiverInfo}
}

export default useUser