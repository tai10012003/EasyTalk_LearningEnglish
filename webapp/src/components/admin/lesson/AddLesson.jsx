import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const AddLesson = ({ onSubmit, title, returnUrl, existingItems = [] }) => {
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
        const updatedQuestions = formData.quizzes.filter((_, i) => i !== index);
        setFormData((prev) => ({
            ...prev,
            quizzes: updatedQuestions,
        }));
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
        const updatedQuestions = [...formData.quizzes];
        updatedQuestions[qIndex].options[oIndex] = value;
        setFormData((prev) => ({
            ...prev,
            quizzes: updatedQuestions,
        }));
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
                        text: "Mỗi câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn được điền!",
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
        onSubmit(dataToSubmit);
    };

    return (
        <div className="admin-lesson-add-container">
            <h1 className="admin-lesson-add-title">{title}</h1>
            <form
                id="admin-lesson-add-form"
                className="admin-lesson-add-form"
                onSubmit={handleSubmit}
            >
                <div className="admin-lesson-add-group">
                    <label htmlFor="admin-lesson-add-title">Tiêu đề:</label>
                    <input
                        type="text"
                        id="admin-lesson-add-title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="form-control"
                    />
                </div>
                <div className="admin-lesson-add-group">
                    <label htmlFor="admin-add-lesson-description">Mô tả:</label>
                    <textarea
                        id="admin-add-lesson-description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        className="form-control"
                    ></textarea>
                </div>
                <div className="admin-lesson-add-group">
                    <label htmlFor="admin-add-lesson-content">Nội dung:</label>
                    <textarea
                        id="admin-add-lesson-content"
                        name="content"
                        rows="10"
                        value={formData.content}
                        onChange={handleChange}
                        required
                        placeholder="Enter content with links to images/videos, e.g. /static/images/example.png"
                    ></textarea>
                </div>
                <div className="admin-lesson-add-group admin-lesson-add-image">
                    <label htmlFor="admin-add-lesson-image">Hình ảnh:</label>
                    <input
                        type="file"
                        id="admin-add-lesson-image"
                        name="image"
                        accept="image/*"
                        onChange={handleChange}
                    />
                </div>
                <div className="admin-lesson-add-group">
                    <label htmlFor="admin-add-lesson-slug">Slug (URL):</label>
                    <input
                        type="text"
                        id="admin-add-lesson-slug"
                        name="slug"
                        value={formData.slug}
                        disabled
                        className="form-control"
                        style={{ backgroundColor: "#e9ecef", cursor: "not-allowed" }}
                    />
                    <small className="text-muted">Slug được tạo tự động từ tiêu đề</small>
                </div>
                <div className="admin-lesson-add-group">
                    <label htmlFor="admin-add-lesson-sort">Thứ tự:</label>
                    <input
                        type="number"
                        id="admin-add-lesson-sort"
                        name="sort"
                        value={formData.sort}
                        onChange={handleChange}
                        required
                        min="1"
                        className="form-control"
                        placeholder="Nhập số thứ tự (bắt đầu từ 1)"
                    />
                </div>
                <div className="admin-lesson-add-group">
                    <label htmlFor="admin-add-lesson-display">Hiển thị:</label>
                    <select
                        id="admin-add-lesson-display"
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
                <div id="admin-lesson-add-questions" className="mt-3">
                    {formData.quizzes.map((q, index) => (
                        <div key={index} className="admin-lesson-add-question">
                            <div className="admin-lesson-add-question-header">
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
                            <div className="admin-lesson-add-group">
                                <label htmlFor={`question-${index}`}>Câu hỏi:</label>
                                <input
                                    type="text"
                                    id={`question-${index}`}
                                    value={q.question}
                                    onChange={(e) =>
                                        handleQuestionChange(index, "question", e.target.value)
                                    }
                                    className="form-control"
                                    required
                                />
                            </div>
                            <div className="admin-lesson-add-group">
                                <label htmlFor={`type-${index}`}>Đổi loại bài tập:</label>
                                <select
                                    id={`type-${index}`}
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
                                <div className="admin-lesson-add-group">
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
                            <div className="admin-lesson-add-group">
                                <label htmlFor={`answer-${index}`}>Đáp án chính xác:</label>
                                <input
                                    type="text"
                                    id={`answer-${index}`}
                                    value={q.correctAnswer}
                                    onChange={(e) =>
                                        handleQuestionChange(index, "correctAnswer", e.target.value)
                                    }
                                    className="form-control"
                                    required
                                />
                            </div>
                            <div className="admin-lesson-add-group">
                                <label htmlFor={`explanation-${index}`}>Giải thích:</label>
                                <textarea
                                    id={`explanation-${index}`}
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
                <div className="admin-lesson-add-group">
                    <label htmlFor="admin-lesson-add-type">
                        Chọn loại bài tập (khi thêm mới):
                    </label>
                    <select
                        id="admin-lesson-add-type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                        className="form-control"
                    >
                        <option value="">Chọn loại</option>
                        <option value="multiple-choice">Trắc nghiệm</option>
                        <option value="fill-in-the-blank">Điền vào chỗ trống</option>
                    </select>
                </div>
                <button
                    type="button"
                    id="admin-lesson-add-btn-add-question"
                    className="btn btn-secondary mt-3"
                    onClick={handleAddQuestion}
                >
                    Thêm câu hỏi
                </button>
                <button
                    type="submit"
                    className="btn btn-primary admin-lesson-add-btn mt-3"
                >
                    Lưu
                </button>
                <button
                    type="button"
                    className="mt-3 admin-lesson-return-btn btn btn-secondary"
                    onClick={() => navigate(`${returnUrl}`)}
                >
                    <i className="fas fa-arrow-left"></i> Quay lại
                </button>
            </form>
        </div>
    );
};

export default AddLesson;