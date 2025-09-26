import { LockClosedIcon } from "@heroicons/react/20/solid";
import { useEffect } from "react";
import axios from "axios";
import { useState } from "react";
import useAuth from "../hooks/useAuth";

function Login({ setCurrentTitle }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth();
    
    useEffect(() => {
        setCurrentTitle("Đăng nhập");
    }, [setCurrentTitle]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white/80 p-8 shadow-2xl backdrop-blur-md">
                {/* Logo + Title */}
                <div className="text-center">
                    <img
                        className="mx-auto h-14 w-auto drop-shadow-md"
                        src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
                        alt="Logo"
                    />
                    <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-gray-900">
                        Chào mừng trở lại 👋
                    </h2>
                    <p className="mt-2 text-sm text-gray-700">
                        Đăng nhập để tiếp tục hoặc{" "}
                        <a
                            href="/register"
                            className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                            tạo tài khoản mới
                        </a>
                    </p>
                </div>

                {/* Form */}
                <form className="mt-8 space-y-6">
                    <div className="space-y-4">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="sr-only">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                                placeholder="Nhập email của bạn"
                            />
                        </div>
                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Mật khẩu
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                                className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                                placeholder="Nhập mật khẩu"
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
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label
                                htmlFor="remember-me"
                                className="ml-2 text-sm text-gray-800"
                            >
                                Ghi nhớ đăng nhập
                            </label>
                        </div>

                        <div className="text-sm">
                            <a
                                href="#"
                                className="font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                                Quên mật khẩu?
                            </a>
                        </div>
                    </div>

                    {/* Button login */}
                    <div>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                login(email, password);
                            }}
                            type="submit"
                            className="group relative flex w-full items-center justify-center rounded-lg bg-indigo-600 py-3 px-4 text-sm font-semibold text-white shadow-md transition-transform hover:scale-[1.02] hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <LockClosedIcon
                                    className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200"
                                    aria-hidden="true"
                                />
                            </span>
                            Đăng nhập
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;
