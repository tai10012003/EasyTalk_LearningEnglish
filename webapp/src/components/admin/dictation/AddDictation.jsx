import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddDictation = ({ onSubmit, title, returnUrl }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: "",
        description:"",
        content: ""
    });

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
        onSubmit(dataToSubmit);
    };

    return (
        <div className="admin-exercise-add-container">
            <h1 className="admin-exercise-add-title">{title}</h1>
            <form
                id="admin-exercise-add-form"
                className="admin-exercise-add-form"
                onSubmit={handleSubmit}
            >
                <div className="admin-exercise-add-group">
                    <label htmlFor="admin-exercise-add-title">Tiêu đề:</label>
                    <input
                        type="text"
                        id="admin-exercise-add-title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="form-control"
                    />
                </div>
                <div className="admin-exercise-add-group">
                    <label htmlFor="admin-exercise-add-description">Mô tả:</label>
                    <input
                        type="text"
                        id="admin-exercise-add-description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        className="form-control"
                    />
                </div>
                <div className="admin-exercise-add-group">
                    <label htmlFor="admin-exercise-add-content">Nội dung:</label>
                    <textarea
                        type="text"
                        id="admin-exercise-add-content"
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        required
                        className="form-control"
                    ></textarea>
                </div>
                <button
                    type="submit"
                    className="btn btn-primary admin-exercise-add-btn mt-3"
                >
                    Lưu
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

export default AddDictation;