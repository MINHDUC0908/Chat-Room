import { FiX, FiSearch, FiCamera } from "react-icons/fi";
import useUser from "../hooks/useUser";
import { useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";

const socket = io("http://10.45.118.243:3000/");

function Group({ setGroup }) {
    const { usersGr } = useUser();
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [groupName, setGroupName] = useState("");
    const [search, setSearch] = useState("");
    const { user } = useAuth();

    const handleToggleUser = (id) => {
        setSelectedUsers((prev) =>
            prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
        );
    };

    const handleCreateGroup = () => {
        if (!groupName.trim()) return alert("Vui lòng nhập tên nhóm");
        if (selectedUsers.length === 0) return alert("Chọn ít nhất 1 thành viên");
        socket.emit("create_group", {
            name: groupName,
            members: selectedUsers,
            creatorId: user?.id,
        });

        setGroup(false);
    };

    const filteredUsers = usersGr.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[80vh] flex flex-col animate-fadeIn relative">
                <button
                    onClick={() => setGroup(false)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                >
                    <FiX size={22} />
                </button>
                <div className="px-6 py-4 border-b font-bold text-lg">
                    Tạo nhóm
                </div>
                <div className="flex flex-1 overflow-hidden">
                    {/* Left */}
                    <div className="w-1/2 border-r flex flex-col">
                        <div className="flex items-center gap-3 px-4 py-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300">
                                <FiCamera className="text-gray-600" />
                            </div>
                            <input
                                type="text"
                                placeholder="Nhập tên nhóm..."
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="flex-1 border-b outline-none px-2 py-1 text-sm"
                            />
                        </div>
                        <div className="px-4 pb-2">
                            <div className="flex items-center bg-gray-100 rounded-lg px-2 py-1">
                                <FiSearch className="text-gray-500 mr-2" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="flex-1 bg-transparent outline-none text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 pb-4">
                            {filteredUsers.map((user) => (
                                <label
                                    key={user.id}
                                    className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={() => handleToggleUser(user.id)}
                                        className="w-4 h-4"
                                    />
                                    <img
                                        src={`https://i.pravatar.cc/50?u=${user.id}`}
                                        alt={user.name}
                                        className="w-9 h-9 rounded-full object-cover"
                                    />
                                    <span className="text-sm">{user.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Right */}
                    <div className="w-1/2 flex flex-col">
                        <div className="p-4 font-semibold text-sm text-gray-700 border-b">
                            Đã chọn ({selectedUsers.length}/100)
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {selectedUsers.map((id) => {
                                const user = usersGr.find((u) => u.id === id);
                                if (!user) return null;
                                return (
                                    <div
                                        key={id}
                                        className="flex items-center justify-between border rounded-lg px-3 py-2"
                                    >
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={`https://i.pravatar.cc/50?u=${user.id}`}
                                                alt={user.name}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                            <span className="text-sm">{user.name}</span>
                                        </div>
                                        <button
                                            onClick={() =>
                                                setSelectedUsers((prev) =>
                                                    prev.filter((uid) => uid !== id)
                                                )
                                            }
                                            className="text-gray-500 hover:text-red-500"
                                        >
                                            <FiX size={18} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-3 border-t">
                    <button
                        onClick={() => setGroup(false)}
                        className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleCreateGroup}
                        className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                    >
                        Tạo nhóm
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Group;
