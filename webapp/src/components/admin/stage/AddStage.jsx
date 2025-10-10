import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GateService } from "@/services/GateService";

const AddStage = ({ onSubmit, title, returnUrl }) => {
    const navigate = useNavigate();
    const [gates, setGates] = useState([]);
    const [formData, setFormData] = useState({
        title: "",
        gate: "",
        questions: [],
    });

    useEffect(() => {
        const fetchGates = async () => {
            try {
                const res = await GateService.fetchGate(1, 100);
                console.log("Danh sách cổng:", res.gates);
                setGates(res.gates || []);
            } catch (error) {
                console.error("Lỗi khi tải danh sách cổng:", error);
            }
        };
        fetchGates();
    }, []);

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
            questions: [...prev.questions, newQuestion],
        }));
    };

    const handleDeleteQuestion = (index) => {
        const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này không?");
        if (!confirmDelete) return;
        const updatedQuestions = formData.questions.filter((_, i) => i !== index);
        setFormData((prev) => ({
            ...prev,
            questions: updatedQuestions,
        }));
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
            gateId: formData.gate,
        };
        console.log("Form gửi đi:", dataToSubmit);
        onSubmit(dataToSubmit);
    };

    const availableTypes = [
        { value: "multiple-choice", label: "Trắc nghiệm" },
        { value: "fill-in-the-blank", label: "Điền vào chỗ trống" },
        { value: "translation", label: "Dịch nghĩa" }
    ]

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
                    <label>Cổng:</label>
                    <select
                        name="gate"
                        value={formData.gate}
                        onChange={handleChange}
                        required
                        className="form-select"
                    >
                        <option value="">-- Chọn cổng --</option>
                        {gates.map((gate) => (
                            <option key={gate._id} value={gate._id}>
                                {gate.title} - {gate.journeyInfo.title}
                            </option>
                        ))}
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

export default AddStage;