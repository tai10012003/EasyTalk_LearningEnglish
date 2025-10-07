import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddLesson = ({ onSubmit, title, returnUrl }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        content: "",
        type: "",
        image: null,
        quizzes: [],
    });

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };

    const handleAddQuestion = () => {
        if (!formData.type) {
            alert("Vui lòng chọn loại bài tập trước!");
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

    const handleDeleteQuestion = (index) => {
        const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này không?");
        if (!confirmDelete) return;
        const updatedQuestions = formData.quizzes.filter((_, i) => i !== index);
        setFormData((prev) => ({
            ...prev,
            quizzes: updatedQuestions,
        }));
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
        for (const q of formData.quizzes) {
            if (q.type == "multiple-choice") {
                const filledOptions = q.options.filter((opt) => opt.trim() !== "");
                if (filledOptions.length < 2) {
                    alert("Mỗi câu trắc nghiệm phải có ít nhất 2 lựa chọn hợp lệ!");
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
                        required
                    />
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
                    Quay lại
                </button>
            </form>
        </div>
    );
};

export default AddLesson;