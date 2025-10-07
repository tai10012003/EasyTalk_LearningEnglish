import React, { useState, useEffect } from "react";

function UserList({ fetchData, deleteItem, title, dataKey, addUrl, updateUrl }) {
    const [users, setUsers] = useState([]);
    const [selectedRole, setSelectedRole] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

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

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có muốn xóa người dùng này không?")) {
            try {
                await deleteItem(id);
                loadData(currentPage);
            } catch (err) {
                alert("Xóa thất bại!");
            }
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
                                                    onClick={() => handleDelete(user._id)}
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
        </div>
    );
}

export default UserList;