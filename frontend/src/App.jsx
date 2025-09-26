import { Route, Routes } from "react-router-dom";
import "./index.css";
import Login from "./pages/Login";
import { useState } from "react";
import { useEffect } from "react";
import DefaultLayout from "./layouts/DefaultLayout";
import ChatRoom from "./pages/ChatRoom";

function App()
{
    const [currentTitle, setCurrentTitle] = useState("");
    useEffect(() => {
        document.title = currentTitle;
    }, [currentTitle]);
    return (
        <Routes>
            <Route path="/login" element={<Login setCurrentTitle={setCurrentTitle}  />}/>
            <Route path="/" element={<DefaultLayout />}>
                <Route path="/chat-room" element={<ChatRoom/>} />
            </Route>
        </Routes>
    )
}

export default App;