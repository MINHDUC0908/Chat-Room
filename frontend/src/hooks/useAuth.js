import axios from "axios";
import { useState } from "react";

function useAuth()
{
    const [user, setUser] = useState("");

    const login = async (email, password) => 
    {
        try {
            const res = await axios.post("http://localhost:3000/auth/login", { email, password });
            setUser(res.data.user);
            return res.data;
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    }


    return { user, login };
}

export default useAuth;