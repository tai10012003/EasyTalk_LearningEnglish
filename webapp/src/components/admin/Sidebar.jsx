import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/images/logo.png";

function Sidebar({ isCollapsed, setIsCollapsed }) {
    const [openMenu, setOpenMenu] = useState(null);
    const location = useLocation();

    const toggleMenu = (menu) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    useEffect(() => {
        const path = location.pathname;
        if (/^\/admin\/(journey|gate|stage)(\/|$)/.test(path)) {
            setOpenMenu("journey");
        } else if (/^\/admin\/(grammar|pronunciation|story)(\/|$)/.test(path)) {
            setOpenMenu("lesson");
        } else if (/^\/admin\/(grammar|pronunciation|vocabulary|dictation)-exercise(\/|$)/.test(path)) {
            setOpenMenu("exercise");
        } else {
            setOpenMenu(null);
        }
    }, [location.pathname]);

    const isParentActive = (regex) => regex.test(location.pathname);

    const isSubActive = (basePath) => {
        const path = location.pathname;
        const rest = path.slice(basePath.length);
        const hasAction = /^($|\/(add|create|edit|update|delete|view|\d+))/.test(rest);
        return path.startsWith(basePath) && hasAction;
    };

    const isSingleMenuActive = (basePath) => {
        const path = location.pathname;
        const rest = path.slice(basePath.length);
        const hasAction = /^($|\/(add|create|edit|update|delete|view|\d+))/.test(rest);
        return path.startsWith(basePath) && hasAction;
    };

    return (
        <div className="admin-sidebar" data-background-color="dark">
            <div className="admin-sidebar-logo">
                <div className="admin-logo-header" data-background-color="dark">
                    {!isCollapsed ? (
                        <>
                            <Link to="/admin/dashboard" className="admin-logo">
                                <img
                                    src={logo}
                                    alt="navbar brand"
                                    className="admin-navbar-brand"
                                    height="65"
                                />
                            </Link>
                            <span className="admin-title">Dashboard</span>
                            <div className="admin-nav-toggle">
                                <button
                                    className="admin-btn-toggle admin-toggle-sidebar"
                                    onClick={toggleSidebar}
                                    title="Thu gọn"
                                >
                                    <i className="fas fa-bars"></i>
                                </button>
                            </div>
                        </>
                    ) : (
                        <button
                            className="admin-btn-toggle admin-toggle-sidebar"
                            onClick={toggleSidebar}
                            title="Mở rộng"
                            style={{ margin: "0 auto" }}
                        >
                            <i className="fas fa-bars"></i>
                        </button>
                    )}
                </div>
            </div>
            <div className="admin-sidebar-wrapper">
                <div className="admin-sidebar-content">
                    <ul className="admin-nav admin-nav-secondary">
                        <li className={`admin-nav-item ${location.pathname === "/admin/dashboard" ? "active" : ""}`}>
                            <Link to="/admin/dashboard">
                                <i className="fas fa-home"></i>
                                <p>Trang chủ</p>
                            </Link>
                        </li>
                        <li className="admin-nav-section">
                            <span className="admin-sidebar-mini-icon">
                                <i className="fa fa-ellipsis-h"></i>
                            </span>
                            <h4 className="admin-text-section">Chức năng</h4>
                        </li>
                        <li
                            className={`admin-nav-item ${
                                openMenu === "journey" ? "open" : ""
                            } ${
                                isParentActive(/^\/admin\/(journey|gate|stage)(\/|$)/)
                                    ? "active"
                                    : ""
                            }`}
                        >
                            <button className="admin-nav-link" onClick={() => toggleMenu("journey")}>
                                <i className="fas fa-road"></i>
                                <p>Quản lý hành trình học</p>
                                <span className="admin-caret"></span>
                            </button>
                            {openMenu === "journey" && (
                                <ul className="admin-nav-collapse">
                                    <li className={isSubActive("/admin/journey") ? "active" : ""}>
                                        <Link to="/admin/journey">
                                            <span className="admin-sub-item">Hành Trình</span>
                                        </Link>
                                    </li>
                                    <li className={isSubActive("/admin/gate") ? "active" : ""}>
                                        <Link to="/admin/gate">
                                            <span className="admin-sub-item">Cổng</span>
                                        </Link>
                                    </li>
                                    <li className={isSubActive("/admin/stage") ? "active" : ""}>
                                        <Link to="/admin/stage">
                                            <span className="admin-sub-item">Chặng Đường</span>
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>
                        <li
                            className={`admin-nav-item ${
                                openMenu === "lesson" ? "open" : ""
                            } ${
                                isParentActive(/^\/admin\/(grammar|pronunciation|story)(\/|$)/)
                                    ? "active"
                                    : ""
                            }`}
                        >
                            <button className="admin-nav-link" onClick={() => toggleMenu("lesson")}>
                                <i className="fas fa-layer-group"></i>
                                <p>Quản lý bài học</p>
                                <span className="admin-caret"></span>
                            </button>
                            {openMenu === "lesson" && (
                                <ul className="admin-nav-collapse">
                                    <li className={isSubActive("/admin/grammar") ? "active" : ""}>
                                        <Link to="/admin/grammar">
                                            <span className="admin-sub-item">Ngữ Pháp</span>
                                        </Link>
                                    </li>
                                    <li className={isSubActive("/admin/pronunciation") ? "active" : ""}>
                                        <Link to="/admin/pronunciation">
                                            <span className="admin-sub-item">Phát Âm</span>
                                        </Link>
                                    </li>
                                    <li className={isSubActive("/admin/story") ? "active" : ""}>
                                        <Link to="/admin/story">
                                            <span className="admin-sub-item">Câu Chuyện</span>
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>
                        <li
                            className={`admin-nav-item ${
                                openMenu === "exercise" ? "open" : ""
                            } ${
                                isParentActive(/^\/admin\/(grammar|pronunciation|vocabulary|dictation)-exercise(\/|$)/)
                                    ? "active"
                                    : ""
                            }`}
                        >
                            <button className="admin-nav-link" onClick={() => toggleMenu("exercise")}>
                                <i className="fas fa-th-list"></i>
                                <p>Quản lý bài luyện tập</p>
                                <span className="admin-caret"></span>
                            </button>
                            {openMenu === "exercise" && (
                                <ul className="admin-nav-collapse">
                                    <li className={isSubActive("/admin/grammar-exercise") ? "active" : ""}>
                                        <Link to="/admin/grammar-exercise">
                                            <span className="admin-sub-item">Ngữ Pháp</span>
                                        </Link>
                                    </li>
                                    <li className={isSubActive("/admin/pronunciation-exercise") ? "active" : ""}>
                                        <Link to="/admin/pronunciation-exercise">
                                            <span className="admin-sub-item">Phát Âm</span>
                                        </Link>
                                    </li>
                                    <li className={isSubActive("/admin/vocabulary-exercise") ? "active" : ""}>
                                        <Link to="/admin/vocabulary-exercise">
                                            <span className="admin-sub-item">Từ Vựng</span>
                                        </Link>
                                    </li>
                                    <li className={isSubActive("/admin/dictation-exercise") ? "active" : ""}>
                                        <Link to="/admin/dictation-exercise">
                                            <span className="admin-sub-item">Nghe Chép Chính Tả</span>
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>
                        <li className={`admin-nav-item ${isSingleMenuActive("/admin/user") ? "active" : ""}`}>
                            <Link to="/admin/user">
                                <i className="fas fa-user"></i>
                                <p>Quản lý người dùng</p>
                            </Link>
                        </li>
                        <li className={`admin-nav-item ${isSingleMenuActive("/admin/notification") ? "active" : ""}`}>
                            <Link to="/admin/notification">
                                <i className="fas fa-bell"></i>
                                <p>Quản lý thông báo</p>
                            </Link>
                        </li>
                        <li className={`admin-nav-item ${isSingleMenuActive("/admin/prize") ? "active" : ""}`}>
                            <Link to="/admin/prize">
                                <i className="fas fa-trophy"></i>
                                <p>Quản lý giải thưởng</p>
                            </Link>
                        </li>
                        <li className={`admin-nav-item ${isSingleMenuActive("/admin/userprogress") ? "active" : ""}`}>
                            <Link to="/admin/userprogress">
                                <i className="fas fa-user"></i>
                                <p>Theo dõi tiến trình học tập</p>
                            </Link>
                        </li>
                        <li className={`admin-nav-item ${isSingleMenuActive("/admin/chart") ? "active" : ""}`}>
                            <Link to="/admin/chart">
                                <i className="far fa-chart-bar"></i>
                                <p>Thống kê</p>
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Sidebar;