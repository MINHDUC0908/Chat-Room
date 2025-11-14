// DefaultLayout.jsx
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import SideBar from "./Sidebar";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import socket from "../utils/socket";
import AudioCall from "../components/AudioCallPrivate";
import VideoCall from "../components/VideoCallPrivate";
import AudioGroup from "../components/AudioGroup";

function DefaultLayout() {
    const location = useLocation();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Điện audio call
    const audioCallRef = useRef();
    const videoCallRef = useRef();
    const audioCallGroupRef = useRef();
    const navigate = useNavigate();

    // Toggle sidebar for mobile
    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    // Close sidebar on route change or outside click (basic)
    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [location]);

    // ✅ Khi nhận cuộc gọi đến, có thể tự động chuyển đến trang chat
    useEffect(() => {
        if (!user?.id) return;

        const handleIncomingCall = ({ from }) => {
            console.log("📞 Incoming call from:", from);
            // navigate(`/chat-room/${from}`);
        };
        socket.on("incoming-call", handleIncomingCall);

        return () => {
            socket.off("incoming-call", handleIncomingCall);
        };
    }, [user, navigate]);

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
            const match = location.pathname.match(/\/chat-room\/(\d+)/);
            const currentChatUserId = match ? parseInt(match[1]) : null;
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
            socket.off("send_image_message");
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
            {user && (
                <AudioCall 
                    ref={audioCallRef}
                    user={user} 
                    receiverId={null}  // Không cần receiverId ban đầu
                />
            )}
            {user && (
                <VideoCall 
                    ref={videoCallRef}
                    user={user} 
                    receiverId={null}  // Không cần receiverId ban đầu
                />
            )}
            {
                user && (
                    <AudioGroup
                        ref={audioCallGroupRef}
                        user={user}
                    />
                )
            }
            <div className="flex h-screen bg-gray-50">
                <button
                    onClick={toggleMobileSidebar}
                    className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-white shadow-lg hover:bg-gray-100 transition-colors"
                >
                    <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                {isMobileSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                        onClick={toggleMobileSidebar}
                    />
                )}
                <div className={`
                    fixed md:static inset-y-0 left-0 z-40 w-full md:w-3/12 bg-white shadow-lg 
                    transform transition-transform duration-300 ease-in-out
                    ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                    md:translate-x-0
                `}>
                    <SideBar onMobileClose={toggleMobileSidebar} />
                </div>
                <div className="flex-1 md:w-9/12 bg-white overflow-y-auto ml-0 md:ml-0">
                    <Outlet context={{ audioCallRef, videoCallRef, audioCallGroupRef, toggleMobileSidebar }} />
                </div>
            </div>
            <div className="fixed top-4 md:top-6 right-4 md:right-6 z-50 flex flex-col space-y-2 md:space-y-3 pointer-events-auto">
                {notifications.map((notif) => (
                    <div
                        key={notif.id}
                        className={`
                            w-full md:w-80 max-w-xs transform transition-all duration-300 ease-in-out
                            bg-gradient-to-r from-gray-800 to-gray-900 
                            text-white p-3 md:p-4 rounded-xl shadow-xl border-l-4 
                            ${notif.type === 'private' 
                                ? 'border-blue-500' 
                                : 'border-green-500'
                            }
                            ${notif.visible 
                                ? 'translate-x-0 opacity-100 scale-100' 
                                : 'translate-x-full opacity-0 scale-95'
                            }
                            hover:shadow-2xl hover:scale-105
                            flex items-start justify-between gap-2 md:gap-3
                        `}
                    >
                        <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                            <div className="text-xl md:text-2xl flex-shrink-0 mt-0.5">
                                {notif.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs md:text-sm font-medium text-gray-100 truncate mb-1">
                                    Tin nhắn mới
                                </p>
                                <p className="text-xs md:text-sm text-gray-200 break-words leading-relaxed">
                                    {notif.message}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => closeNotification(notif.id)}
                            className="text-gray-400 hover:text-white transition-colors duration-200 flex-shrink-0 ml-1 md:ml-2 p-1 -mt-1 hover:bg-gray-700 rounded-full"
                        >
                            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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