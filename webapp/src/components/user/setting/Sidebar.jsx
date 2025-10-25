import React, { useState } from "react";

const Sidebar = ({ onSelect }) => {
    const [activeTab, setActiveTab] = useState("personal");

    const settingsMenu = [
        { id: "personal", icon: "fa-user", label: "Thông tin cá nhân" },
        { id: "interface", icon: "fa-palette", label: "Cấu hình giao diện" },
        { id: "general", icon: "fa-cog", label: "Cài đặt chung" },
        { id: "security", icon: "fa-lock", label: "Bảo mật & đăng nhập" },
        { id: "notifications", icon: "fa-bell", label: "Thông báo & nhắc học" },
    ];

    const handleClick = (id) => {
        setActiveTab(id);
        onSelect?.(id);
    };

    return (
        <div className="setting-sidebar">
            <h2 className="setting-title">Cài đặt tài khoản</h2>
            <p className="setting-desc">
                Quản lý cài đặt tài khoản, giao diện và thông báo học tập của bạn.
            </p>
            <ul className="setting-menu">
                {settingsMenu.map((item) => (
                    <li key={item.id}>
                        <button
                            className={`setting-menu-item ${
                                activeTab == item.id ? "active" : ""
                            }`}
                            onClick={() => handleClick(item.id)}
                        >
                            <i className={`fas ${item.icon}`}></i>
                            <span>{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;