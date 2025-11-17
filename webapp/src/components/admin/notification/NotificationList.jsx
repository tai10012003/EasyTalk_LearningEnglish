import React, { useState, useEffect } from "react";
import AddNotification from "./AddNotification.jsx";
import Swal from "sweetalert2";

function NotificationList({ fetchData, deleteItem, title, dataKey }) {
    const [notifications, setNotifications] = useState([]);
    const [allNotifications, setAllNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 12;

    const loadNotifications = async (resetPage = false) => {
        setLoading(true);
        try {
            const data = await fetchData();
            const allData = data[dataKey] || [];
            setAllNotifications(allData);
            const targetPage = resetPage ? 1 : currentPage;
            if (resetPage) setCurrentPage(1);
            const total = Math.ceil(allData.length / itemsPerPage);
            setTotalPages(total);
            const start = (targetPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            setNotifications(allData.slice(start, end));
        } catch (err) {
            console.error("Error loading notifications:", err);
            setNotifications([]);
            setAllNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        loadNotifications(); 
    }, [currentPage]);

    useEffect(() => {
        if (allNotifications.length > 0) {
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            setNotifications(allNotifications.slice(start, end));
        }
    }, [currentPage, allNotifications]);

    const handleDelete = (id, notifTitle) => {
        Swal.fire({
            title: 'Bạn có chắc chắn?',
            text: `Bạn muốn xóa thông báo "${notifTitle}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteItem(id);
                    Swal.fire({
                        icon: 'success',
                        title: 'Đã xóa!',
                        text: 'Thông báo đã được xóa thành công.',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    loadNotifications();
                } catch (err) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi!',
                        text: 'Không thể xóa thông báo. Vui lòng thử lại.'
                    });
                }
            }
        });
    };

    const getTypeBadge = (type) => {
        const badges = {
            info: { color: '#17a2b8', label: 'Thông tin' },
            success: { color: '#28a745', label: 'Thành công' },
            champion: { color: '#b8860b', label: 'Vô địch' },
            achieve: { color: '#b81307ff', label: 'Thành tựu' },
            warning: { color: '#ffc107', label: 'Cảnh báo', textColor: '#000' },
            promo: { color: '#e83e8c', label: 'Khuyến mãi' },
            system: { color: '#6c757d', label: 'Hệ thống' },
            update: { color: '#007bff', label: 'Cập nhật' }
        };
        const badge = badges[type] || badges.info;
        return (
            <span style={{
                backgroundColor: badge.color,
                color: badge.textColor || '#fff',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
            }}>
                {badge.label}
            </span>
        );
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <li key={i} className={`admin-notification-page-item ${i == currentPage ? "active" : ""}`}>
                    <button className="admin-notification-page-link" onClick={() => setCurrentPage(i)}>
                        {i}
                    </button>
                </li>
            );
        }
        return (
            <ul className="admin-notification-pagination">
                {currentPage > 1 && (
                    <li className="admin-notification-page-item">
                        <button 
                            className="admin-notification-page-link" 
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            &laquo;
                        </button>
                    </li>
                )}
                {pages}
                {currentPage < totalPages && (
                    <li className="admin-notification-page-item">
                        <button 
                            className="admin-notification-page-link" 
                            onClick={() => setCurrentPage(currentPage + 1)}
                        >
                            &raquo;
                        </button>
                    </li>
                )}
            </ul>
        );
    };

    return (
        <div className="admin-notification-wrapper">
            <h1 className="admin-notification-title">{title}</h1>
            <div className="admin-notification-add">
                <a onClick={() => setIsAddModalOpen(true)} className="admin-notification-add-btn">
                    + Thêm thông báo
                </a>
            </div>
            
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Đang tải dữ liệu...</p>
                </div>
            ) : (
                <div className="admin-notification-table-container">
                    <table className="admin-notification-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Tiêu đề</th>
                                <th>Nội dung</th>
                                <th>Loại</th>
                                <th>Người nhận</th>
                                <th>Link</th>
                                <th>Ngày tạo</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notifications.length > 0 ? (
                                notifications.map((notification, index) => {
                                    const createdAt = new Date(notification.createdAt).toLocaleString(
                                        "vi-VN",
                                        {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        }
                                    );
                                    return (
                                        <tr key={notification._id}>
                                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td>
                                                <strong>{notification.title}</strong>
                                            </td>
                                            <td style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                                                {notification.message}
                                            </td>
                                            <td>{getTypeBadge(notification.type)}</td>
                                            <td>
                                                {notification.userInfo 
                                                    ? (
                                                        <span>
                                                            👤 {notification.userInfo.username || notification.userInfo.email}
                                                        </span>
                                                    )
                                                    : <span style={{ color: '#28a745', fontWeight: '500' }}>🌐 Tất cả</span>
                                                }
                                            </td>
                                            <td>
                                                {notification.link ? (
                                                    <a 
                                                        href={notification.link} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        style={{ color: '#007bff', textDecoration: 'underline' }}
                                                    >
                                                        Xem link
                                                    </a>
                                                ) : (
                                                    <span style={{ color: '#999' }}>-</span>
                                                )}
                                            </td>
                                            <td>{createdAt}</td>
                                            <td className="admin-notification-actions">
                                                <button
                                                    className="admin-notification-btn-delete"
                                                    onClick={() => handleDelete(notification._id, notification.title)}
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                        Không có thông báo nào!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {renderPagination()}
                </div>
            )}
            <AddNotification
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onCreated={() => {
                    setCurrentPage(1);
                    loadNotifications();
                }}
            />
        </div>
    );
}

export default NotificationList;