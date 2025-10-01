
// ProtectedRoute.js
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
    const token = localStorage.getItem("token"); // Lấy token từ localStorage

    if (!token) {
        // Nếu không có token thì quay về login
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;

        // // ✅ Lắng nghe tin nhắn nhóm (bỏ comment để kích hoạt)
        // socket.on("group_message", (msg, groupInfo) => {
        //     const isMyMessage = msg.sender_id === user?.id;
        //     // Lấy ID nhóm đang chat từ URL
        //     const match = location.pathname.match(/\/group-room\/(\d+)/);
        //     const currentGroupId = match ? parseInt(match[1]) : null;
        //     
        //     // Chỉ hiển thị thông báo khi:
        //     // 1. KHÔNG phải tin nhắn của mình
        //     // 2. KHÔNG đang ở trong phòng chat nhóm đó
        //     if (!isMyMessage && msg.group_id !== currentGroupId) {
        //         const groupName = groupInfo?.name || "Nhóm";
        //         const senderName = msg.sender_name || "Thành viên";
        //         const notificationMessage = `${groupName} - ${senderName}: ${msg.content}`;
        //         
        //         const newNotification = {
        //             id: Date.now() + Math.random(),
        //             message: notificationMessage,
        //             icon: "👥",
        //             type: "group",
        //             visible: true
        //         };
        //         
        //         setNotifications(prev => [...prev, newNotification]);
        //         
        //         setTimeout(() => {
        //             setNotifications(prev => 
        //                 prev.map(notif => 
        //                     notif.id === newNotification.id 
        //                         ? { ...notif, visible: false } 
        //                         : notif
        //                 )
        //             );
        //         }, 3500);
        //         
        //         setTimeout(() => {
        //             setNotifications(prev => prev.filter(notif => notif.id !== newNotification.id));
        //         }, 4000);
        //     }
        // });