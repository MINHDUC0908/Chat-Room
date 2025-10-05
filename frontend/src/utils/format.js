export function formatTime(time) {
    if (!time) return ""; // nếu null, undefined hoặc rỗng → trả về rỗng
    const date = new Date(time);
    if (isNaN(date.getTime())) return ""; // nếu không phải date hợp lệ → trả về rỗng
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
