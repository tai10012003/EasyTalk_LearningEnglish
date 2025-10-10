import React, { useState, useEffect } from "react";
import { JourneyService } from "@/services/JourneyService.jsx";

const UpdateJourney = ({ isOpen, onClose, onUpdated, journey }) => {
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (journey) {
            setTitle(journey.title || "");
        }
    }, [journey]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            alert("Vui lòng nhập tiêu đề!");
            return;
        }
        setLoading(true);
        try {
            const payload = { title };
            const data = await JourneyService.updateJourney(journey._id, payload);
            if (data.journey) {
                alert("✅ Hành trình học tập đã được cập nhật thành công!");
                onUpdated();
                onClose();
            } else {
                alert("❌ Có lỗi xảy ra: " + (data.message || "Không xác định"));
            }
        } catch (error) {
            alert("❌ Lỗi khi cập nhật hành trình: " + error.message);
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="custom-modal-overlay" onClick={onClose}>
            <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                <div className="custom-modal-header">
                    <h5>CẬP NHẬT HÀNH TRÌNH HỌC TẬP</h5>
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

export default UpdateJourney;