import React, { useState, useEffect } from "react";
import { GateService } from "@/services/GateService.jsx";
import { JourneyService } from "@/services/JourneyService.jsx";

const AddGate = ({ isOpen, onClose, onCreated }) => {
    const [title, setTitle] = useState("");
    const [journeyId, setJourneyId] = useState("");
    const [journeys, setJourneys] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadJourneys = async () => {
            const data = await JourneyService.fetchJourneyAdmin();
            setJourneys(data.journeys || []);
        };
        if (isOpen) loadJourneys();
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return alert("Vui lòng nhập tiêu đề!");
        if (!journeyId) return alert("Vui lòng chọn hành trình!");

        setLoading(true);
        try {
            const payload = { title, journeyId };
            const data = await GateService.addGate(payload);
            if (data.gate) {
                alert("✅ Tạo cổng học tập thành công!");
                setTitle("");
                setJourneyId("");
                onCreated();
                onClose();
            } else {
                alert("❌ Có lỗi xảy ra: " + (data.message || "Không xác định"));
            }
        } catch (error) {
            alert("❌ Lỗi khi tạo cổng học tập: " + error.message);
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="custom-modal-overlay" onClick={onClose}>
            <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                <div className="custom-modal-header">
                    <h5>THÊM CỔNG HỌC TẬP MỚI</h5>
                    <button className="close-btn" onClick={onClose}>×</button>
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

                        <div className="mb-3">
                            <label className="form-label">Hành trình:</label>
                            <select
                                className="form-select select-colored"
                                value={journeyId}
                                onChange={(e) => setJourneyId(e.target.value)}
                                required
                            >
                                <option value="">-- Chọn hành trình --</option>
                                {journeys.map((j) => (
                                    <option key={j._id} value={j._id}>
                                        {j.title}
                                    </option>
                                ))}
                            </select>
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
                            <i className="fas fa-times"></i> Đóng
                        </button>
                        <button type="submit" className="footer-btn" disabled={loading}>
                            <i className="fas fa-save"></i> {loading ? "Đang lưu..." : "Lưu"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddGate;