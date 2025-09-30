import React, { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Navbar from "@/components/admin/Navbar";
import Footer from "@/components/admin/Footer";
import { Outlet } from "react-router-dom";

function AdminLayout() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className={`admin-wrapper ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <div className="admin-main-panel">
                <Navbar />
                <div className="admin-content">
                    <Outlet />
                </div>
                <Footer />
            </div>
        </div>
    );
}

export default AdminLayout;