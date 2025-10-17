import React, { useState } from "react";
import { JourneyService } from "@/services/JourneyService.jsx";
import Swal from "sweetalert2";

const AddJourney = ({ isOpen, onClose, onCreated }) => {
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Chú ý!',
                text: 'Vui lòng nhập tiêu đề!',
            });
            return;
        }
        setLoading(true);
        try {
            const payload = { title };
            const data = await JourneyService.addJourney(payload);
            if (data.journey) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Thành công!',
                    text: 'Tạo hành trình học tập thành công!',
                });
                setTitle("");
                onCreated();
                onClose();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Thất bại!',
                    text: 'Có lỗi xảy ra: ' + (data.message || "Không xác định"),
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Lỗi khi tạo hành trình học tập: ' + error.message,
            });
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="custom-modal-overlay" onClick={onClose}>
            <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                <div className="custom-modal-header">
                    <h5>THÊM HÀNH TRÌNH HỌC TẬP MỚI</h5>
                    <button className="close-btn" onClick={onClose}>
                        ×
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="custom-modal-body">
                        <div className="mb-3">
                            <label className="form-label">Tiêu đề:</label>
                            <input
                                type="text"
                                className="form-control"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Nhập tiêu đề"
                                required
                            />
                        </div>
                    </div>
                    <div
                        className="custom-modal-footer"
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <button type="button" className="footer-btn" onClick={onClose} disabled={loading}>
                            <i className="fas fa-times"></i>Đóng
                        </button>
                        <button type="submit" className="footer-btn" disabled={loading}>
                            <i className="fas fa-save"></i>{loading ? "Đang lưu..." : "Lưu"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddJourney;