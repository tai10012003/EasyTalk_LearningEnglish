import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UpdateDictation = ({ onSubmit, title, initialData, returnUrl }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        content: ""
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || "",
                description: initialData.description || "",
                content: initialData.content || ""
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSubmit = {
            title: formData.title,
            description: formData.description,
            content: formData.content
        };
        onSubmit(dataToSubmit, initialData._id);
    };

    return (
        <div className="admin-exercise-update-container">
            <h1 className="admin-exercise-update-title">{title}</h1>
            <form
                id="admin-exercise-update-form"
                className="admin-exercise-update-form"
                onSubmit={handleSubmit}
            >
                <div className="admin-exercise-update-group">
                    <label htmlFor="admin-exercise-update-title">Tiêu đề:</label>
                    <input
                        type="text"
                        id="admin-exercise-update-title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="form-control"
                    />
                </div>
                <div className="admin-exercise-update-group">
                    <label htmlFor="admin-exercise-update-description">Mô tả:</label>
                    <input
                        type="text"
                        id="admin-exercise-update-description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        className="form-control"
                    />
                </div>
                <div className="admin-exercise-update-group">
                    <label htmlFor="admin-exercise-update-content">Nội dung:</label>
                    <textarea
                        type="text"
                        id="admin-exercise-update-content"
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        required
                        className="form-control"
                    ></textarea>
                </div>
                {initialData.updatedAt && (
                    <div className="admin-exercise-update-group">
                        <label>Cập nhật gần nhất:</label>
                        <p className="form-control-plaintext">
                            {new Date(initialData.updatedAt).toLocaleString("vi-VN")}
                        </p>
                    </div>
                )}
                <button
                    type="submit"
                    className="btn btn-primary admin-exercise-update-btn mt-3"
                >
                    Cập nhật
                </button>
                <button
                    type="button"
                    className="mt-3 admin-exercise-return-btn btn btn-secondary"
                    onClick={() => navigate(`${returnUrl}`)}
                >
                    Quay lại
                </button>
            </form>
        </div>
    );
};

export default UpdateDictation;