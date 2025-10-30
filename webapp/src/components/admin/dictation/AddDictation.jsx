import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';

const AddDictation = ({ onSubmit, title, returnUrl, existingItems = [] }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: "",
        description:"",
        content: "",
        slug: "",
        sort: 0,
        display: true,
    });

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
        const existingItem = existingItems.find(item => item.sort == sortNum);
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
            display: formData.display
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
                <div className="admin-exercise-add-group">
                    <label htmlFor="admin-add-exercise-slug">Slug (URL):</label>
                    <input
                        type="text"
                        id="admin-add-exercise-slug"
                        name="slug"
                        value={formData.slug}
                        disabled
                        className="form-control"
                        style={{ backgroundColor: "#e9ecef", cursor: "not-allowed" }}
                    />
                    <small className="text-muted">Slug được tạo tự động từ tiêu đề</small>
                </div>
                <div className="admin-exercise-add-group">
                    <label htmlFor="admin-add-exercise-sort">Thứ tự:</label>
                    <input
                        type="number"
                        id="admin-add-exercise-sort"
                        name="sort"
                        value={formData.sort}
                        onChange={handleChange}
                        required
                        min="1"
                        className="form-control"
                        placeholder="Nhập số thứ tự (bắt đầu từ 1)"
                    />
                </div>
                <div className="admin-exercise-add-group">
                    <label htmlFor="admin-add-exercise-display">Hiển thị:</label>
                    <select
                        id="admin-add-exercise-display"
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