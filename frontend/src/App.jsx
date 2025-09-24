import { Route, Routes } from "react-router-dom";
import "./index.css";
import Login from "./pages/Login";
import { useState } from "react";
import { useEffect } from "react";
import axios from "axios";

function App()
{
    const [currentTitle, setCurrentTitle] = useState("");
    useEffect(() => {
        document.title = currentTitle;
    }, [currentTitle]);
    return (
        <Routes>
            <Route path="/login" element={<Login setCurrentTitle={setCurrentTitle}  />}/>
        </Routes>
    )
}

export default App;