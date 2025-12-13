import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GateService } from "@/services/GateService";
import Swal from "sweetalert2";

const UpdateStage = ({ onSubmit, title, initialData, returnUrl }) => {
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

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || "",
                gate: initialData.gate || "",
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
            options: formData.type == "multiple-choice" || formData.type === "arrange-words" ? ["", "", "", ""] : [],
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
        const updated = formData.questions.filter((_, i) => i !== index);
        setFormData((prev) => ({ ...prev, questions: updated }));
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
                if (value === "multiple-choice" || value === "arrange-words") {
                    if (!question.options || question.options.length === 0) {
                        question.options = ["", "", "", ""];
                    }
                    if (value == "multiple-choice" && question.options.length > 4) {
                        question.options = question.options.slice(0, 4);
                    }
                } else {
                    question.options = [];
                }
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
                    Swal.fire({
                        icon: "warning",
                        title: "Thiếu lựa chọn",
                        text: "Mỗi câu trắc nghiệm phải có ít nhất 2 lựa chọn được điền!",
                    });
                    return;
                }
            }
            if (q.type == "arrange-words") {
                const filledWords = q.options.filter(opt => opt.trim() !== "");
                if (filledWords.length < 3) {
                    Swal.fire({
                    icon: "warning",
                    title: "Thiếu từ",
                    text: "Câu hỏi sắp xếp cần ít nhất 3 từ/cụm từ!",
                    });
                    return;
                }
            }
        }
        const dataToSubmit = {
            title: formData.title,
            questions: formData.questions,
            gateId: formData.gate,
        };
        onSubmit(dataToSubmit, initialData._id);
    };

    const availableTypes = [
        { value: "multiple-choice", label: "Trắc nghiệm" },
        { value: "fill-in-the-blank", label: "Điền vào chỗ trống" },
        { value: "arrange-words", label: "Sắp xếp từ thành câu" },
        { value: "translation", label: "Dịch nghĩa" }
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
                <div id="admin-exercise-update-questions" className="mt-3">
                    {formData.questions.map((q, index) => (
                        <div key={index} className="admin-exercise-update-question">
                            <div className="admin-exercise-update-question-header">
                                <h5>
                                    Câu hỏi {index + 1} (
                                    {{
                                        "multiple-choice": "Trắc nghiệm",
                                        "fill-in-the-blank": "Điền vào chỗ trống",
                                        "arrange-words": "Sắp xếp từ thành câu",
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
                            {(q.type === "arrange-words" || q.type === "multiple-choice") && (
                                <div className="admin-exercise-add-group">
                                    <label>{q.type === "arrange-words" ? "Các từ/cụm từ cần sắp xếp (mỗi ô là 1 từ/cụm):" : "Lựa chọn:"}</label>
                                    {q.options.map((opt, oIndex) => (
                                        <div key={oIndex} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                                            <input
                                                type="text"
                                                placeholder={q.type === "arrange-words" ? `Từ/cụm ${oIndex + 1}` : `Lựa chọn ${oIndex + 1}`}
                                                value={opt}
                                                onChange={(e) => handleOptionChange(index, oIndex, e.target.value)}
                                                className="form-control"
                                                style={{ flex: 1 }}
                                            />
                                            {q.type === "arrange-words" && oIndex > 1 && (
                                                <button
                                                    type="button"
                                                    className="admin-exercise-update-btn-delete-words"
                                                    onClick={async () => {
                                                        const result = await Swal.fire({
                                                            title: "Xóa từ này?",
                                                            text: `Bạn có muốn xóa từ: "${opt || `(trống)`}" không?`,
                                                            icon: "warning",
                                                            showCancelButton: true,
                                                            confirmButtonText: "Xóa",
                                                            cancelButtonText: "Hủy",
                                                        });
                                                        if (result.isConfirmed) {
                                                            const updated = [...formData.questions];
                                                            updated[index].options = updated[index].options.filter((_, i) => i !== oIndex);
                                                            setFormData(prev => ({ ...prev, questions: updated }));
                                                            Swal.fire({
                                                                icon: "success",
                                                                title: "Đã xóa!",
                                                                text: "Từ đã được xóa thành công.",
                                                                timer: 1500,
                                                                showConfirmButton: false,
                                                            });
                                                        }
                                                    }}
                                                    title="Xóa từ này"
                                                >
                                                    Xóa
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {q.type === "arrange-words" && (
                                        <button
                                            type="button"
                                            className="admin-exercise-update-btn-words"
                                            onClick={() => {
                                                const updated = [...formData.questions];
                                                updated[index].options.push("");
                                                setFormData(prev => ({ ...prev, questions: updated }));
                                            }}
                                        >
                                            + Thêm từ
                                        </button>
                                    )}
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
                    <i className="fas fa-arrow-left"></i> Quay lại
                </button>
            </form>
        </div>
    );
};

export default UpdateStage;