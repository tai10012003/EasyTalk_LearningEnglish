import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const UpdatePrize = ({ onSubmit, title, initialData, returnUrl }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        type: "",
        level: "",
        iconClass: "",
        isUnique: false,
        requirement: { xp: "", streak: "", rank: "" }
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                code: initialData.code || "",
                name: initialData.name || "",
                type: initialData.type || "",
                level: initialData.level?.toString() || "",
                iconClass: initialData.iconClass || "",
                isUnique: initialData.isUnique || false,
                requirement: {
                    xp: initialData.requirement?.xp || "",
                    streak: initialData.requirement?.streak || "",
                    rank: initialData.requirement?.rank || ""
                }
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type: inputType } = e.target;
        if (name.startsWith("requirement.")) {
            const field = name.split(".")[1];
            setFormData(prev => ({
                ...prev,
                requirement: {
                    ...prev.requirement,
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: inputType === "checkbox" ? e.target.checked : value
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const cleanedRequirement = {};
        if (["knowledge_god", "xp_master"].includes(formData.type)) {
            cleanedRequirement.xp = Number(formData.requirement.xp);
        } else if (["perfect_week", "perfect_streak"].includes(formData.type)) {
            cleanedRequirement.streak = Number(formData.requirement.streak);
        } else if (formData.type.includes("champion")) {
            cleanedRequirement.rank = 1;
        }
        const dataToSubmit = {
            code: formData.code,
            name: formData.name,
            type: formData.type,
            level: Number(formData.level),
            iconClass: formData.iconClass,
            isUnique: formData.isUnique,
            requirement: cleanedRequirement
        };
        onSubmit(dataToSubmit, initialData._id);
    };

    const renderRequirementField = () => {
        const type = formData.type;
        if (type.includes("knowledge_god") || type === "xp_master") {
            return (
                <div className="admin-prize-update-group">
                    <label htmlFor="requirement-xp">Số KN (XP) yêu cầu:</label>
                    <input
                        type="number"
                        id="requirement-xp"
                        name="requirement.xp"
                        value={formData.requirement.xp}
                        onChange={handleChange}
                        required
                        className="form-control"
                        placeholder="Ví dụ: 500, 1500, 10000..."
                    />
                </div>
            );
        }
        if (type.includes("perfect_week") || type.includes("perfect_streak")) {
            return (
                <div className="admin-prize-update-group">
                    <label htmlFor="requirement-streak">Số ngày streak liên tiếp:</label>
                    <input
                        type="number"
                        id="requirement-streak"
                        name="requirement.streak"
                        value={formData.requirement.streak}
                        onChange={handleChange}
                        required
                        className="form-control"
                        placeholder="Ví dụ: 7, 30, 365..."
                    />
                </div>
            );
        }
        if (type.includes("champion")) {
            return (
                <div className="admin-prize-update-group">
                    <label>Yêu cầu:</label>
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
        <div className="admin-prize-update-container">
            <h1 className="admin-prize-update-title">{title}</h1>
            <form
                id="admin-prize-update-form"
                className="admin-prize-update-form"
                onSubmit={handleSubmit}
            >
                <div className="admin-prize-update-group">
                    <label htmlFor="code">Mã giải thưởng (Code):</label>
                    <input
                        type="text"
                        id="code"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        required
                        className="form-control"
                        placeholder="VD: KN_GOD_5, PERFECT_WEEK_10"
                    />
                </div>
                <div className="admin-prize-update-group">
                    <label htmlFor="name">Tên giải thưởng:</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="form-control"
                        placeholder="VD: Vị Thần Kiến Thức Cấp 5"
                    />
                </div>
                <div className="admin-prize-update-group">
                    <label htmlFor="type">Loại giải thưởng:</label>
                    <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                        className="form-select"
                    >
                        <option value="">-- Chọn loại --</option>
                        <option value="knowledge_god">Vị Thần Kiến Thức (XP)</option>
                        <option value="perfect_week">Tuần Hoàn Hảo (Streak)</option>
                        <option value="champion_week">Quán Quân Tuần</option>
                        <option value="champion_month">Quán Quân Tháng</option>
                        <option value="champion_year">Quán Quân Năm</option>
                    </select>
                </div>
                <div className="admin-prize-update-group">
                    <label htmlFor="level">Cấp độ:</label>
                    <select
                        id="level"
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
                <div className="admin-prize-update-group">
                    <label htmlFor="iconClass">Icon (Font Awesome):</label>
                    <input
                        type="text"
                        id="iconClass"
                        name="iconClass"
                        value={formData.iconClass}
                        onChange={handleChange}
                        required
                        className="form-control"
                        placeholder="VD: fas fa-crown text-purple-600"
                    />
                    <small className="text-muted">
                        Xem icon tại: <a href="https://fontawesome.com/icons" target="_blank" rel="noopener noreferrer">fontawesome.com</a>
                    </small>
                </div>
                {renderRequirementField()}
                <div className="admin-prize-update-group">
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
                            {formData.isUnique ? "Có (Quán quân)" : "Không (có thể đạt nhiều cấp)"}
                        </label>
                    </div>
                </div>
                {initialData?.updatedAt && (
                    <div className="admin-prize-update-group">
                        <label>Cập nhật gần nhất:</label>
                        <p className="form-control-plaintext">
                            {new Date(initialData.updatedAt).toLocaleString("vi-VN")}
                        </p>
                    </div>
                )}
                <button
                        type="submit"
                        className="btn btn-primary admin-prize-update-btn"
                    >
                        Cập nhật
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

export default UpdatePrize;