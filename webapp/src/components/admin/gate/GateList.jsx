import React, { useState, useEffect } from "react";
import AddGate from "@/components/admin/gate/AddGate.jsx";
import UpdateGate from "@/components/admin/gate/UpdateGate.jsx";
import Swal from "sweetalert2";

function GateList({ fetchData, deleteItem, title, dataKey }) {
    const [gates, setGates] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedGate, setSelectedGate] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditListModalOpen, setIsEditListModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const loadData = async (page = 1) => {
        setLoading(true);
        try {
            const data = await fetchData(page);
            setGates(data[dataKey] || []);
            setCurrentPage(data.currentPage);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error(err);
            setGates([]);
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
            text: `Bạn có muốn xóa cổng học tập "${title}" không?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Hủy',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteItem(id);
                    Swal.fire('Thành công!', `Xóa cổng "${title}" thành công!`, 'success');
                    loadData(currentPage);
                } catch (err) {
                    Swal.fire('Thất bại!', `Xóa cổng "${title}" thất bại!`, 'error');
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
                    className={`admin-gate-page-item ${i == currentPage ? "active" : ""}`}
                >
                    <button className="admin-gate-page-link" onClick={() => setCurrentPage(i)}>
                        {i}
                    </button>
                </li>
            );
        }
        return (
            <ul className="admin-gate-pagination">
                {currentPage > 1 && (
                    <li className="admin-gate-page-item">
                        <button
                            className="admin-gate-page-link"
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            &laquo;
                        </button>
                    </li>
                )}
                {pages}
                {currentPage < totalPages && (
                    <li className="admin-gate-page-item">
                        <button
                            className="admin-gate-page-link"
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
        <div className="admin-gate-wrapper">
            <h1 className="admin-gate-title">{title}</h1>
            <div className="admin-exercise-add">
                <a onClick={() => setIsCreateModalOpen(true)} className="admin-exercise-add-btn">
                    + Thêm cổng
                </a>
            </div>
            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : (
                <div className="admin-gate-table-container">
                    <table className="admin-gate-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Tiêu đề</th>
                                <th>Hành trình</th>
                                <th>Số lượng chặng</th>
                                <th>Ngày tạo</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {gates.length > 0 ? (
                                gates.map((gate, index) => {
                                    const createdAt = new Date(gate.createdAt).toLocaleString(
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
                                        <tr key={gate._id}>
                                            <td>{(currentPage - 1) * 6 + index + 1}</td>
                                            <td>{gate.title}</td>
                                            <td>{gate.journeyInfo ? gate.journeyInfo.title : "Không có hành trình"}</td>
                                            <td>{gate.stages ? gate.stages.length : 0}</td>
                                            <td>{createdAt}</td>
                                            <td className="admin-gate-actions">
                                                <a
                                                    onClick={() => {
                                                        setSelectedGate(gate);
                                                        setIsEditListModalOpen(true);
                                                    }}
                                                    className="admin-gate-btn-edit"
                                                >
                                                    Sửa
                                                </a>
                                                <button
                                                    className="admin-gate-btn-delete"
                                                    onClick={() => handleDelete(gate._id, gate.title)}
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6}>Không có cổng nào!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {renderPagination()}
                </div>
            )}
            <AddGate
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={() => loadData(1)}
            />
            <UpdateGate
                isOpen={isEditListModalOpen}
                onClose={() => setIsEditListModalOpen(false)}
                onUpdated={() => loadData(1)}
                gate={selectedGate}
            />
        </div>
    );
}

export default GateList;