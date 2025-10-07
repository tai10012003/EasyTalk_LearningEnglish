import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UpdateExercise = ({ onSubmit, title, initialData, returnUrl, isPronunciationPage = false }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: "",
        questions: [],
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || "",
                questions: initialData.questions || [],
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

    const handleAddQuestion = () => {
        if (!formData.type) {
            alert("Vui lòng chọn loại bài tập trước khi thêm!");
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

    const handleDeleteQuestion = (index) => {
        const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này không?");
        if (!confirmDelete) return;
        const updated = formData.questions.filter((_, i) => i !== index);
        setFormData((prev) => ({ ...prev, questions: updated }));
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
        const updated = [...formData.questions];
        updated[qIndex].options[oIndex] = value;
        setFormData((prev) => ({ ...prev, questions: updated }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        for (const q of formData.questions) {
            if (q.type == "multiple-choice") {
                const filledOptions = q.options.filter((opt) => opt.trim() !== "");
                if (filledOptions.length < 2) {
                    alert("Mỗi câu trắc nghiệm phải có ít nhất 2 lựa chọn hợp lệ!");
                    return;
                }
            }
        }
        const dataToSubmit = {
            title: formData.title,
            questions: formData.questions,
        };
        onSubmit(dataToSubmit, initialData._id);
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
                <div id="admin-exercise-update-questions" className="mt-3">
                    {formData.questions.map((q, index) => (
                        <div key={index} className="admin-exercise-update-question">
                            <div className="admin-exercise-update-question-header">
                                <h5>
                                    Câu hỏi {index + 1} (
                                    {{
                                        "multiple-choice": "Trắc nghiệm",
                                        "fill-in-the-blank": "Điền vào chỗ trống",
                                        "translation": "Dịch nghĩa",
                                        "pronunciation": "Phát âm"
                                    }[q.type] || ""}
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
                            <div className="admin-exercise-update-group">
                                <label>Câu hỏi:</label>
                                <input
                                    type="text"
                                    value={q.question}
                                    onChange={(e) => handleQuestionChange(index, "question", e.target.value)}
                                    className="form-control"
                                    required
                                />
                            </div>
                            <div className="admin-exercise-update-group">
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
                                    {availableTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {q.type == "multiple-choice" && (
                                <div className="admin-exercise-update-group">
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
                {initialData.updatedAt && (
                    <div className="admin-exercise-update-group">
                        <label>Cập nhật gần nhất:</label>
                        <p className="form-control-plaintext">
                            {new Date(initialData.updatedAt).toLocaleString("vi-VN")}
                        </p>
                    </div>
                )}
                <div className="admin-exercise-update-group">
                    <label htmlFor="admin-exercise-update-type">
                        Chọn loại bài tập (khi thêm mới):
                    </label>
                    <select
                        id="admin-exercise-update-type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
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
                    id="admin-exercise-update-btn-add-question"
                    className="btn btn-secondary mt-3"
                    onClick={handleAddQuestion}
                >
                    Thêm câu hỏi
                </button>
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

export default UpdateExercise;