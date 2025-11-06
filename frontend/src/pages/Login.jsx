import { LockClosedIcon, ChatBubbleLeftRightIcon, SparklesIcon, UserGroupIcon, BoltIcon, ShieldCheckIcon } from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

function Login({ setCurrentTitle }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth(); 
    
    useEffect(() => {
        setCurrentTitle("Đăng nhập");
    }, [setCurrentTitle]);

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!email.trim() || !password.trim()) {
            toast.error("Vui lòng nhập đầy đủ email và mật khẩu!");
            return;
        }

        setIsLoading(true);
        try {
            await login(email, password);
            toast.success("🎉 Đăng nhập thành công!");
        } catch (err) {
            toast.error(err.message || "❌ Đăng nhập thất bại!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full bg-purple-500/20 blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-blue-500/20 blur-3xl" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 h-96 w-96 animate-pulse rounded-full bg-pink-500/20 blur-3xl" style={{ animationDelay: '2s' }}></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
            </div>

            <div className="relative z-10 flex w-full">
                {/* LEFT SIDE - Welcome/Features */}
                <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20">
                    <div className="space-y-8">
                        {/* Logo & Brand */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 shadow-lg">
                                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-3xl font-bold text-transparent">
                                        Chat Room
                                    </h1>
                                    <p className="text-xs text-gray-300">Kết nối mọi lúc, mọi nơi</p>
                                </div>
                            </div>
                        </div>

                        {/* Hero Text */}
                        <div className="space-y-3">
                            <h2 className="text-2xl font-bold text-white leading-snug">
                                Trò chuyện thú vị,<br />
                                <span className="text-transparent bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text">
                                    Kết nối không giới hạn
                                </span>
                            </h2>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Tham gia cộng đồng chat năng động với hàng ngàn người dùng trên toàn thế giới. Chia sẻ, kết nối và trải nghiệm những cuộc trò chuyện thú vị mỗi ngày.
                            </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 group">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-400/20 transition-all group-hover:bg-purple-400/30 group-hover:scale-110">
                                    <BoltIcon className="h-5 w-5 text-purple-300" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Tin nhắn tức thời</h3>
                                    <p className="text-xs text-gray-300">Gửi và nhận tin nhắn trong thời gian thực</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 group">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-400/20 transition-all group-hover:bg-pink-400/30 group-hover:scale-110">
                                    <UserGroupIcon className="h-5 w-5 text-pink-300" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Phòng chat đa dạng</h3>
                                    <p className="text-xs text-gray-300">Tham gia các phòng chat theo sở thích</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 group">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-400/20 transition-all group-hover:bg-blue-400/30 group-hover:scale-110">
                                    <ShieldCheckIcon className="h-5 w-5 text-blue-300" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Bảo mật tuyệt đối</h3>
                                    <p className="text-xs text-gray-300">Thông tin được mã hóa và bảo vệ an toàn</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-6 pt-2">
                            <div className="space-y-0.5">
                                <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text">
                                    10K+
                                </div>
                                <div className="text-xs text-gray-300">Người dùng</div>
                            </div>
                            <div className="space-y-0.5">
                                <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-pink-300 to-blue-300 bg-clip-text">
                                    50+
                                </div>
                                <div className="text-xs text-gray-300">Phòng chat</div>
                            </div>
                            <div className="space-y-0.5">
                                <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text">
                                    24/7
                                </div>
                                <div className="text-xs text-gray-300">Hoạt động</div>
                            </div>
                        </div>

                        {/* Decorative chat bubbles */}
                        <div className="relative h-24">
                            <div className="absolute left-0 top-0 animate-bounce" style={{ animationDuration: '3s' }}>
                                <div className="rounded-xl bg-purple-400/20 border border-purple-400/30 px-3 py-1.5 backdrop-blur-sm">
                                    <p className="text-xs text-purple-200">Xin chào! 👋</p>
                                </div>
                            </div>
                            <div className="absolute right-20 top-6 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
                                <div className="rounded-xl bg-pink-400/20 border border-pink-400/30 px-3 py-1.5 backdrop-blur-sm">
                                    <p className="text-xs text-pink-200">Rất vui được gặp bạn! 😊</p>
                                </div>
                            </div>
                            <div className="absolute left-28 bottom-0 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                                <div className="rounded-xl bg-blue-400/20 border border-blue-400/30 px-3 py-1.5 backdrop-blur-sm">
                                    <p className="text-xs text-blue-200">Hẹn gặp lại nhé! 🚀</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE - Login Form */}
                <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12">
                    <div className="w-full max-w-sm">
                        {/* Glow effect */}
                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-75 blur-lg"></div>
                        
                        <div className="relative rounded-2xl border border-white/20 bg-slate-800/90 p-6 shadow-2xl backdrop-blur-xl">
                            {/* Logo for mobile */}
                            <div className="text-center lg:hidden mb-4">
                                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 shadow-lg">
                                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                                </div>
                                <h2 className="mt-3 bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-2xl font-bold text-transparent">
                                    Chat Room
                                </h2>
                            </div>

                            {/* Title */}
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-white">
                                    Đăng nhập
                                </h2>
                                <div className="mt-1.5 flex items-center justify-center gap-1">
                                    <SparklesIcon className="h-3.5 w-3.5 animate-pulse text-yellow-300" />
                                    <p className="text-xs text-gray-300">
                                        Chào mừng bạn quay trở lại
                                    </p>
                                    <SparklesIcon className="h-3.5 w-3.5 animate-pulse text-yellow-300" style={{ animationDelay: '0.5s' }} />
                                </div>
                            </div>

                            {/* Form */}
                            <div className="mt-6 space-y-4">
                                <div className="space-y-3">
                                    {/* Email */}
                                    <div className="group">
                                        <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-gray-200">
                                            Email
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={isLoading}
                                            required
                                            className="block w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-gray-400 shadow-sm backdrop-blur-sm transition-all duration-300 focus:border-purple-400 focus:bg-white/15 focus:ring-2 focus:ring-purple-400/50 disabled:cursor-not-allowed disabled:opacity-50 group-hover:border-white/30"
                                            placeholder="your.email@example.com"
                                        />
                                    </div>
                                    
                                    {/* Password */}
                                    <div className="group">
                                        <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-gray-200">
                                            Mật khẩu
                                        </label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoComplete="current-password"
                                            disabled={isLoading}
                                            required
                                            className="block w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-gray-400 shadow-sm backdrop-blur-sm transition-all duration-300 focus:border-purple-400 focus:bg-white/15 focus:ring-2 focus:ring-purple-400/50 disabled:cursor-not-allowed disabled:opacity-50 group-hover:border-white/30"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                {/* Remember + forgot */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input
                                            id="remember-me"
                                            name="remember-me"
                                            type="checkbox"
                                            disabled={isLoading}
                                            className="h-3.5 w-3.5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-2 focus:ring-purple-400 focus:ring-offset-0 disabled:opacity-50"
                                        />
                                        <label
                                            htmlFor="remember-me"
                                            className="ml-2 text-xs text-gray-300"
                                        >
                                            Ghi nhớ đăng nhập
                                        </label>
                                    </div>

                                    <div className="text-xs">
                                        <a
                                            href="#"
                                            className="font-medium text-purple-300 transition-colors hover:text-purple-200"
                                        >
                                            Quên mật khẩu?
                                        </a>
                                    </div>
                                </div>

                                {/* Button login */}
                                <div>
                                    <button
                                        type="button"
                                        onClick={handleLogin}
                                        disabled={isLoading}
                                        className="group relative flex w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 py-2.5 px-4 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
                                    >
                                        <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
                                        
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                            <LockClosedIcon
                                                className="h-4 w-4 text-white/80 transition-transform group-hover:scale-110"
                                                aria-hidden="true"
                                            />
                                        </span>
                                        
                                        <span className="relative text-sm">
                                            {isLoading ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Đang đăng nhập...
                                                </span>
                                            ) : (
                                                "Đăng nhập ngay"
                                            )}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Register link */}
                            <div className="mt-4 text-center">
                                <p className="text-xs text-gray-300">
                                    Chưa có tài khoản?{" "}
                                    <a
                                        href="/register"
                                        className="font-semibold text-transparent bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text hover:from-purple-200 hover:to-pink-200 transition-all"
                                    >
                                        Đăng ký ngay
                                    </a>
                                </p>
                            </div>

                            {/* Social login */}
                            <div className="mt-4">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/20"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs">
                                        <span className="bg-slate-800 px-3 text-gray-400">hoặc tiếp tục với</span>
                                    </div>
                                </div>

                                <div className="mt-3 grid grid-cols-3 gap-2.5">
                                    <button className="flex items-center justify-center rounded-lg border border-white/20 bg-white/10 py-2 transition-all hover:bg-white/15 hover:border-white/30 hover:scale-105">
                                        <span className="text-lg">🔵</span>
                                    </button>
                                    <button className="flex items-center justify-center rounded-lg border border-white/20 bg-white/10 py-2 transition-all hover:bg-white/15 hover:border-white/30 hover:scale-105">
                                        <span className="text-lg">🔴</span>
                                    </button>
                                    <button className="flex items-center justify-center rounded-lg border border-white/20 bg-white/10 py-2 transition-all hover:bg-white/15 hover:border-white/30 hover:scale-105">
                                        <span className="text-lg">⚫</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;