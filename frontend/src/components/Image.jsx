import React, { useState } from "react";
import { X, Download, Upload, MessageCircle, Bookmark, Share2 } from "lucide-react"; // Thêm icons cho nút top
import src from "../api/src";

function ImageModal({ isOpen, onClose, images = [], imageUrl }) {
    if (!isOpen) return null;

    const [currentMedia, setCurrentMedia] = useState(
        imageUrl.startsWith("http") ? imageUrl : src + imageUrl
    );

    const isVideo = (url) => /\.(mp4|webm|ogg|mov)$/i.test(url);

    const handleDownload = () => {
        // Logic tải xuống, ví dụ:
        const link = document.createElement('a');
        link.href = currentMedia;
        link.download = 'image.jpg';
        link.click();
    };

    const handleUpload = () => {
        console.log('Upload functionality here');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col items-center p-4">
                <div className="absolute top-0 left-0 right-0 flex justify-end items-center p-3 gap-2 z-20">
                    <button
                        onClick={handleDownload}
                        className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
                        title="Tải xuống"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleUpload}
                        className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
                        title="Tải lên"
                    >
                        <Upload className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
                        title="Đóng"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="relative flex justify-center items-center w-full h-[70vh] rounded-lg overflow-hidden mb-4 bg-black pt-16"> {/* pt-16 để tránh overlap top bar */}
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