import React, { useState, useEffect } from "react";
import AddJourney from "@/components/admin/journey/AddJourney.jsx";
import UpdateJourney from "@/components/admin/journey/UpdateJourney.jsx";
import Swal from "sweetalert2";

function JourneyList({ fetchData, deleteItem, title, dataKey }) {
    const [journeys, setJourneys] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedJourney, setSelectedJourney] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditListModalOpen, setIsEditListModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const loadData = async (page = 1) => {
        setLoading(true);
        try {
            const data = await fetchData(page);
            setJourneys(data[dataKey] || []);
            setCurrentPage(data.currentPage);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error(err);
            setJourneys([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData(currentPage);
    }, [currentPage]);

    const handleDelete = (id, title) => {
        Swal.fire({
            title: 'Bạn có chắc?',
            text: `Bạn có muốn xóa hành trình "${title}" không?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Hủy',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteItem(id);
                    Swal.fire('Thành công!', `Xóa hành trình "${title}" thành công!`, 'success');
                    loadData(currentPage);
                } catch (err) {
                    Swal.fire('Thất bại!', `Xóa hành trình "${title}" thất bại!`, 'error');
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
                    className={`admin-journey-page-item ${i == currentPage ? "active" : ""}`}
                >
                    <button className="admin-journey-page-link" onClick={() => setCurrentPage(i)}>
                        {i}
                    </button>
                </li>
            );
        }
        return (
            <ul className="admin-journey-pagination">
                {currentPage > 1 && (
                    <li className="admin-journey-page-item">
                        <button
                            className="admin-journey-page-link"
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            &laquo;
                        </button>
                    </li>
                )}
                {pages}
                {currentPage < totalPages && (
                    <li className="admin-journey-page-item">
                        <button
                            className="admin-journey-page-link"
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
        <div className="admin-journey-wrapper">
            <h1 className="admin-journey-title">{title}</h1>
            <div className="admin-exercise-add">
                <a onClick={() => setIsCreateModalOpen(true)} className="admin-exercise-add-btn">
                    + Thêm hành trình
                </a>
            </div>
            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : (
                <div className="admin-journey-table-container">
                    <table className="admin-journey-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Tiêu đề</th>
                                <th>Số lượng cổng</th>
                                <th>Ngày tạo</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {journeys.length > 0 ? (
                                journeys.map((journey, index) => {
                                    const createdAt = new Date(journey.createdAt).toLocaleString(
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
                                        <tr key={journey._id}>
                                            <td>{(currentPage - 1) * 12 + index + 1}</td>
                                            <td>{journey.title}</td>
                                            <td>{journey.gates ? journey.gates.length : 0}</td>
                                            <td>{createdAt}</td>
                                            <td className="admin-journey-actions">
                                                <a
                                                    onClick={() => {
                                                        setSelectedJourney(journey);
                                                        setIsEditListModalOpen(true);
                                                    }}
                                                    className="admin-journey-btn-edit"
                                                >
                                                    Sửa
                                                </a>
                                                <button
                                                    className="admin-journey-btn-delete"
                                                    onClick={() => handleDelete(journey._id, journey.title)}
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5}>Không có hành trình nào!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {renderPagination()}
                </div>
            )}
            <AddJourney
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={() => loadData(1)}
            />
            <UpdateJourney
                isOpen={isEditListModalOpen}
                onClose={() => setIsEditListModalOpen(false)}
                onUpdated={() => loadData(1)}
                journey={selectedJourney}
            />
        </div>
    );
}

export default JourneyList;