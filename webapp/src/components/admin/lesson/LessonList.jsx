import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

function LessonList({ fetchData, deleteItem, title, dataKey, addUrl, updateUrl }) {
    const [lessons, setLessons] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const loadData = async (page = 1) => {
        setLoading(true);
        try {
            const data = await fetchData(page);
            setLessons(data[dataKey] || []);
            setCurrentPage(data.currentPage);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error(err);
            setLessons([]);
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
            text: `Bạn có muốn xóa bài học "${title}" không?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Hủy',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteItem(id);
                    Swal.fire('Thành công!', `Xóa bài học "${title}" thành công!`, 'success');
                    loadData(currentPage);
                } catch (err) {
                    Swal.fire('Thất bại!', `Xóa bài học "${title}" thất bại!`, 'error');
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
                    className={`admin-lesson-page-item ${i == currentPage ? "active" : ""}`}
                >
                    <button
                        className="admin-lesson-page-link"
                        onClick={() => setCurrentPage(i)}
                    >
                        {i}
                    </button>
                </li>
            );
        }
        return (
            <ul className="admin-lesson-pagination">
                {currentPage > 1 && (
                    <li className="admin-lesson-page-item">
                        <button
                            className="admin-lesson-page-link"
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            &laquo;
                        </button>
                    </li>
                )}
                {pages}
                {currentPage < totalPages && (
                    <li className="admin-lesson-page-item">
                        <button
                            className="admin-lesson-page-link"
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
        <div className="admin-lesson-wrapper">
            <h1 className="admin-lesson-title">{title}</h1>
            <div className="admin-lesson-add">
                <a href={addUrl} className="admin-lesson-add-btn">
                    + Thêm bài học
                </a>
            </div>
            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : (
                <div className="admin-lesson-table-container">
                    <table className="admin-lesson-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Hình ảnh</th>
                                <th>Tiêu đề</th>
                                <th>Mô tả</th>
                                <th>Ngày tạo</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lessons.length > 0 ? (
                                lessons.map((lesson, index) => {
                                    const createdAt = new Date(lesson.createdAt).toLocaleString(
                                        "vi-VN",
                                        { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
                                    );
                                    return (
                                        <tr key={lesson._id}>
                                            <td>{(currentPage - 1) * 6 + index + 1}</td>
                                            <td>
                                                {lesson.images ? (
                                                    <img
                                                        src={lesson.images}
                                                        alt={lesson.title}
                                                        className="admin-lesson-image"
                                                    />
                                                ) : (
                                                    "Không có hình ảnh"
                                                )}
                                            </td>
                                            <td>{lesson.title}</td>
                                            <td>{lesson.description.length > 80 ? `${lesson.description.slice(0,80)} ...` : lesson.description}</td>
                                            <td>{createdAt}</td>
                                            <td className="admin-lesson-actions">
                                                <a
                                                    href={`${updateUrl}/${lesson._id}`}
                                                    className="admin-lesson-btn-edit"
                                                >
                                                    Sửa
                                                </a>
                                                <button
                                                    className="admin-lesson-btn-delete"
                                                    onClick={() => handleDelete(lesson._id, lesson.title)}
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6}>Không có bài học.</td>
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

export default LessonList;