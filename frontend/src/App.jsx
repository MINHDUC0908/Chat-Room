import { Route, Routes } from "react-router-dom";
import "./index.css";
import Login from "./pages/Login";
import { useState } from "react";
import { useEffect } from "react";
import DefaultLayout from "./layouts/DefaultLayout";
import ChatRoom from "./pages/ChatRoom";
import ProtectedRoute from "./utils/ProtectedRoute";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import GroupRoom from "./pages/GroupRoom";

function App()
{
    const [currentTitle, setCurrentTitle] = useState("");
    useEffect(() => {
        document.title = currentTitle;
    }, [currentTitle]);
    return (
        <>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login setCurrentTitle={setCurrentTitle} />} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <DefaultLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route
                            path="chat-room/:id"
                            element={
                                <ProtectedRoute>
                                    <ChatRoom setCurrentTitle={setCurrentTitle} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="group-room/:id"
                            element={
                                <ProtectedRoute>
                                    <GroupRoom setCurrentTitle={setCurrentTitle} />
                                </ProtectedRoute>
                            }
                        />
                    </Route>
                </Routes>
            </AuthProvider>
            <Toaster position="top-right" reverseOrder={false} />
        </>
    )
}

export default App;