import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';

const UpdateDictation = ({ onSubmit, title, initialData, returnUrl, existingItems = [] }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        content: "",
        slug: "",
        sort: 0,
        display: true,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || "",
                description: initialData.description || "",
                content: initialData.content || "",
                slug: initialData.slug || "",
                sort: initialData.sort || 0,
                display: initialData.display,
            });
        }
    }, [initialData]);

    const generateSlug = (title) => {
        return title.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
    };

    const validateSort = (sortValue) => {
        const sortNum = parseInt(sortValue);
        if (sortNum == 0) {
            Swal.fire({
                icon: "warning",
                title: "Thứ tự không hợp lệ",
                text: "Thứ tự phải bắt đầu từ 1 trở lên!",
            });
            return false;
        }
        const existingItem = existingItems.find((item) => item.sort == sortNum && item._id !== initialData._id);
        if (existingItem) {
            Swal.fire({
                icon: "warning",
                title: "Thứ tự đã tồn tại",
                text: `Thứ tự số ${sortNum} là bài "${existingItem.title}". Vui lòng chọn số thứ tự khác!`,
            });
            return false;
        }
        return true;
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name == "title") {
            const newSlug = generateSlug(value);
            setFormData((prev) => ({
                ...prev,
                title: value,
                slug: newSlug,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: files ? files[0] : value,
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateSort(formData.sort)) {
            return;
        }
        const dataToSubmit = {
            title: formData.title,
            description: formData.description,
            content: formData.content,
            slug: formData.slug,
            sort: formData.sort,
            display: formData.display,
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
                <div className="admin-exercise-update-group">
                    <label htmlFor="admin-update-exercise-slug">Slug (URL):</label>
                    <input
                        type="text"
                        id="admin-update-exercise-slug"
                        name="slug"
                        value={formData.slug}
                        disabled
                        className="form-control"
                        style={{ backgroundColor: "#e9ecef", cursor: "not-allowed" }}
                    />
                    <small className="text-muted">Slug được tạo tự động từ tiêu đề</small>
                </div>
                <div className="admin-exercise-update-group">
                    <label htmlFor="admin-update-exercise-sort">Thứ tự:</label>
                    <input
                        type="number"
                        id="admin-update-exercise-sort"
                        name="sort"
                        value={formData.sort}
                        onChange={handleChange}
                        required
                        min="1"
                        className="form-control"
                        placeholder="Nhập số thứ tự (bắt đầu từ 1)"
                    />
                </div>
                <div className="admin-exercise-update-group">
                    <label htmlFor="admin-update-exercise-display">Hiển thị:</label>
                    <select
                        id="admin-update-exercise-display"
                        name="display"
                        value={formData.display}
                        onChange={handleChange}
                        required
                        className="form-control"
                    >
                        <option value={true}>Cho phép</option>
                        <option value={false}>Ẩn</option>
                    </select>
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