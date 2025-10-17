import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

function UserList({ fetchData, deleteItem, title, dataKey, addUrl, updateUrl }) {
    const [users, setUsers] = useState([]);
    const [selectedRole, setSelectedRole] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalUser, setModalUser] = useState(null);
    const [confirmEmail, setConfirmEmail] = useState("");

    const loadData = async (page = 1) => {
        setLoading(true);
        try {
            const data = await fetchData(page, selectedRole);
            setUsers(data[dataKey] || []);
            setCurrentPage(data.currentPage);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error(err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData(currentPage);
    }, [currentPage, selectedRole]);

    const handleDeleteClick = (user) => {
        setModalUser(user);
        setConfirmEmail("");
        setIsModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!modalUser) return;
        if (confirmEmail !== modalUser.email) {
            Swal.fire({
                icon: "error",
                title: "Email không đúng",
                text: "Email nhập không đúng, không thể xóa người dùng!",
            });
            return;
        }
        try {
            await deleteItem(modalUser._id);
            Swal.fire({
                icon: "success",
                title: "Xóa thành công",
                text: `Người dùng ${modalUser.username} đã được xóa!`,
            });
            setIsModalOpen(false);
            loadData(currentPage);
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Xóa thất bại",
                text: "Có lỗi xảy ra, không thể xóa người dùng!",
            });
        }
    };

    const renderPagination = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <li
                    key={i}
                    className={`admin-user-page-item ${i == currentPage ? "active" : ""}`}
                >
                    <button className="admin-user-page-link" onClick={() => setCurrentPage(i)}>
                        {i}
                    </button>
                </li>
            );
        }
        return (
            <ul className="admin-user-pagination">
                {currentPage > 1 && (
                    <li className="admin-user-page-item">
                        <button
                            className="admin-user-page-link"
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            &laquo;
                        </button>
                    </li>
                )}
                {pages}
                {currentPage < totalPages && (
                    <li className="admin-user-page-item">
                        <button
                            className="admin-user-page-link"
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
        <div className="admin-user-wrapper">
            <h1 className="admin-user-title">{title}</h1>
            <div className="admin-user-actions-wrapper">
                <a href={addUrl} className="admin-user-add-btn">
                    + Thêm người dùng
                </a>
                <select
                    className="form-select role-filter"
                    value={selectedRole}
                    onChange={(e) => {
                        setCurrentPage(1);
                        setSelectedRole(e.target.value);
                    }}
                >
                    <option value="">-- Chọn vai trò --</option>
                    <option value="user">Người dùng</option>
                    <option value="admin">Quản trị viên</option>
                </select>
            </div>
            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : (
                <div className="admin-user-table-container">
                    <table className="admin-user-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Vai trò</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? (
                                users.map((user, index) => {
                                    const createdAt = new Date(user.createdAt).toLocaleString(
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
                                        <tr key={user._id}>
                                            <td>{(currentPage - 1) * 6 + index + 1}</td>
                                            <td>{user.username}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span
                                                    className={`role-badge ${
                                                        user.role == "admin"
                                                            ? "role-admin"
                                                            : "role-user"
                                                    }`}
                                                >
                                                    {user.role == "admin" ? "Admin" : "User"}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className={`status-badge ${
                                                        user.active == "active"
                                                            ? "status-active"
                                                            : "status-locked"
                                                    }`}
                                                >
                                                    {user.active == "active" ? "Hoạt động" : "Khóa"}
                                                </span>
                                            </td>
                                            <td>{createdAt}</td>
                                            <td className="admin-user-actions">
                                                <a
                                                    href={`${updateUrl}/${user._id}`}
                                                    className="admin-user-btn-edit"
                                                >
                                                    Sửa
                                                </a>
                                                <button
                                                    className="admin-user-btn-delete"
                                                    onClick={() => handleDeleteClick(user)}
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7}>Không có người dùng nào!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {renderPagination()}
                </div>
            )}
            {isModalOpen && modalUser && (
                <div className="custom-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="custom-modal-header">
                            <h5>Xác nhận xóa người dùng</h5>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>
                                Vui lòng nhập email <strong>{modalUser.email}</strong> của người dùng <strong>({modalUser.username})</strong> để xác nhận xóa:
                            </p>
                            <input
                                type="email"
                                className="form-control"
                                placeholder="Nhập email của người dùng"
                                value={confirmEmail}
                                onChange={(e) => setConfirmEmail(e.target.value)}
                            />
                        </div>
                        <div
                            className="custom-modal-footer"
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        >
                            <button className="footer-btn" onClick={() => setIsModalOpen(false)}>
                                Hủy
                            </button>
                            <button className="footer-btn" onClick={handleConfirmDelete}>
                                Xóa người dùng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserList;