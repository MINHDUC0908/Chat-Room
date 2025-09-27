import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function useAuth() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const login = async (email, password) => {
        try {
            const res = await axios.post("http://localhost:3000/auth/login", { email, password });

            // Kiểm tra xem response có hợp lệ không
            if (res.data && res.data.token && res.data.user) {
                setUser(res.data.user);
                localStorage.setItem("token", res.data.token);
                
                console.log("✅ Login thành công:", res.data.user);
                navigate("/"); // Chỉ chuyển hướng khi login thành công
                return res.data;
            } else {
                // Nếu response không có token hoặc user thì báo lỗi
                console.error("❌ Response không hợp lệ:", res.data);
                throw new Error("Thông tin đăng nhập không chính xác!");
            }
        } catch (error) {
            // Xử lý lỗi từ server
            if (error.response) {
                const statusCode = error.response.status;
                const errorMessage = error.response.data?.message;
                
                console.error("❌ Lỗi đăng nhập:", errorMessage || `HTTP ${statusCode}`);
                
                // Xử lý các mã lỗi cụ thể
                if (statusCode === 401) {
                    throw new Error("Email hoặc mật khẩu không chính xác!");
                } else if (statusCode === 404) {
                    throw new Error("Tài khoản không tồn tại!");
                } else if (statusCode === 500) {
                    throw new Error("Lỗi server. Vui lòng thử lại sau!");
                } else {
                    throw new Error(errorMessage || "Đăng nhập thất bại!");
                }
            } else if (error.request) {
                // Lỗi network/connection
                console.error("❌ Lỗi kết nối:", error.request);
                throw new Error("Không thể kết nối tới server. Vui lòng kiểm tra kết nối mạng!");
            } else {
                // Lỗi khác
                console.error("❌ Lỗi không xác định:", error.message);
                throw new Error(error.message || "Đã có lỗi xảy ra. Vui lòng thử lại!");
            }
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("token");
        navigate("/login");
    };

    return { user, login, logout };
}


export default useAuth;