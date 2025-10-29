import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const UpdateLesson = ({ onSubmit, title, initialData, returnUrl, existingItems = [] }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        content: "",
        type: "",
        image: null,
        quizzes: [],
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
                type: initialData.type || "",
                image: null,
                quizzes: initialData.quizzes || [],
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

    const handleAddQuestion = () => {
        if (!formData.type) {
            Swal.fire({
                icon: "warning",
                title: "Thiếu thông tin",
                text: "Vui lòng chọn loại bài tập trước khi thêm!",
            });
            return;
        }
        const newQuestion = {
            type: formData.type,
            question: "",
            correctAnswer: "",
            explanation: "",
            options: formData.type == "multiple-choice" ? ["", "", "", ""] : [],
        };
        setFormData((prev) => ({
            ...prev,
            quizzes: [...prev.quizzes, newQuestion],
        }));
    };

    const handleDeleteQuestion = async (index) => {
        const confirmDelete = await Swal.fire({
            title: "Xác nhận xóa?",
            text: "Bạn có chắc chắn muốn xóa câu hỏi này không?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
        });
        if (!confirmDelete.isConfirmed) return;
        const updated = formData.quizzes.filter((_, i) => i !== index);
        setFormData((prev) => ({ ...prev, quizzes: updated }));
        Swal.fire({
            icon: "success",
            title: "Đã xóa!",
            text: "Câu hỏi đã được xóa thành công.",
            timer: 1500,
            showConfirmButton: false,
        });
    };

    const handleQuestionChange = (index, field, value) => {
        setFormData((prevData) => {
            const newQuizzes = [...prevData.quizzes];
            const question = { ...newQuizzes[index] };
            if (field == "type") {
                question.type = value;
                question.question = "";
                question.correctAnswer = "";
                question.explanation = "";
                question.options = value == "multiple-choice" ? ["", "", "", ""] : [];
            } else {
                question[field] = value;
            }
            newQuizzes[index] = question;
            return { ...prevData, quizzes: newQuizzes };
        });
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const updated = [...formData.quizzes];
        updated[qIndex].options[oIndex] = value;
        setFormData((prev) => ({ ...prev, quizzes: updated }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateSort(formData.sort)) {
            return;
        }
        for (const q of formData.quizzes) {
            if (q.type == "multiple-choice") {
                const filledOptions = q.options.filter((opt) => opt.trim() !== "");
                if (filledOptions.length < 2) {
                    Swal.fire({
                        icon: "warning",
                        title: "Thiếu lựa chọn",
                        text: "Mỗi câu trắc nghiệm phải có ít nhất 2 lựa chọn được điền!",
                    });
                    return;
                }
            }
        }
        const dataToSubmit = new FormData();
        dataToSubmit.append("title", formData.title);
        dataToSubmit.append("description", formData.description);
        dataToSubmit.append("content", formData.content);
        dataToSubmit.append("type", formData.type);
        if (formData.image) {
            dataToSubmit.append("image", formData.image);
        }
        dataToSubmit.append("quizzes", JSON.stringify(formData.quizzes));
        dataToSubmit.append("slug", formData.slug);
        dataToSubmit.append("sort", formData.sort);
        dataToSubmit.append("display", formData.display);
        onSubmit(dataToSubmit, initialData._id);
    };

    return (
        <div className="admin-lesson-update-container">
            <h1 className="admin-lesson-update-title">{title}</h1>
            <form
                id="admin-lesson-update-form"
                className="admin-lesson-update-form"
                onSubmit={handleSubmit}
            >
                <div className="admin-lesson-update-group">
                    <label htmlFor="admin-lesson-update-title">Tiêu đề:</label>
                    <input
                        type="text"
                        id="admin-lesson-update-title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="form-control"
                    />
                </div>
                <div className="admin-lesson-update-group">
                    <label htmlFor="admin-update-lesson-description">Mô tả:</label>
                    <textarea
                        id="admin-update-lesson-description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        className="form-control"
                    ></textarea>
                </div>
                <div className="admin-lesson-update-group">
                    <label htmlFor="admin-update-lesson-content">Nội dung:</label>
                    <textarea
                        id="admin-update-lesson-content"
                        name="content"
                        rows="10"
                        value={formData.content}
                        onChange={handleChange}
                        required
                        className="form-control"
                    ></textarea>
                </div>
                <div className="admin-lesson-update-group admin-lesson-update-image">
                    <label htmlFor="admin-update-lesson-image">Hình ảnh:</label>
                    <input
                        type="file"
                        id="admin-update-lesson-image"
                        name="image"
                        accept="image/*"
                        onChange={handleChange}
                    />
                    {initialData?.images && (
                        <div className="mt-2">
                            <small>Ảnh hiện tại:</small>
                            <br />
                            <img src={initialData.images} alt="current" width="150" />
                        </div>
                    )}
                </div>
                <div className="admin-lesson-update-group">
                    <label htmlFor="admin-update-lesson-slug">Slug (URL):</label>
                    <input
                        type="text"
                        id="admin-update-lesson-slug"
                        name="slug"
                        value={formData.slug}
                        disabled
                        className="form-control"
                        style={{ backgroundColor: "#e9ecef", cursor: "not-allowed" }}
                    />
                    <small className="text-muted">Slug được tạo tự động từ tiêu đề</small>
                </div>
                <div className="admin-lesson-update-group">
                    <label htmlFor="admin-update-lesson-sort">Thứ tự:</label>
                    <input
                        type="number"
                        id="admin-update-lesson-sort"
                        name="sort"
                        value={formData.sort}
                        onChange={handleChange}
                        required
                        min="1"
                        className="form-control"
                        placeholder="Nhập số thứ tự (bắt đầu từ 1)"
                    />
                </div>
                <div className="admin-lesson-update-group">
                    <label htmlFor="admin-update-lesson-display">Hiển thị:</label>
                    <select
                        id="admin-update-lesson-display"
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
                <div id="admin-lesson-update-questions" className="mt-3">
                    {formData.quizzes.map((q, index) => (
                        <div key={index} className="admin-lesson-update-question">
                            <div className="admin-lesson-update-question-header">
                                <h5>
                                    Câu hỏi {index + 1} (
                                    {q.type == "multiple-choice"
                                        ? "Trắc nghiệm"
                                        : "Điền vào chỗ trống"}
                                    )
                                </h5>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteQuestion(index)}
                                >
                                    Xóa
                                </button>
                            </div>
                            <div className="admin-lesson-update-group">
                                <label>Câu hỏi:</label>
                                <input
                                    type="text"
                                    value={q.question}
                                    onChange={(e) => handleQuestionChange(index, "question", e.target.value)}
                                    className="form-control"
                                    required
                                />
                            </div>
                            <div className="admin-lesson-update-group">
                                <label>Đổi loại bài tập:</label>
                                <select
                                    value={q.type}
                                    onChange={(e) =>
                                        handleQuestionChange(index, "type", e.target.value)
                                    }
                                    className="form-control"
                                    required
                                >
                                    <option value="">Chọn loại</option>
                                    <option value="multiple-choice">Trắc nghiệm</option>
                                    <option value="fill-in-the-blank">Điền vào chỗ trống</option>
                                </select>
                            </div>
                            {q.type == "multiple-choice" && (
                                <div className="admin-lesson-update-group">
                                    <label>Lựa chọn:</label>
                                    {q.options.map((opt, oIndex) => (
                                        <input
                                            key={oIndex}
                                            type="text"
                                            placeholder={`Lựa chọn ${oIndex + 1}`}
                                            value={opt}
                                            onChange={(e) =>
                                                handleOptionChange(index, oIndex, e.target.value)
                                            }
                                            className="form-control"
                                        />
                                    ))}
                                </div>
                            )}
                            <div className="admin-lesson-update-group">
                                <label>Đáp án chính xác:</label>
                                <input
                                    type="text"
                                    value={q.correctAnswer}
                                    onChange={(e) =>
                                        handleQuestionChange(index, "correctAnswer", e.target.value)
                                    }
                                    className="form-control"
                                    required
                                />
                            </div>

                            <div className="admin-lesson-update-group">
                                <label>Giải thích:</label>
                                <textarea
                                    value={q.explanation}
                                    onChange={(e) =>
                                        handleQuestionChange(index, "explanation", e.target.value)
                                    }
                                    className="form-control"
                                    required
                                ></textarea>
                            </div>
                        </div>
                    ))}
                </div>
                {initialData.updatedAt && (
                    <div className="admin-lesson-update-group">
                        <label>Cập nhật gần nhất:</label>
                        <p className="form-control-plaintext">
                            {new Date(initialData.updatedAt).toLocaleString("vi-VN")}
                        </p>
                    </div>
                )}
                <div className="admin-lesson-update-group">
                    <label htmlFor="admin-lesson-update-type">
                        Chọn loại bài tập (khi thêm mới):
                    </label>
                    <select
                        id="admin-lesson-update-type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="form-control"
                    >
                        <option value="">Chọn loại</option>
                        <option value="multiple-choice">Trắc nghiệm</option>
                        <option value="fill-in-the-blank">Điền vào chỗ trống</option>
                    </select>
                </div>
                <button
                    type="button"
                    id="admin-lesson-update-btn-add-question"
                    className="btn btn-secondary mt-3"
                    onClick={handleAddQuestion}
                >
                    Thêm câu hỏi
                </button>
                <button
                    type="submit"
                    className="btn btn-primary admin-lesson-update-btn mt-3"
                >
                    Cập nhật
                </button>
                <button
                    type="button"
                    className="mt-3 admin-lesson-return-btn btn btn-secondary"
                    onClick={() => navigate(`${returnUrl}`)}
                >
                    Quay lại
                </button>
            </form>
        </div>
    );
};

export default UpdateLesson;