// DefaultLayout.jsx
import { Outlet, useLocation } from "react-router-dom";
import SideBar from "./Sidebar";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import socket from "../utils/socket";

function DefaultLayout() {
    const location = useLocation();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    
    useEffect(() => {
        // ✅ Lắng nghe sự kiện gửi ảnh (xác nhận gửi thành công)
        socket.on("send_image_message", (msg, senderInfo) => {
            const newNotification = {
                id: Date.now() + Math.random(), // ID duy nhất
                message: senderInfo?.name + ": Đã gửi một ảnh",
                icon: "🖼️",
                type: "image",
                visible: true // Để animation
            };
            
            setNotifications(prev => [...prev, newNotification]);
            
            // Tự động ẩn sau 3.5 giây
            setTimeout(() => {
                setNotifications(prev => 
                    prev.map(notif => 
                        notif.id === newNotification.id 
                            ? { ...notif, visible: false } 
                            : notif
                    )
                );
            }, 3500);
            
            // Xóa sau animation
            setTimeout(() => {
                setNotifications(prev => prev.filter(notif => notif.id !== newNotification.id));
            }, 4000);
        });
        // ✅ Lắng nghe tin nhắn riêng tư
        socket.on("private_message", (msg, senderInfo) => {
            // Kiểm tra xem có phải tin nhắn của mình không
            const isMyMessage = msg.sender_id === user?.id;
            
            // Lấy ID người đang chat từ URL
            const match = location.pathname.match(/\/chat-room\/(\d+)/);
            const currentChatUserId = match ? parseInt(match[1]) : null;
            
            // Chỉ hiển thị thông báo khi:
            // 1. KHÔNG phải tin nhắn của mình
            // 2. KHÔNG đang ở trong phòng chat với người gửi
            if (!isMyMessage && msg.sender_id !== currentChatUserId) {
                const senderName = senderInfo?.name || "Người dùng";
                const notificationMessage = `${senderName}: ${msg.content}`;
                
                const newNotification = {
                    id: Date.now() + Math.random(), // ID duy nhất
                    message: notificationMessage,
                    icon: "💬",
                    type: "private",
                    visible: true // Để animation
                };
                
                setNotifications(prev => [...prev, newNotification]);
                
                // Tự động ẩn sau 3.5 giây
                setTimeout(() => {
                    setNotifications(prev => 
                        prev.map(notif => 
                            notif.id === newNotification.id 
                                ? { ...notif, visible: false } 
                                : notif
                        )
                    );
                }, 3500);
                
                // Xóa sau animation
                setTimeout(() => {
                    setNotifications(prev => prev.filter(notif => notif.id !== newNotification.id));
                }, 4000);
            }
        });
        return () => {
            socket.off("private_message");
            socket.off("group_message");
        };
    }, [location.pathname, user?.id]);
    
    // Hàm đóng thông báo thủ công
    const closeNotification = (id) => {
        setNotifications(prev => 
            prev.map(notif => 
                notif.id === id ? { ...notif, visible: false } : notif
            )
        );
        setTimeout(() => {
            setNotifications(prev => prev.filter(notif => notif.id !== id));
        }, 300);
    };
    
    return (
        <>
            <div className="flex h-screen">
                <div className="w-3/12">
                    <SideBar />
                </div>

                <div className="w-9/12 bg-white">
                    <Outlet />
                </div>
            </div>
            
            {/* Container thông báo tùy chỉnh */}
            <div className="fixed top-6 right-6 z-50 flex flex-col space-y-3 pointer-events-auto">
                {notifications.map((notif) => (
                    <div
                        key={notif.id}
                        className={`
                            w-80 max-w-xs transform transition-all duration-300 ease-in-out
                            bg-gradient-to-r from-gray-800 to-gray-900 
                            text-white p-4 rounded-xl shadow-xl border-l-4 
                            ${notif.type === 'private' 
                                ? 'border-blue-500' 
                                : 'border-green-500'
                            }
                            ${notif.visible 
                                ? 'translate-x-0 opacity-100 scale-100' 
                                : 'translate-x-full opacity-0 scale-95'
                            }
                            hover:shadow-2xl hover:scale-105
                            flex items-start justify-between gap-3
                        `}
                    >
                        {/* Icon và nội dung */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="text-2xl flex-shrink-0 mt-0.5">
                                {notif.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-100 truncate mb-1">
                                    Tin nhắn mới
                                </p>
                                <p className="text-sm text-gray-200 break-words leading-relaxed">
                                    {notif.message}
                                </p>
                            </div>
                        </div>
                        
                        {/* Nút đóng */}
                        <button
                            onClick={() => closeNotification(notif.id)}
                            className="text-gray-400 hover:text-white transition-colors duration-200 flex-shrink-0 ml-2 p-1 -mt-1 hover:bg-gray-700 rounded-full"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </>
    );
}

export default DefaultLayout;