import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

function StoryList({ fetchData, deleteItem, title, dataKey, addUrl, updateUrl }) {
    const [stories, setStories] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const loadData = async (page = 1) => {
        setLoading(true);
        try {
            const data = await fetchData(page);
            setStories(data[dataKey] || []);
            setCurrentPage(data.currentPage);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error(err);
            setStories([]);
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
            text: `Bạn có muốn xóa câu chuyện "${title}" không?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Hủy',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteItem(id);
                    Swal.fire('Thành công!', `Xóa câu chuyện "${title}" thành công!`, 'success');
                    loadData(currentPage);
                } catch (err) {
                    Swal.fire('Thất bại!', `Xóa câu chuyện "${title}" thất bại!`, 'error');
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
                    className={`admin-story-page-item ${i == currentPage ? "active" : ""}`}
                >
                    <button
                        className="admin-story-page-link"
                        onClick={() => setCurrentPage(i)}
                    >
                        {i}
                    </button>
                </li>
            );
        }
        return (
            <ul className="admin-story-pagination">
                {currentPage > 1 && (
                    <li className="admin-story-page-item">
                        <button
                            className="admin-story-page-link"
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            &laquo;
                        </button>
                    </li>
                )}
                {pages}
                {currentPage < totalPages && (
                    <li className="admin-story-page-item">
                        <button
                            className="admin-story-page-link"
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
        <div className="admin-story-wrapper">
            <h1 className="admin-story-title">{title}</h1>
            <div className="admin-story-add">
                <a href={addUrl} className="admin-story-add-btn">
                    + Thêm câu chuyện
                </a>
            </div>
            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : (
                <div className="admin-story-table-container">
                    <table className="admin-story-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Hình ảnh</th>
                                <th>Tiêu đề</th>
                                <th>Mô tả</th>
                                <th>Cấp độ</th>
                                <th>Loại câu chuyện</th>
                                <th>Số câu</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stories.length > 0 ? (
                                stories.map((story, index) => (
                                    <tr key={story._id}>
                                        <td>{(currentPage - 1) * 12 + index + 1}</td>
                                        <td>
                                            {story.image ? (
                                                <img
                                                    src={story.image}
                                                    alt={story.title}
                                                    className="admin-story-image"
                                                />
                                            ) : (
                                                "Không có hình ảnh"
                                            )}
                                        </td>
                                        <td>{story.title}</td>
                                        <td>{story.description?.length > 50 ? `${story.description.slice(0,80)} ...` : story.description}</td>
                                        <td>{story.level}</td>
                                        <td>{story.category}</td>
                                        <td>{story.content ? story.content.length : 0}</td>
                                        <td className="admin-story-actions">
                                            <a
                                                href={`${updateUrl}/${story._id}`}
                                                className="admin-story-btn-edit"
                                            >
                                                Sửa
                                            </a>
                                            <button
                                                className="admin-story-btn-delete"
                                                onClick={() => handleDelete(story._id, story.title)}
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8}>Không có câu chuyện.</td>
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

export default StoryList;