import { Outlet } from "react-router-dom";
import SideBar from "./Sidebar";

function DefaultLayout() {
    return (
        <div style={{ display: "flex", height: "100vh" }}>
            {/* Sidebar bên trái */}
            <div style={{
                width: "250px",
                borderRight: "1px solid #ddd",
                padding: "20px",
                boxSizing: "border-box"
            }}>
                <SideBar />
            </div>

            {/* Nội dung bên phải */}
            <div style={{ flex: 1, padding: "20px" }}>
                <Outlet />
            </div>
        </div>
    );
}

export default DefaultLayout;
