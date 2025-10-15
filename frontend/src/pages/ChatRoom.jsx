// ChatRoom.jsx
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import api from "../api/api";
import { FiCamera, FiImage, FiPhone, FiSend, FiVideo } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";
import Emoji from "../components/Emoji";
import useUser from "../hooks/useUser";
import useChat from "../hooks/useChat";
import ImageModal from "../components/Image";
import socket from "../utils/socket";
import src from "../api/src";
import VideoMessageUI from "../components/VideoMessageUI";

function ChatRoom({ setCurrentTitle }) {
    const { id: receiverId } = useParams();
    const { user } = useAuth();
    const [message, setMessage] = useState("");
    const [previewImage, setPreviewImage] = useState(null);
    const [previewVideo, setPreviewVideo] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);
    const { receiverInfo, fetchReceiver } = useUser();
    const { chat, setChat, fetchMessages } = useChat();
    const messagesEndRef = useRef(null);
    const imageRef = useRef(null);
    const [emoji, setEmoji] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [progress, setProgress] = useState(0); // % upload
    const [isUploading, setIsUploading] = useState(false);
    
    // Chụp ảnh từ camera
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, [chat]);

    useEffect(() => {
        if (receiverId) fetchReceiver(receiverId);
    }, [receiverId]);

    useEffect(() => {
        setCurrentTitle(`Hộp thư - Direct`);
    }, [receiverId, setCurrentTitle]);

    useEffect(() => {
        if (user) fetchMessages(receiverId);
    }, [receiverId, user]);

    useEffect(() => {
        if (!user) return;

        // Join room với user ID
        socket.emit("join", user.id);

        socket.on("private_message", (msg) => {
            if (
                (msg.sender_id === user.id && msg.receiver_id === parseInt(receiverId)) ||
                (msg.sender_id === parseInt(receiverId) && msg.receiver_id === user.id)
            ) {
                setChat((prev) => [...prev, msg]);
            }
        });

        socket.on("send_image_message", (msg) => {
            if (
                (msg.senderId === user.id && msg.receiverId === parseInt(receiverId)) ||
                (msg.senderId === parseInt(receiverId) && msg.receiverId === user.id)
            ) {
                setChat((prev) => [...prev, {
                    sender_id: msg.senderId,
                    receiver_id: msg.receiverId,
                    content: msg.content || null,
                    image_url: msg.imageUrl,
                    is_read: msg.isRead || false,
                    created_at: msg.createdAt
                }]);
            }
        });

        socket.on("send_video_message", (msg) => {
            if (
                (msg.senderId === user.id && msg.receiverId === parseInt(receiverId)) ||
                (msg.senderId === parseInt(receiverId) && msg.receiverId === user.id)
            ) {
                setChat((prev) => [...prev, {
                    sender_id: msg.senderId,    
                    receiver_id: msg.receiverId,
                    content: msg.content || null,
                    video_url: msg.videoUrl,
                    video_name: msg.videoName,
                    video_size: msg.videoSize,
                    is_read: msg.isRead || false,
                    created_at: msg.createdAt
                }]);
            }
        });

        // 🔹 Khi người gửi nhận được tin nhắn "đã đọc"
        socket.on("messages_read", ({ readerId, senderId }) => {
            console.log("✅ Received messages_read:", { readerId, senderId });
            setChat((prevChat) =>
                prevChat.map((msg) =>
                    msg.receiver_id === readerId && msg.sender_id === senderId
                        ? { ...msg, is_read: true }
                        : msg
                )
            );
        });

        // 🔹 Khi người nhận mở phòng chat → đánh dấu đã đọc TẤT CẢ tin nhắn từ sender
        socket.emit("mark_as_read", {
            userId: parseInt(user.id),
            senderId: parseInt(receiverId),
        });

        // 🔹 Cập nhật local state ngay lập tức (người nhận đã đọc)
        setChat((prevChat) =>
            prevChat.map((msg) =>
                msg.sender_id === parseInt(receiverId) && msg.receiver_id === user.id
                    ? { ...msg, is_read: true }
                    : msg
            )
        );

        return () => {
            socket.off("private_message");
            socket.off("send_image_message");
            socket.off("messages_read");
            socket.off("send_video_message")
        };
    }, [user, receiverId]);

    // ⚡ Gửi sự kiện "đã đọc" khi focus vào input
    const handleFocusInput = () => {
        if (!user || !receiverId) return;
        socket.emit("mark_as_read", {
            userId: parseInt(user.id),
            senderId: parseInt(receiverId),
        });

        // 🔹 Cập nhật ngay trên giao diện
        setChat((prevChat) =>
            prevChat.map((msg) =>
                msg.sender_id === parseInt(receiverId) && msg.receiver_id === user.id
                    ? { ...msg, is_read: true }
                    : msg
            )
        );
    };
    // Mở camera
    const openCamera = async () => {
        try {
            setCameraActive(true);
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            alert("Không thể truy cập camera!");
            console.error(err);
        }
    };

    // Chụp ảnh
    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            const context = canvas.getContext("2d");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Lấy dữ liệu base64
            const imageData = canvas.toDataURL("image/png");
            setPreviewImage(imageData);

            // 🔹 Chuyển base64 thành file thật để upload được
            const byteString = atob(imageData.split(",")[1]);
            const mimeString = imageData.split(",")[0].split(":")[1].split(";")[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });
            const file = new File([blob], "camera-photo.png", { type: mimeString });

            setUploadFile(file); // ✅ uploadFile giờ là File thật
        }
        stopCamera();
    };

    // Tắt camera
    const stopCamera = () => {
        setCameraActive(false);
        const stream = videoRef.current?.srcObject;
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach((track) => track.stop());
        }
        videoRef.current.srcObject = null;
    };


    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");

        if (isImage) {
            // ẢNH → hiển thị preview, chờ người dùng nhấn Gửi
            const previewUrl = URL.createObjectURL(file);
            setPreviewImage(previewUrl);
            setPreviewVideo(null); // reset nếu có video trước đó
            setUploadFile(file);
        } 
        else if (isVideo) {
            // VIDEO → hiển thị preview, chờ người dùng nhấn Gửi
            const previewUrl = URL.createObjectURL(file);
            setPreviewVideo(previewUrl);
            setPreviewImage(null); // reset nếu có ảnh trước đó
            setUploadFile(file);
            setProgress(0);
        } 
        else {
            alert("Vui lòng chọn ảnh hoặc video hợp lệ!");
        }
    };

    // --- GỬI ẢNH ---
    const sendImageMessage = async () => {
        const formData = new FormData();
        formData.append("image", uploadFile);
        formData.append("receiverId", receiverId);

        try {
            const res = await axios.post(api + "image/upload-message-image", formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            if (res.data.success && res.data.message?.imageUrl) {
                const imageUrl = res.data.message.imageUrl;

                socket.emit("send_image_message", {
                    senderId: user.id,
                    receiverId: parseInt(receiverId),
                    fileUrl: imageUrl,
                });

                setPreviewImage(null);
                setUploadFile(null);
            } else {
                alert("Upload ảnh thất bại!");
            }
        } catch (error) {
            console.error(error);
            alert("Có lỗi khi upload ảnh!");
        }
    };

    // --- GỬI VIDEO ---
    const sendVideoMessage = async () => {
        const formData = new FormData();
        formData.append("video", uploadFile);
        formData.append("receiverId", receiverId);
        setIsUploading(true);
        setProgress(0);
         // 1️⃣ Tạo tin nhắn tạm thời
        const tempId = Date.now(); // ID tạm thời
        const tempMessage = {
            id: tempId,
            sender_id: user.id,
            receiver_id: parseInt(receiverId),
            video_url: URL.createObjectURL(uploadFile), // file local preview
            video_name: uploadFile.name,
            video_size: (uploadFile.size / (1024 * 1024)).toFixed(2), // MB
            isUploading: true,
            createdAt: new Date(),
        };

        // 2️⃣ Hiển thị tin nhắn tạm lên UI
        setChat((prev) => [...prev, tempMessage]);
        setPreviewVideo(null);
        setUploadFile(null);
        try {
            const res = await axios.post(api + "image/upload-video", formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (event) => {
                    const percent = Math.round((event.loaded * 100) / event.total);
                    setProgress(percent);
                },
            });

            if (res.data.success) {
                const videoUrl = res.data.video.url;
                console.log("Upload video thành công:", videoUrl);
                // 1️⃣ Xóa tin nhắn tạm thời
                setChat((prev) => prev.filter((msg) => msg.id !== tempId));
                socket.emit("send_video_message", {
                    senderId: user.id,
                    receiverId: parseInt(receiverId),
                    fileUrl: videoUrl,
                    videoName: uploadFile.name,
                    videoSize: (uploadFile.size / (1024 * 1024)).toFixed(2), // MB
                });
            } else {
                console.error("Upload video failed response:", res);
            }
        } catch (error) {
            console.error(error);
            alert("Có lỗi khi upload video!");
        }
    };

    // --- GỬI TIN NHẮN CHÍNH ---
    const sendMessage = async (e) => {
        e.preventDefault();

        // 1️⃣ Gửi tin nhắn văn bản
        if (message.trim()) {
            const newMsg = {
                sender_id: user.id,
                receiver_id: parseInt(receiverId),
                content: message,
            };
            socket.emit("private_message", newMsg);
            setMessage("");
            setEmoji(false);
        }

        // 2️⃣ Gửi file (ảnh / video)
        if (uploadFile) {
            if (uploadFile.type.startsWith("image/")) {
                await sendImageMessage();
            } else if (uploadFile.type.startsWith("video/")) {
                await sendVideoMessage();
            } else {
                alert("Vui lòng chọn ảnh hoặc video hợp lệ!");
            }
        }
    };

    const handleSelectEmoji = (emoji) => {
        setMessage(prev => prev + emoji);
    };
    // Lấy tất cả ảnh trong chat
    const allImages = chat
        .filter((msg) => msg.image_url)
        .map((msg) => msg.image_url);
    return (
        <div className="flex flex-col h-screen">
            <div className="flex items-center justify-between p-4 bg-white shadow-md rounded-t-lg border-b mb-1">
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg">
                        {receiverInfo?.name}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <FiPhone
                        className="w-6 h-6 text-green-500 cursor-pointer hover:scale-110 transition-transform"
                        title="Gọi thoại"
                        onClick={() => console.log("Gọi thoại")}
                    />
                    <FiVideo
                        className="w-6 h-6 text-blue-500 cursor-pointer hover:scale-110 transition-transform"
                        title="Gọi video"
                        onClick={() => console.log("Gọi video")}
                    />
                </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-white">
                {chat.map((msg, i) => {
                    const isCurrentUser = msg.sender_id === user?.id;
                    const prevMsg = i > 0 ? chat[i - 1] : null;
                    const nextMsg = i < chat.length - 1 ? chat[i + 1] : null;
                    const showAvatar = !isCurrentUser && (!nextMsg || nextMsg.sender_id !== msg.sender_id);
                    const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;

                    return (
                        <div key={i} className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                            <div
                                className={`flex mb-1 ${
                                    isCurrentUser ? 'justify-end' : 'justify-start'
                                } ${isFirstInGroup ? 'mt-2' : ''}`}
                            >
                                {!isCurrentUser && (
                                    <div className="w-8 h-8 mr-2 mt-auto">
                                        {showAvatar && (
                                            <img
                                                src={`https://i.pravatar.cc/50?u=${msg.sender_id}`}
                                                alt=""
                                                className="w-7 h-7 rounded-full object-cover"
                                            />
                                        )}
                                    </div>
                                )}

                                <div
                                    className={`max-w-xs text-sm ${
                                        isCurrentUser
                                            ? msg.image_url || msg.video_url
                                                ? 'bg-blue-500 text-white rounded-2xl'
                                                : 'bg-blue-500 text-white rounded-2xl px-3 py-2'
                                            : msg.image_url || msg.video_url
                                            ? 'bg-gray-200 text-black rounded-2xl'
                                            : 'bg-gray-200 text-black rounded-2xl px-3 py-2'
                                    }`}
                                >
                                    {msg.video_url ? (
                                        <VideoMessageUI msg={msg} />
                                    ) : msg.image_url ? (
                                        <img
                                            src={src + msg.image_url}
                                            alt="message"
                                            className="max-w-[200px] max-h-[200px] rounded-lg cursor-pointer"
                                            onClick={() => setSelectedImage(src + msg.image_url)}
                                            onLoad={() => {
                                                messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
                                            }}
                                            onError={(e) => {
                                                console.error("❌ Image load failed:", msg.image_url);
                                                e.target.style.display = "none";
                                            }}
                                        />
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                            {/* 🔹 Hiển thị "Đã xem" chỉ ở tin nhắn cuối cùng mình gửi đã được đọc */}
                            {isCurrentUser &&
                                msg.is_read &&
                                i === chat.map((m, index) => (m.sender_id === user.id && m.is_read ? index : -1)).filter((x) => x !== -1).pop() && (
                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <img
                                            src={`https://i.pravatar.cc/30?u=${msg.receiver_id}`}
                                            alt="Đã xem"
                                            className="w-4 h-4 rounded-full inline-block"
                                        />
                                    </div>
                                )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Preview ảnh hoặc video */}
            {previewImage && (
                <div className="flex justify-end mb-2">
                    <div className="rounded-2xl max-w-xs">
                        <img
                            src={previewImage}
                            alt="preview"
                            className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                        />
                        <div className="flex justify-end mt-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setPreviewImage(null);
                                    setUploadFile(null);
                                }}
                                className="text-red-500 text-xs"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {previewVideo && (
                <div className="flex justify-end mt-4">
                    <div className="rounded-2xl max-w-xs">
                        <video
                            src={previewVideo}
                            className="max-w-[200px] max-h-[200px] rounded-lg bg-black"
                            controls
                        />
                        {isUploading && (
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-blue-500 h-2 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        )}
                        {isUploading && (
                            <p className="text-sm mt-1 text-gray-600">
                                Đang tải lên... {progress}%
                            </p>
                        )}
                        <div className="flex justify-end mt-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setPreviewVideo(null);
                                    setUploadFile(null);
                                    setProgress(0);
                                }}
                                className="text-red-500 text-xs"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Giao diện bật camera */}
            {cameraActive && (
                <div className="flex flex-col items-center mb-2">
                    <video ref={videoRef} autoPlay className="rounded-lg w-64 h-48 bg-black" />
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={capturePhoto}
                            className="px-3 py-1 bg-green-500 text-white rounded-md"
                        >
                            Chụp
                        </button>
                        <button
                            onClick={stopCamera}
                            className="px-3 py-1 bg-gray-400 text-white rounded-md"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            )}
            <form onSubmit={sendMessage} className="flex items-center p-2 border-t bg-white">
                <button
                    type="button"
                    onClick={openCamera}
                    className="p-2 text-gray-500 hover:text-gray-700"
                >
                    <FiCamera size={20} />
                </button>
                <label htmlFor="file-upload" className="p-2 text-gray-500 hover:text-gray-700 cursor-pointer">
                    <FiImage size={20} />
                </label>
                <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    // accept="image/*,video/*"
                    accept="/*"
                    onChange={handleFileUpload}
                />
                <button
                    type="button"
                    onClick={() => setEmoji(!emoji)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                >
                    <BsEmojiSmile size={20} />
                </button>
                <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onFocus={handleFocusInput} // 👈 thêm dòng này
                    className="flex-1 mx-2 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <div ref={imageRef} />
                <button
                    type="submit"
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center"
                >
                    <FiSend />
                </button>
            </form>
            {emoji && <Emoji onSelect={handleSelectEmoji} />}
            <ImageModal
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                imageUrl={selectedImage}
                images={allImages}
            />
        </div>
    );
}

export default ChatRoom;