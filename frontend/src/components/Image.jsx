import React, { useState } from "react";
import src from "../api/src";

function ImageModal({ isOpen, onClose, images = [], imageUrl }) {
    if (!isOpen) return null;

    // File hiện tại đang xem (ảnh hoặc video)
    const [currentMedia, setCurrentMedia] = useState(
        imageUrl.startsWith("http") ? imageUrl : src + imageUrl
    );

    // Hàm kiểm tra xem có phải video không
    const isVideo = (url) => /\.(mp4|webm|ogg|mov)$/i.test(url);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col items-center p-4">
                {/* Nút đóng */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-white text-3xl font-bold hover:text-gray-400 transition"
                >
                    ✕
                </button>

                {/* Khu vực hiển thị chính */}
                <div className="flex justify-center items-center w-full h-[70vh] rounded-lg overflow-hidden mb-4 bg-black">
                    {isVideo(currentMedia) ? (
                        <video
                            src={currentMedia}
                            controls
                            autoPlay
                            className="max-w-full max-h-full rounded-lg"
                        />
                    ) : (
                        <img
                            src={currentMedia}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain"
                        />
                    )}
                </div>

                {/* Thanh ảnh/video nhỏ bên dưới */}
                <div className="w-full overflow-x-auto scrollbar-hide">
                    <div className="flex gap-3 p-2 w-max scroll-smooth">
                        {[...images].reverse().map((media, index) => {
                            const fullPath = media.startsWith("http") ? media : src + media;
                            const isThumbVideo = isVideo(fullPath);

                            return (
                                <div
                                    key={index}
                                    className={`w-[60px] h-[60px] flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                                        fullPath === currentMedia
                                            ? "border-blue-500 scale-105"
                                            : "border-transparent hover:scale-105"
                                    }`}
                                    onClick={() => setCurrentMedia(fullPath)}
                                >
                                    {isThumbVideo ? (
                                        <video
                                            src={fullPath}
                                            className="w-full h-full object-cover cursor-pointer"
                                        />
                                    ) : (
                                        <img
                                            src={fullPath}
                                            alt={`Thumbnail ${index}`}
                                            className="w-full h-full object-cover cursor-pointer"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ImageModal;
