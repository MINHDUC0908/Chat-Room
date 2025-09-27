import { Route, Routes } from "react-router-dom";
import "./index.css";
import Login from "./pages/Login";
import { useState } from "react";
import { useEffect } from "react";
import DefaultLayout from "./layouts/DefaultLayout";
import ChatRoom from "./pages/ChatRoom";
import ProtectedRoute from "./utils/ProtectedRoute";
import { Toaster } from "react-hot-toast";

function App()
{
    const [currentTitle, setCurrentTitle] = useState("");
    useEffect(() => {
        document.title = currentTitle;
    }, [currentTitle]);
    return (
        <>
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
                        path="chat-room"
                        element={
                            <ProtectedRoute>
                                <ChatRoom />
                            </ProtectedRoute>
                        }
                    />
                </Route>
            </Routes>
            <Toaster position="top-right" reverseOrder={false} />
        </>
    )
}

export default App;