import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const Sidebar = ({ onSelect }) => {
    const [activeTab, setActiveTab] = useState("personal");
    const { t } = useTranslation();

    const settingsMenu = [
        { id: "personal", icon: "fa-user", label: t("setting.sidebar.personal") },
        { id: "interface", icon: "fa-palette", label: t("setting.sidebar.interface") },
        { id: "general", icon: "fa-cog", label: t("setting.sidebar.generalSettings") },
        { id: "security", icon: "fa-lock", label: t("setting.sidebar.security") },
        { id: "notifications", icon: "fa-bell", label: t("setting.sidebar.notifications") },
    ];

    const handleClick = (id) => {
        setActiveTab(id);
        onSelect?.(id);
    };

    return (
        <div className="setting-sidebar">
            <h2 className="setting-title">{t("setting.title")}</h2>
            <p className="setting-desc">
                {t("setting.description")}
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