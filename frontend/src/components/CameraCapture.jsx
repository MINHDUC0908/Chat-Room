import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { FiCamera, FiX } from "react-icons/fi";

const CameraCapture = forwardRef(({ onCapture }, ref) => {
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null); // Lưu stream để cleanup

    // Expose method open() qua ref
    useImperativeHandle(ref, () => ({
        open: () => setCameraActive(true),
    }));

    // Mở camera
    useEffect(() => {
        if (cameraActive) {
            const openCamera = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (err) {
                    alert("Không thể truy cập camera!");
                    console.error(err);
                    setCameraActive(false);
                }
            };
            openCamera();
        }
    }, [cameraActive]);

    // Cleanup stream khi unmount hoặc active=false
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, []);

    // Chụp ảnh
    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const context = canvas.getContext("2d");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Chuyển canvas thành File
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], "camera-photo.png", { type: "image/png" });
                onCapture?.(file); // Gọi callback để parent xử lý (setUploadFile)
                setCameraActive(false); // Đóng camera sau khi chụp
            }
        }, "image/png");
    };

    // Hủy camera
    const stopCamera = () => {
        setCameraActive(false);
    };

    if (!cameraActive) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl p-4 w-full max-w-sm shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-gray-800">Chụp ảnh</h4>
                    <button onClick={stopCamera} className="text-gray-500 hover:text-gray-700">
                        <FiX size={24} />
                    </button>
                </div>
                <div className="flex flex-col items-center">
                    <video ref={videoRef} autoPlay className="rounded-lg w-full max-w-md h-48 bg-black object-cover mb-4" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex gap-4">
                        <button
                            onClick={capturePhoto}
                            className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all"
                        >
                            Chụp
                        </button>
                        <button
                            onClick={stopCamera}
                            className="px-6 py-3 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition-all"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

CameraCapture.displayName = 'CameraCapture';

export default CameraCapture;