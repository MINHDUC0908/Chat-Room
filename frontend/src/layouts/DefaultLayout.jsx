import { Outlet } from "react-router-dom";
import SideBar from "./Sidebar";

function DefaultLayout() {
    return (
        <div className="flex h-screen">
            {/* Sidebar chiếm 1/6 */}
            <div className="w-/12">
                <SideBar />
            </div>

            {/* Nội dung chiếm 5/6 */}
            <div className="w-9/12 bg-white">
                <Outlet />
            </div>
        </div>
    );
}

export default DefaultLayout;
