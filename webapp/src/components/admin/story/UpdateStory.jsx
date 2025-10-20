import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const UpdateStory = ({ onSubmit, title, returnUrl, initialData }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        level: "",
        category: "",
        image: null,
        content: [],
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || "",
                description: initialData.description || "",
                level: initialData.level || "",
                category: initialData.category || "",
                image: null,
                content: initialData.content || [],
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

    const handleAddContent = () => {
        const newContent = {
            en: "",
            vi: "",
            vocabulary: [],
            quiz: null,
        };
        setFormData((prev) => ({
            ...prev,
            content: [...prev.content, newContent],
        }));
    };

    const handleDeleteContent = (index) => {
        Swal.fire({
            title: "Xác nhận xóa?",
            text: "Bạn có chắc muốn xóa nội dung này không?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
        }).then((result) => {
            if (result.isConfirmed) {
                setFormData((prev) => ({
                    ...prev,
                    content: prev.content.filter((_, i) => i !== index),
                }));

                Swal.fire({
                    icon: "success",
                    title: "Đã xóa!",
                    text: "Nội dung đã được xóa thành công.",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
        });
    };

    const handleContentChange = (index, field, value) => {
        const updatedContent = [...formData.content];
        updatedContent[index][field] = value;
        setFormData((prev) => ({ ...prev, content: updatedContent }));
    };

    const handleAddVocabulary = (cIndex) => {
        const updatedContent = [...formData.content];
        updatedContent[cIndex].vocabulary.push("");
        setFormData((prev) => ({ ...prev, content: updatedContent }));
    };

    const handleDeleteVocabulary = (cIndex, vIndex) => {
        Swal.fire({
            title: "Xác nhận xóa?",
            text: "Bạn có chắc muốn xóa từ vựng này không?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
        }).then((result) => {
            if (result.isConfirmed) {
                const updatedContent = [...formData.content];
                updatedContent[cIndex].vocabulary.splice(vIndex, 1);
                setFormData((prev) => ({ ...prev, content: updatedContent }));
                Swal.fire({
                    icon: "success",
                    title: "Đã xóa!",
                    text: "Từ vựng đã được xóa thành công.",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
        });
    };

    const handleVocabularyChange = (cIndex, vIndex, value) => {
        const updatedContent = [...formData.content];
        updatedContent[cIndex].vocabulary[vIndex] = value;
        setFormData((prev) => ({ ...prev, content: updatedContent }));
    };

    const handleAddQuiz = (cIndex) => {
        const updatedContent = [...formData.content];
        if (updatedContent[cIndex].quiz) {
            Swal.fire({
                icon: "warning",
                title: "Thông báo",
                text: "Mỗi nội dung chỉ được phép có 1 quiz!",
            });
            return;
        }
        updatedContent[cIndex].quiz = {
            type: "",
            question: "",
            answer: "",
            explanation: "",
            options: [],
        };
        setFormData((prev) => ({ ...prev, content: updatedContent }));
    };

    const handleDeleteQuiz = (cIndex) => {
        Swal.fire({
            title: "Xác nhận xóa?",
            text: "Bạn có chắc muốn xóa quiz này không?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
        }).then((result) => {
            if (result.isConfirmed) {
                const updatedContent = [...formData.content];
                updatedContent[cIndex].quiz = null;
                setFormData((prev) => ({ ...prev, content: updatedContent }));
                Swal.fire({
                    icon: "success",
                    title: "Đã xóa!",
                    text: "Quiz đã được xóa thành công.",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
        });
    };

    const handleQuizChange = (cIndex, field, value) => {
        const updatedContent = [...formData.content];
        if (field == "type") {
            updatedContent[cIndex].quiz = {
                type: value,
                question: "",
                answer: "",
                explanation: "",
                options: value == "multiple-choice" ? ["", "", "", ""] : [],
            };
        } else {
            updatedContent[cIndex].quiz[field] = value;
        }
        setFormData((prev) => ({ ...prev, content: updatedContent }));
    };

    const handleQuizOptionChange = (cIndex, oIndex, value) => {
        const updatedContent = [...formData.content];
        updatedContent[cIndex].quiz.options[oIndex] = value;
        setFormData((prev) => ({ ...prev, content: updatedContent }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSubmit = new FormData();
        dataToSubmit.append("title", formData.title);
        dataToSubmit.append("description", formData.description);
        dataToSubmit.append("level", formData.level);
        dataToSubmit.append("category", formData.category);
        if (formData.image) {
            dataToSubmit.append("image", formData.image);
        }
        dataToSubmit.append("content", JSON.stringify(formData.content));
        onSubmit(dataToSubmit, initialData._id);
    };

    return (
        <div className="admin-story-update-container">
            <h1 className="admin-story-update-title">{title}</h1>
            <form className="admin-story-update-form" onSubmit={handleSubmit}>
                <div className="admin-story-update-group">
                    <label>Tiêu đề:</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="form-control"
                    />
                </div>
                <div className="admin-story-update-group">
                    <label>Mô tả:</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        className="form-control"
                    ></textarea>
                </div>
                <div className="admin-story-update-group">
                    <label>Cấp độ:</label>
                    <select
                        name="level"
                        value={formData.level}
                        onChange={handleChange}
                        required
                        className="form-select"
                    >
                        <option value="">-- Chọn cấp độ --</option>
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="B1">B1</option>
                        <option value="B2">B2</option>
                        <option value="C1">C1</option>
                        <option value="C2">C2</option>
                    </select>
                </div>
                <div className="admin-story-update-group">
                    <label>Loại câu chuyện:</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="form-select"
                    >
                        <option value="">-- Chọn Category --</option>
                        <option value="Daily Life">Daily Life</option>
                        <option value="Travel">Travel</option>
                        <option value="Adventure">Adventure</option>
                        <option value="Motivation">Motivation</option>
                    </select>
                </div>
                <div className="admin-story-update-group admin-story-update-image">
                    <label htmlFor="admin-update-story-image">Hình ảnh:</label>
                    <input
                        type="file"
                        id="admin-update-story-image"
                        name="image"
                        accept="image/*"
                        onChange={handleChange}
                    />
                    {initialData?.image && (
                        <div className="mt-2">
                            <small>Ảnh hiện tại:</small>
                            <br />
                            <img src={initialData.image} alt="current" width="150" />
                        </div>
                    )}
                </div>
                <div id="admin-story-add-contents">
                    {formData.content.map((c, cIndex) => (
                        <div key={cIndex} className="admin-story-content-block">
                            <div className="admin-story-content-header">
                                <h4>Nội dung {cIndex + 1}</h4>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteContent(cIndex)}
                                >
                                    Xóa nội dung
                                </button>
                            </div>
                            <div className="admin-story-update-group">
                                <label>English:</label>
                                <textarea
                                    value={c.en}
                                    onChange={(e) =>
                                        handleContentChange(cIndex, "en", e.target.value)
                                    }
                                    className="form-control"
                                    required
                                ></textarea>
                            </div>
                            <div className="admin-story-update-group">
                                <label>Tiếng Việt:</label>
                                <textarea
                                    value={c.vi}
                                    onChange={(e) =>
                                        handleContentChange(cIndex, "vi", e.target.value)
                                    }
                                    className="form-control"
                                    required
                                ></textarea>
                            </div>
                            <div className="admin-story-update-group">
                                <label>Từ vựng:</label>
                                {c.vocabulary.map((v, vIndex) => (
                                    <div key={vIndex} className="d-flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={v}
                                            onChange={(e) =>
                                                handleVocabularyChange(cIndex, vIndex, e.target.value)
                                            }
                                            placeholder={`Từ vựng ${vIndex + 1}`}
                                            className="form-control"
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDeleteVocabulary(cIndex, vIndex)}
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                ))}
                                {c.vocabulary.length < 5 ? (
                                    <button
                                        type="button"
                                        className="admin-story-add-btn-vocab"
                                        onClick={() => handleAddVocabulary(cIndex)}
                                    >
                                        + Thêm từ vựng
                                    </button>
                                ) : (
                                    <p className="admin-story-text-danger mt-2">
                                        Chỉ được thêm tối đa 5 từ vựng.
                                    </p>
                                )}
                            </div>
                            <div className="mt-3">
                                {c.quiz ? (
                                    <div className="admin-story-quiz-block">
                                        <div className="admin-story-quiz-header">
                                            <h5>Quiz</h5>
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm mb-2"
                                                onClick={() => handleDeleteQuiz(cIndex)}
                                            >
                                                Xóa Quiz
                                            </button>
                                        </div>    
                                        <div className="admin-story-update-group">
                                            <label>Loại bài tập:</label>
                                            <select
                                                value={c.quiz.type}
                                                onChange={(e) => handleQuizChange(cIndex, "type", e.target.value)}
                                                className="form-control"
                                                required
                                            >
                                                <option value="">Chọn loại</option>
                                                <option value="multiple-choice">Trắc nghiệm</option>
                                                <option value="fill-in-the-blank">Điền vào chỗ trống</option>
                                            </select>
                                        </div>
                                        {c.quiz.type && (
                                            <>
                                                <div className="admin-story-update-group">
                                                    <label>Câu hỏi:</label>
                                                    <input
                                                        type="text"
                                                        value={c.quiz.question}
                                                        onChange={(e) =>
                                                            handleQuizChange(cIndex, "question", e.target.value)
                                                        }
                                                        className="form-control"
                                                        required
                                                    />
                                                </div>
                                                {c.quiz.type == "multiple-choice" && (
                                                    <div className="admin-story-update-group">
                                                        <label>Lựa chọn:</label>
                                                        {c.quiz.options.map((opt, oIndex) => (
                                                            <input
                                                                key={oIndex}
                                                                type="text"
                                                                value={opt}
                                                                placeholder={`Lựa chọn ${oIndex + 1}`}
                                                                onChange={(e) =>
                                                                    handleQuizOptionChange(cIndex, oIndex, e.target.value)
                                                                }
                                                                className="form-control mb-2"
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="admin-story-update-group">
                                                    <label>Đáp án đúng:</label>
                                                    <input
                                                        type="text"
                                                        value={c.quiz.answer}
                                                        onChange={(e) =>
                                                            handleQuizChange(cIndex, "answer", e.target.value)
                                                        }
                                                        className="form-control"
                                                        required
                                                    />
                                                </div>
                                                <div className="admin-story-update-group">
                                                    <label>Giải thích:</label>
                                                    <textarea
                                                        value={c.quiz.explanation}
                                                        onChange={(e) =>
                                                            handleQuizChange(cIndex, "explanation", e.target.value)
                                                        }
                                                        className="form-control"
                                                        required
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="admin-story-add-btn-quiz"
                                        onClick={() => handleAddQuiz(cIndex)}
                                    >
                                        + Thêm Quiz
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    className="admin-story-add-btn-content mt-3"
                    onClick={handleAddContent}
                >
                    + Thêm nội dung
                </button>
                <button type="submit" className="btn btn-primary mt-3">
                    Lưu
                </button>
                <button
                    type="button"
                    className="btn btn-secondary mt-3"
                    onClick={() => navigate(returnUrl)}
                >
                    Quay lại
                </button>
            </form>
        </div>
    );
};

export default UpdateStory;