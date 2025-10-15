import React, { useState, useRef } from 'react';
import {
    Play,
    Volume2,
    VolumeX,
    Maximize2,
    Minimize2,
    Loader2,
    MoreVertical,
    Download,
    Trash2,
    Link2
} from 'lucide-react';

const VideoMessageUI = ({ msg, onDelete }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hover, setHover] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const videoRef = useRef(null);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            video.play();
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (video) {
            video.muted = !video.muted;
            setIsMuted(video.muted);
        }
    };

    const toggleFullscreen = () => {
        const container = videoRef.current.parentElement;
        if (!document.fullscreenElement) {
            container.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = msg.video_url;
        link.download = msg.video_name || "video.mp4";
        link.click();
        setShowMenu(false);
    };

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(msg.video_url);
        alert("Đã sao chép link video!");
        setShowMenu(false);
    };

    const handleDelete = () => {
        if (onDelete) onDelete(msg.id);
        setShowMenu(false);
    };

    return (
        <div className="flex items-start justify-start">
            <div className="w-[480px]">
                <div className="bg-white overflow-hidden shadow-sm rounded-xl relative">

                    {/* --- KHUNG VIDEO --- */}
                    <div
                        className="relative bg-black rounded-t-xl flex items-center justify-center group"
                        style={{ width: '100%', height: '220px' }}
                        onMouseEnter={() => setHover(true)}
                        onMouseLeave={() => {
                            setHover(false);
                            setShowMenu(false);
                        }}
                    >
                        <video
                            ref={videoRef}
                            src={msg.video_url}
                            className="max-h-full max-w-full object-contain"
                            muted={isMuted}
                            preload="metadata"
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                        />

                        {/* --- LOADING khi đang upload --- */}
                        {msg.isUploading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-t-xl">
                                <Loader2 className="w-10 h-10 text-white animate-spin mb-2" />
                                <p className="text-white text-sm">Đang tải lên...</p>
                            </div>
                        )}

                        {/* --- NÚT PLAY --- */}
                        {!msg.isUploading && !isPlaying && (
                            <button
                                onClick={togglePlay}
                                className={`absolute w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg duration-300 ${
                                    hover ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                                }`}
                            >
                                <Play className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" />
                            </button>
                        )}

                        {/* --- THANH CÔNG CỤ --- */}
                        {!msg.isUploading && (
                            <div
                                className={`absolute bottom-0 left-0 right-0 bg-black/60 h-10 flex items-center justify-between px-3 transition-all duration-300 ${
                                    hover ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={togglePlay}
                                        className="text-white hover:text-gray-300"
                                    >
                                        {isPlaying ? "❚❚" : <Play className="w-5 h-5" fill="white" />}
                                    </button>
                                    <button
                                        onClick={toggleMute}
                                        className="text-white hover:text-gray-300"
                                    >
                                        {isMuted ? (
                                            <VolumeX className="w-5 h-5" />
                                        ) : (
                                            <Volume2 className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>

                                <button
                                    onClick={toggleFullscreen}
                                    className="text-white hover:text-gray-300"
                                >
                                    {isFullscreen ? (
                                        <Minimize2 className="w-5 h-5" />
                                    ) : (
                                        <Maximize2 className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        )}

                        {/* --- NÚT 3 CHẤM (TRÁI TRÊN) --- */}
                        {!msg.isUploading && (
                            <div className="absolute top-2 left-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(!showMenu);
                                    }}
                                    className={`bg-black/50 text-white p-2 rounded-full transition-all duration-300 hover:bg-black ${
                                        hover ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                                    }`}
                                >
                                    <MoreVertical className="w-5 h-5" />
                                </button>

                                {/* --- MENU TUỲ CHỌN --- */}
                                {showMenu && (
                                    <div className="absolute top-10 left-0 bg-white shadow-lg rounded-lg py-2 w-44 z-10 animate-fadeIn">
                                        <button
                                            onClick={handleDelete}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" /> Xoá video
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* --- THÔNG TIN VIDEO --- */}
                    <div className="bg-blue-100 px-4 py-3 flex items-center justify-between rounded-b-xl">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Play className="w-6 h-6 text-white" fill="white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {msg.video_name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                    <span>{msg.video_size} MB</span>
                                    <span>
                                        {msg.isUploading ? "• Đang tải lên..." : "• Đã có trên Cloud"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default VideoMessageUI;
