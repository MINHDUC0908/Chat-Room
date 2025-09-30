import { useEffect, useRef, useState } from 'react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff } from 'react-icons/fi';

export default function VideoCallModal({ 
    isOpen, 
    onClose, 
    localStream, 
    remoteStream, 
    isCalling, 
    isReceiving,
    onAccept,
    onReject,
    callerName,
    callerAvatar,
    isMuted,
    isVideoOff,
    onToggleMute,
    onToggleVideo
}) {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="relative w-full h-full">
                {/* Layout 2 video - luôn hiển thị */}
                <div className="w-full h-full flex">
                    {/* Video người kia - Bên trái */}
                    <div className="flex-1 relative bg-gray-900">
                        {remoteStream ? (
                            // Đã có video của người kia
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            // Chưa có video - hiển thị avatar
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black">
                                <div className="text-center">
                                    <div className="w-40 h-40 mx-auto mb-6 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden shadow-2xl ring-4 ring-blue-400 ring-opacity-50">
                                        {callerAvatar ? (
                                            <img 
                                                src={callerAvatar} 
                                                alt={callerName}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.innerHTML = `<span class="text-7xl text-white font-bold">${callerName?.charAt(0)?.toUpperCase() || '?'}</span>`;
                                                }}
                                            />
                                        ) : (
                                            <span className="text-7xl text-white font-bold">
                                                {callerName?.charAt(0)?.toUpperCase() || '?'}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-white text-2xl font-semibold mb-3">
                                        {callerName || 'Người dùng'}
                                    </p>
                                    {isCalling && (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                            </div>
                                            <p className="text-gray-300 text-lg ml-2">Đang gọi</p>
                                        </div>
                                    )}
                                    {isReceiving && (
                                        <div className="space-y-2">
                                            <p className="text-green-400 text-xl font-medium animate-pulse">
                                                Cuộc gọi đến...
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* Label tên người kia */}
                        {remoteStream && (
                            <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 px-3 py-2 rounded-lg backdrop-blur-sm">
                                <div className="flex items-center gap-2">
                                    {callerAvatar && (
                                        <img 
                                            src={callerAvatar} 
                                            alt={callerName}
                                            className="w-6 h-6 rounded-full object-cover"
                                        />
                                    )}
                                    <p className="text-white text-sm font-semibold">{callerName}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Video của bạn - Bên phải - LUÔN HIỂN THỊ */}
                    <div className="flex-1 relative bg-gray-800">
                        {localStream ? (
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            // Placeholder khi chưa có camera
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                <div className="text-center">
                                    <FiVideo className="text-gray-600 text-6xl mx-auto mb-4" />
                                    <p className="text-gray-400">Đang khởi động camera...</p>
                                </div>
                            </div>
                        )}
                        {/* Label "Bạn" */}
                        <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 px-3 py-2 rounded-lg backdrop-blur-sm">
                            <p className="text-white text-sm font-semibold">Bạn</p>
                        </div>
                    </div>
                </div>

                {/* Controls - luôn ở giữa dưới */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-10">
                    {/* Mute Button */}
                    {!isReceiving && (
                        <button
                            onClick={onToggleMute}
                            className={`p-4 rounded-full shadow-lg transition-all transform hover:scale-110 ${
                                isMuted 
                                    ? 'bg-red-500 hover:bg-red-600' 
                                    : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                            title={isMuted ? "Bật mic" : "Tắt mic"}
                        >
                            {isMuted ? (
                                <FiMicOff className="text-white text-2xl" />
                            ) : (
                                <FiMic className="text-white text-2xl" />
                            )}
                        </button>
                    )}

                    {/* End/Reject Call Button */}
                    <button
                        onClick={isReceiving ? onReject : onClose}
                        className="p-5 bg-red-600 hover:bg-red-700 rounded-full shadow-lg transition-all transform hover:scale-110"
                        title={isReceiving ? "Từ chối" : "Kết thúc"}
                    >
                        <FiPhoneOff className="text-white text-3xl" />
                    </button>

                    {/* Accept Call Button */}
                    {isReceiving && (
                        <button
                            onClick={onAccept}
                            className="p-5 bg-green-600 hover:bg-green-700 rounded-full shadow-lg transition-all transform hover:scale-110 animate-pulse"
                            title="Trả lời"
                        >
                            <FiVideo className="text-white text-3xl" />
                        </button>
                    )}

                    {/* Video Toggle Button */}
                    {!isReceiving && (
                        <button
                            onClick={onToggleVideo}
                            className={`p-4 rounded-full shadow-lg transition-all transform hover:scale-110 ${
                                isVideoOff 
                                    ? 'bg-red-500 hover:bg-red-600' 
                                    : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                            title={isVideoOff ? "Bật camera" : "Tắt camera"}
                        >
                            {isVideoOff ? (
                                <FiVideoOff className="text-white text-2xl" />
                            ) : (
                                <FiVideo className="text-white text-2xl" />
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}