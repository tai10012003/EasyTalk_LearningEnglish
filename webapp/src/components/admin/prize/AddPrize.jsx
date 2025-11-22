import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddPrize = ({ onSubmit, title, returnUrl }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        type: "",
        level: "",
        requirement: { xp: "", streak: "", rank: "" },
        isUnique: false,
        iconClass: "fas fa-trophy text-warning"
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith("requirement.")) {
            const field = name.split(".")[1];
            setFormData(prev => ({
                ...prev,
                requirement: {
                    ...prev.requirement,
                    [field]: value
                }
            }));
        } 
        else if (type === "checkbox") {
            setFormData(prev => ({ ...prev, [name]: checked }));
        }
        else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        let requirement = {};
        if (formData.type === "knowledge_god") {
            if (!formData.requirement.xp || formData.requirement.xp < 1) {
                alert("Vui lòng nhập số KN yêu cầu hợp lệ!");
                return;
            }
            requirement = { xp: Number(formData.requirement.xp) };
        } 
        else if (formData.type === "perfect_week") {
            if (!formData.requirement.streak || formData.requirement.streak < 1) {
                alert("Vui lòng nhập số ngày streak yêu cầu!");
                return;
            }
            requirement = { streak: Number(formData.requirement.streak) };
        }
        else if (formData.type.includes("champion")) {
            requirement = { rank: 1 };
        }
        const dataToSubmit = {
            code: formData.code.trim().toUpperCase(),
            name: formData.name,
            type: formData.type,
            level: Number(formData.level),
            requirement,
            isUnique: formData.isUnique,
            iconClass: formData.iconClass
        };
        onSubmit(dataToSubmit);
    };

    const prizeTypes = [
        { value: "perfect_week", label: "Tuần Hoàn Hảo (Streak)" },
        { value: "knowledge_god", label: "Vị Thần Kiến Thức (XP)" },
        { value: "champion_week", label: "Quán Quân Tuần" },
        { value: "champion_month", label: "Quán Quân Tháng" },
        { value: "champion_year", label: "Quán Quân Năm" }
    ];

    const renderRequirementField = () => {
        const type = formData.type;
        if (type === "knowledge_god") {
            return (
                <div className="admin-prize-add-group">
                    <label htmlFor="requirement-xp">Số KN (XP) yêu cầu:</label>
                    <input
                        type="number"
                        id="requirement-xp"
                        name="requirement.xp"
                        value={formData.requirement.xp}
                        onChange={handleChange}
                        required
                        min="1"
                        className="form-control"
                        placeholder="VD: 500, 10000, 50000..."
                    />
                </div>
            );
        }
        if (type === "perfect_week") {
            return (
                <div className="admin-prize-add-group">
                    <label htmlFor="requirement-streak">Số ngày streak liên tiếp:</label>
                    <input
                        type="number"
                        id="requirement-streak"
                        name="requirement.streak"
                        value={formData.requirement.streak}
                        onChange={handleChange}
                        required
                        min="1"
                        className="form-control"
                        placeholder="VD: 7, 30, 365..."
                    />
                </div>
            );
        }
        if (type.includes("champion")) {
            return (
                <div className="admin-prize-add-group">
                    <label>Yêu cầu đạt giải:</label>
                    <p className="form-control-plaintext text-success font-medium">
                        Top 1 bảng xếp hạng (tự động)
                    </p>
                    <small className="text-muted">
                        Không cần nhập - hệ thống tự ghi nhận khi người dùng đứng đầu
                    </small>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="admin-prize-add-container">
            <h1 className="admin-prize-add-title">{title}</h1>
            <form id="admin-prize-add-form" className="admin-prize-add-form" onSubmit={handleSubmit}>
                <div className="admin-prize-add-group">
                    <label>Mã giải thưởng (Code):</label>
                    <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        required
                        className="form-control"
                        placeholder="VD: KN_GOD_10"
                    />
                </div>
                <div className="admin-prize-add-group">
                    <label>Tên giải thưởng:</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="form-control"
                        placeholder="VD: Vị Thần Kiến Thức Cấp 10"
                    />
                </div>
                <div className="admin-prize-add-group">
                    <label>Loại giải thưởng:</label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                        className="form-select"
                    >
                        <option value="">-- Chọn loại giải thưởng --</option>
                        {prizeTypes.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>
                <div className="admin-prize-add-group">
                    <label>Cấp độ:</label>
                    <select
                        name="level"
                        value={formData.level}
                        onChange={handleChange}
                        required
                        className="form-select"
                    >
                        <option value="">-- Chọn cấp độ --</option>
                        {[1,2,3,4,5,6,7,8,9,10].map(l => (
                            <option key={l} value={l}>Cấp {l}</option>
                        ))}
                    </select>
                </div>
                <div className="admin-prize-add-group">
                    <label>Icon (Font Awesome):</label>
                    <input
                        type="text"
                        name="iconClass"
                        value={formData.iconClass}
                        onChange={handleChange}
                        required
                        className="form-control"
                        placeholder="VD: fas fa-crown text-purple-600"
                    />
                    <small className="text-muted">
                        Xem icon tại: <a href="https://fontawesome.com/search" target="_blank" rel="noopener noreferrer">fontawesome.com</a>
                    </small>
                </div>
                {renderRequirementField()}
                <div className="admin-prize-add-group">
                    <label>Giải thưởng duy nhất (chỉ đạt 1 lần):</label>
                    <div className="form-check form-switch">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="isUnique"
                            name="isUnique"
                            checked={formData.isUnique}
                            onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="isUnique">
                            {formData.isUnique ? "Có (Quán quân – chỉ đạt 1 lần)" : "Không (có thể đạt nhiều cấp)"}
                        </label>
                    </div>
                </div>
                <button
                        type="submit"
                        className="btn btn-primary admin-prize-add-btn"
                    >
                        Thêm giải thưởng
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary admin-prize-return-btn"
                        onClick={() => navigate(returnUrl)}
                    >
                        Quay lại
                    </button>
            </form>
        </div>
    );
};

export default AddPrize;