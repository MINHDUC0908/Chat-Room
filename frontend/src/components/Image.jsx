import React from "react";

function ImageModal({ isOpen, onClose, imageUrl }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="relative max-w-3xl max-h-[90vh]">
                {/* Ảnh phóng to */}
                <img
                    src={imageUrl}
                    alt="Preview"
                    className="rounded-lg max-h-[90vh] object-contain"
                />
                {/* Nút đóng */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-white text-2xl font-bold hover:text-gray-300"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

export default ImageModal;
