// hooks/useAuth.js
import axios from "axios";
import { useState, useContext, createContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import socket from "../utils/socket";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const profile = async () => {
        try {
            const res = await axios.get(api + "profile", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            })
            if (res.data && res.data.user) {
                setUser(res.data.user);
                return res.data;
            }
        } catch (error) {
            console.error("❌ Lỗi khi fetch profile:", error);
        }
    }

    const login = async (email, password) => {
        try {
            const res = await axios.post(api + "auth/login", { email, password });

            if (res.data && res.data.token && res.data.user) {
                setUser(res.data.user);
                localStorage.setItem("token", res.data.token);
                console.log("✅ Login thành công:", res.data.user);
                navigate("/");
                return res.data;
            } else {
                throw new Error("Thông tin đăng nhập không chính xác!");
            }
        } catch (error) {
            if (error.response) {
                const statusCode = error.response.status;
                const errorMessage = error.response.data?.message;
                if (statusCode === 401) throw new Error("Email hoặc mật khẩu không chính xác!");
                if (statusCode === 404) throw new Error("Tài khoản không tồn tại!");
                if (statusCode === 500) throw new Error("Lỗi server. Vui lòng thử lại sau!");
                throw new Error(errorMessage || "Đăng nhập thất bại!");
            } else if (error.request) {
                throw new Error("Không thể kết nối tới server. Vui lòng kiểm tra kết nối mạng!");
            } else {
                throw new Error(error.message || "Đã có lỗi xảy ra. Vui lòng thử lại!");
            }
        }
    };

    const logout = () => {
        if (user?.id) {
            socket.emit("user_offline", user.id); // 👈 báo offline trước
        }
        setUser(null);
        localStorage.removeItem("token");
        navigate("/login");
    };

    useEffect(() => {
        profile();
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);