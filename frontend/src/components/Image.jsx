import React, { useState } from "react";
import src from "../api/src";

function ImageModal({ isOpen, onClose, images = [], imageUrl }) {
    if (!isOpen) return null;

    // Ảnh hiện tại đang xem
    const [currentImage, setCurrentImage] = useState(
        imageUrl.startsWith("http") ? imageUrl : src + imageUrl
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col items-center p-4">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-white text-3xl font-bold hover:text-gray-400 transition"
                >
                    ✕
                </button>
                <div className="flex justify-center items-center w-full h-[70vh] rounded-lg overflow-hidden mb-4">
                    <img
                        src={currentImage}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
                <div className="flex gap-3 overflow-x-auto p-2 scrollbar-hide scroll-smooth">
                    {[...images].reverse().map((img, index) => {
                        const fullPath = img.startsWith("http") ? img : src + img;
                        return (
                            <div
                                key={index}
                                className={`w-[60px] h-[60px] flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                                    fullPath === currentImage
                                        ? "border-blue-500 scale-105"
                                        : "border-transparent hover:scale-105"
                                }`}
                            >
                                <img
                                    src={fullPath}
                                    alt={`Thumbnail ${index}`}
                                    onClick={() => setCurrentImage(fullPath)}
                                    className="w-full h-full object-cover cursor-pointer"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default ImageModal;
