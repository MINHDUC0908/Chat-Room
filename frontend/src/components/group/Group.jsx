import { FiX, FiSearch, FiCamera } from "react-icons/fi";
import { useState } from "react";
import { io } from "socket.io-client";

import useUser from "../../hooks/useUser";
import { useAuth } from "../../contexts/AuthContext";

const socket = io("http://172.30.251.243:3000/");

function Group({ setGroup }) {
    const { usersGr } = useUser();
    const { user } = useAuth();

    const [selectedUsers, setSelectedUsers] = useState([]);
    const [groupName, setGroupName] = useState("");
    const [search, setSearch] = useState("");

    const handleToggleUser = (id) => {
        setSelectedUsers((prev) =>
            prev.includes(id)
                ? prev.filter((uid) => uid !== id)
                : [...prev, id]
        );
    };
    const handleCreateGroup = () => {
        if (!groupName.trim()) {
            ("Vui lòng nhập tên nhóm");
            return;
        }
        if (selectedUsers.length === 0) {
            alert("Chọn ít nhất 1 thành viên");
            return;
        }
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col animate-fadeIn">
                <button
                    onClick={() => setGroup(false)}
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 transition"
                >
                    <FiX size={24} />
                </button>

                <div className="px-6 py-4 border-b font-semibold text-lg text-gray-800">
                    Tạo nhóm mới
                </div>

                <div className="flex flex-1 overflow-hidden divide-x">
                    <div className="w-1/2 flex flex-col">
                        <div className="flex items-center gap-3 px-4 py-3 border-b">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300">
                                <FiCamera className="text-gray-600" />
                            </div>

                            <input
                                type="text"
                                placeholder="Nhập tên nhóm..."
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="flex-1 border-b border-gray-300 focus:border-blue-500 outline-none px-2 py-1 text-sm"
                            />
                        </div>

                        <div className="px-4 py-2">
                            <div className="flex items-center bg-gray-100 rounded-lg px-2 py-1">
                                <FiSearch className="text-gray-500 mr-2" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm thành viên..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="flex-1 bg-transparent outline-none text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 pb-4">
                            {filteredUsers.length === 0 ? (
                                <div className="text-sm text-gray-500 py-4 text-center">
                                    Không tìm thấy người dùng
                                </div>
                            ) : (
                                filteredUsers.map((u) => (
                                    <label
                                        key={u.id}
                                        className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50 transition"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(u.id)}
                                            onChange={() => handleToggleUser(u.id)}
                                            className="w-4 h-4 accent-blue-500"
                                        />

                                        <img
                                            src={`https://i.pravatar.cc/50?u=${u.id}`}
                                            alt={u.name}
                                            className="w-9 h-9 rounded-full object-cover"
                                        />

                                        <span className="text-sm text-gray-800">
                                            {u.name}
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                    <div className="w-1/2 flex flex-col">
                        <div className="p-4 border-b text-sm font-semibold text-gray-700">
                            Thành viên đã chọn ({selectedUsers.length}/100)
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {selectedUsers.length === 0 ? (
                                <div className="text-sm text-gray-500 text-center py-4">
                                    Chưa chọn thành viên nào
                                </div>
                            ) : (
                                selectedUsers.map((id) => {
                                    const userItem = usersGr.find(
                                        (u) => u.id === id
                                    );

                                    if (!userItem) return null;

                                    return (
                                        <div
                                            key={id}
                                            className="flex items-center justify-between border rounded-lg px-3 py-2 bg-gray-50 hover:bg-gray-100 transition"
                                        >
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={`https://i.pravatar.cc/50?u=${userItem.id}`}
                                                    alt={userItem.name}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                                <span className="text-sm">
                                                    {userItem.name}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() =>
                                                    setSelectedUsers((prev) =>
                                                        prev.filter(
                                                            (uid) => uid !== id
                                                        )
                                                    )
                                                }
                                                className="text-gray-400 hover:text-red-500 transition"
                                            >
                                                <FiX size={18} />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-3 border-t bg-gray-50">
                    <button
                        onClick={() => setGroup(false)}
                        className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                    >
                        Hủy
                    </button>

                    <button
                        onClick={handleCreateGroup}
                        className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
                    >
                        Tạo nhóm
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Group;
