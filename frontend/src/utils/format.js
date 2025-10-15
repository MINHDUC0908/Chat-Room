export function formatTime(time) {
    if (!time) return ""; // nếu null, undefined hoặc rỗng → trả về rỗng
    const date = new Date(time);
    if (isNaN(date.getTime())) return ""; // nếu không phải date hợp lệ → trả về rỗng
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatLastActive(lastActive) {
    if (!lastActive) return "";
    const diff = Math.floor((Date.now() - new Date(lastActive)) / 60000);
    if (diff < 1) return "vừa xong";
    if (diff < 60) return `${diff} phút trước`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
}
