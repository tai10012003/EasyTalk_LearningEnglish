import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const AddExercise = ({ onSubmit, title, returnUrl, isPronunciationPage = false, existingItems = [] }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: "",
        questions: [],
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
                text: "Vui lòng chọn loại bài tập trước!",
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
            questions: [...prev.questions, newQuestion],
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
        const updatedQuestions = formData.questions.filter((_, i) => i !== index);
        setFormData((prev) => ({
            ...prev,
            questions: updatedQuestions,
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
            const newQuestions = [...prevData.questions];
            const question = { ...newQuestions[index] };
            if (field == "type") {
                question.type = value;
                question.question = "";
                question.correctAnswer = "";
                question.explanation = "";
                question.options = value == "multiple-choice" ? ["", "", "", ""] : [];
            } else {
                question[field] = value;
            }

            newQuestions[index] = question;
            return { ...prevData, questions: newQuestions };
        });
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const updatedQuestions = [...formData.questions];
        updatedQuestions[qIndex].options[oIndex] = value;
        setFormData((prev) => ({
            ...prev,
            questions: updatedQuestions,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateSort(formData.sort)) {
            return;
        }
        for (const q of formData.questions) {
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
        const dataToSubmit = {
            title: formData.title,
            questions: formData.questions,
            slug: formData.slug,
            sort: formData.sort,
            display: formData.display
        };
        onSubmit(dataToSubmit);
    };

    const availableTypes = isPronunciationPage
    ? [
        { value: "multiple-choice", label: "Trắc nghiệm" },
        { value: "pronunciation", label: "Phát âm" },
    ]
    : [
        { value: "multiple-choice", label: "Trắc nghiệm" },
        { value: "fill-in-the-blank", label: "Điền vào chỗ trống" },
        { value: "translation", label: "Dịch nghĩa" },
    ];

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
                <div id="admin-exercise-add-questions" className="mt-3">
                    {formData.questions.map((q, index) => (
                        <div key={index} className="admin-exercise-add-question">
                            <div className="admin-exercise-add-question-header">
                                <h5>
                                    Câu hỏi {index + 1} (
                                    {q.type == "multiple-choice"
                                        ? "Trắc nghiệm"
                                        : q.type == "fill-in-the-blank"
                                        ? "Điền vào chỗ trống"
                                        : q.type == "translation"
                                        ? "Dịch nghĩa"
                                        : q.type == "pronunciation"
                                        ? "Phát âm"
                                        : ""}
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
                            <div className="admin-exercise-add-group">
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
                            <div className="admin-exercise-add-group">
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
                                    {availableTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {q.type == "multiple-choice" && (
                                <div className="admin-exercise-add-group">
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
                            {q.type == "pronunciation" && (
                                <>
                                    <div className="admin-exercise-add-group">
                                        <label>Phát âm chính xác (Văn bản so sánh):</label>
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
                                    <div className="admin-exercise-add-group">
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
                                </>
                            )}
                            {q.type != "pronunciation" && (
                                <>
                                    <div className="admin-exercise-add-group">
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

                                    <div className="admin-exercise-add-group">
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
                                </>
                            )}
                        </div>
                    ))}
                </div>
                <div className="admin-exercise-add-group">
                    <label htmlFor="admin-exercise-add-type">
                        Chọn loại bài tập (khi thêm mới):
                    </label>
                    <select
                        id="admin-exercise-add-type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                        className="form-control"
                    >
                        <option value="">Chọn loại</option>
                        {availableTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    type="button"
                    id="admin-exercise-add-btn-add-question"
                    className="btn btn-secondary mt-3"
                    onClick={handleAddQuestion}
                >
                    Thêm câu hỏi
                </button>
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

export default AddExercise;