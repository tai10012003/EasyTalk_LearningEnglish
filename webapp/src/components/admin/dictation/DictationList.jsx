import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

function DictationList({ fetchData, deleteItem, title, dataKey, addUrl, updateUrl }) {
    const [dictations, setDictations] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const loadData = async (page = 1) => {
        setLoading(true);
        try {
            const data = await fetchData(page);
            setDictations(data[dataKey] || []);
            setCurrentPage(data.currentPage);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error(err);
            setDictations([]);
            Swal.fire('Thất bại!', 'Tải dữ liệu thất bại!', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData(currentPage);
    }, [currentPage]);

    const handleDelete = async (id, title) => {
        Swal.fire({
            title: 'Bạn có chắc?',
            text: `Bạn có muốn xóa luyện tập "${title}" không?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Hủy',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteItem(id);
                    Swal.fire('Thành công!', `Xóa luyện tập "${title}" thành công!`, 'success');
                    loadData(currentPage);
                } catch (err) {
                    Swal.fire('Thất bại!', `Xóa luyện tập "${title}" thất bại!`, 'error');
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
                    className={`admin-exercise-page-item ${i == currentPage ? "active" : ""}`}
                >
                    <button
                        className="admin-exercise-page-link"
                        onClick={() => setCurrentPage(i)}
                    >
                        {i}
                    </button>
                </li>
            );
        }
        return (
            <ul className="admin-exercise-pagination">
                {currentPage > 1 && (
                    <li className="admin-exercise-page-item">
                        <button
                            className="admin-exercise-page-link"
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            &laquo;
                        </button>
                    </li>
                )}
                {pages}
                {currentPage < totalPages && (
                    <li className="admin-exercise-page-item">
                        <button
                            className="admin-exercise-page-link"
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
        <div className="admin-exercise-wrapper">
            <h1 className="admin-exercise-title">{title}</h1>
            <div className="admin-exercise-add">
                <a href={addUrl} className="admin-exercise-add-btn">
                    + Thêm luyện tập
                </a>
            </div>
            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : (
                <div className="admin-exercise-table-container">
                    <table className="admin-exercise-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Tiêu đề</th>
                                <th>Mô tả</th>
                                <th>Nội dung</th>
                                <th>Ngày tạo</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dictations.length > 0 ? (
                                dictations.map((dictation, index) => {
                                    const createdAt = new Date(dictation.createdAt).toLocaleString(
                                        "vi-VN",
                                        { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
                                    );
                                    return (
                                        <tr key={dictation._id}>
                                            <td>{(currentPage - 1) * 6 + index + 1}</td>
                                            <td>{dictation.title}</td>
                                            <td>{dictation.description?.length > 50 ? `${dictation.description.slice(0,50)} ...` : dictation.description}</td>
                                            <td>{dictation.content.length > 80 ? `${dictation.content.slice(0,80)} ...` : dictation.content}</td>
                                            <td>{createdAt}</td>
                                            <td className="admin-exercise-actions">
                                                <a
                                                    href={`${updateUrl}/${dictation._id}`}
                                                    className="admin-exercise-btn-edit"
                                                >
                                                    Sửa
                                                </a>
                                                <button
                                                    className="admin-exercise-btn-delete"
                                                    onClick={() => handleDelete(dictation._id, dictation.title)}
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6}>Không có bài luyện tập.</td>
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

export default DictationList;