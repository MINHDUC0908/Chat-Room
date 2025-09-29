import axios from "axios";
import { useState } from "react";
import api from "../api/api";

function useChat()
{
    const [chat, setChat] = useState([]);
    const fetchMessages = async (receiverId) => {
        try {
            const res = await axios.get(
                api + `chat/messages/${receiverId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            setChat(res.data);
            console.log("✅ Tin nhắn cũ:", res.data);
        } catch (err) {
            console.error("❌ Lỗi load tin nhắn:", err);
        }
    };

    return { fetchMessages, chat, setChat }
}

export default useChat