import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

function UserProgressList({ fetchData, deleteItem, title, dataKey, detailUrl }) {
    const [userProgresses, setUserProgresses] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const loadData = async (page = 1) => {
        setLoading(true);
        try {
            const data = await fetchData(page);
            setUserProgresses(data[dataKey] || []);
            setCurrentPage(data.currentPage);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error(err);
            setUserProgresses([]);
            Swal.fire("Thất bại!", "Tải dữ liệu thất bại!", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData(currentPage);
    }, [currentPage]);

    const handleDelete = async (id, username) => {
        Swal.fire({
            title: "Xác nhận xóa",
            text: `Bạn có muốn xóa tiến trình của người dùng "${username}" không?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xác nhận",
            cancelButtonText: "Hủy",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteItem(id);
                    Swal.fire("Thành công!", `Đã xóa tiến trình của "${username}"!`, "success");
                    loadData(currentPage);
                } catch (err) {
                    Swal.fire("Thất bại!", `Không thể xóa tiến trình của "${username}".`, "error");
                }
            }
        });
    };

    const renderPagination = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <li
                    key={i}
                    className={`admin-userprogress-page-item ${
                        i === currentPage ? "active" : ""
                    }`}
                >
                    <button
                        className="admin-userprogress-page-link"
                        onClick={() => setCurrentPage(i)}
                    >
                        {i}
                    </button>
                </li>
            );
        }
        return (
            <ul className="admin-userprogress-pagination">
                {currentPage > 1 && (
                    <li className="admin-userprogress-page-item">
                        <button
                            className="admin-userprogress-page-link"
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            &laquo;
                        </button>
                    </li>
                )}
                {pages}
                {currentPage < totalPages && (
                    <li className="admin-userprogress-page-item">
                        <button
                            className="admin-userprogress-page-link"
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
        <div className="admin-userprogress-wrapper">
            <h1 className="admin-userprogress-title">{title}</h1>
            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : (
                <div className="admin-userprogress-table-container">
                    <table className="admin-userprogress-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Tên người dùng</th>
                                <th>Streak hiện tại</th>
                                <th>Kỷ lục streak</th>
                                <th>Điểm kinh nghiệm</th>
                                <th>Ngày tạo</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userProgresses.length > 0 ? (
                                userProgresses.map((progress, index) => {
                                    const createdAt = new Date(parseInt(progress._id.substring(0, 8), 16) * 1000)
                                    .toLocaleString("vi-VN", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    });
                                    const username = progress.userDetails.username || "Không xác định";
                                    return (
                                        <tr key={progress._id}>
                                            <td>{(currentPage - 1) * 12 + index + 1}</td>
                                            <td>{username}</td>
                                            <td>{progress.streak || 0}</td>
                                            <td>{progress.maxStreak || 0}</td>
                                            <td>{progress.experiencePoints || 0}</td>
                                            <td>{createdAt}</td>
                                            <td className="admin-userprogress-actions">
                                                <a
                                                    href={`${detailUrl}/${progress._id}`}
                                                    className="admin-userprogress-btn-edit"
                                                >
                                                    Xem chi tiết
                                                </a>
                                                <button
                                                    className="admin-userprogress-btn-delete"
                                                    onClick={() =>
                                                        handleDelete(progress._id, username)
                                                    }
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7}>Không có dữ liệu tiến trình người dùng.</td>
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

export default UserProgressList;