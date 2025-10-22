import React from "react";
import NotificationList from "@/components/admin/notification/NotificationList.jsx";
import { NotificationService } from "@/services/NotificationService.jsx";

function Notification() {
    const fetchNotification = async (page = 1) => {
        const res = await NotificationService.fetchAllNotifications();
        return {
            notifications: res,
            currentPage: 1,
            totalPages: 1,
        };
    };

    const deleteNotification = async (id) => {
        return await NotificationService.deleteNotification(id);
    };

    return (
        <div className="admin-notification-page">
            <NotificationList
                fetchData={fetchNotification}
                deleteItem={deleteNotification}
                title="DANH SÁCH THÔNG BÁO"
                dataKey="notifications"
            />
        </div>
    );
}

export default Notification;