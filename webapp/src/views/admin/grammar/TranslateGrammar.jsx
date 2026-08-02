import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { GrammarService } from "@/services/GrammarService.jsx";
import { EnglishTranslationService } from "@/services/EnglishTranslationService.jsx";

const emptyFields = {
    title: "",
    description: "",
    category: "",
    content: "",
    quizzes: ""
};

const formatJson = (value) => {
    if (!value) return "";
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return "";
    }
};

function TranslateGrammar() {
    const { id } = useParams();
    const [grammar, setGrammar] = useState(null);
    const [fields, setFields] = useState(emptyFields);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [grammarData, translation] = await Promise.all([
                    GrammarService.getGrammar(id),
                    EnglishTranslationService.getTranslation("grammar", id)
                ]);
                const translationFields = translation?.fields || {};
                setGrammar(grammarData);
                setFields({
                    title: translationFields.title || "",
                    description: translationFields.description || "",
                    category: translationFields.category || "",
                    content: translationFields.content || "",
                    quizzes: translationFields.quizzes ? formatJson(translationFields.quizzes) : ""
                });
            } catch (error) {
                console.error("Error loading grammar translation:", error);
                Swal.fire("Thất bại!", "Không thể tải dữ liệu dịch bài học.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const originalQuizzes = useMemo(() => formatJson(grammar?.quizzes), [grammar]);

    const handleFieldChange = (name, value) => {
        setFields((prev) => ({ ...prev, [name]: value }));
    };

    const buildPayloadFields = () => {
        const payloadFields = {
            title: fields.title.trim(),
            description: fields.description.trim(),
            category: fields.category.trim(),
            content: fields.content.trim()
        };
        Object.keys(payloadFields).forEach((key) => {
            if (!payloadFields[key]) delete payloadFields[key];
        });
        if (fields.quizzes.trim()) {
            payloadFields.quizzes = JSON.parse(fields.quizzes);
        }
        return payloadFields;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payloadFields = buildPayloadFields();
            await EnglishTranslationService.saveTranslation("grammar", id, {
                sourceSlug: grammar?.slug || "",
                fields: payloadFields
            });
            Swal.fire("Thành công!", "Bản dịch tiếng Anh đã được lưu.", "success");
        } catch (error) {
            console.error("Error saving grammar translation:", error);
            Swal.fire("Thất bại!", "Không thể lưu bản dịch. Vui lòng kiểm tra JSON quizzes nếu có.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: "Xóa bản dịch?",
            text: "Bản dịch tiếng Anh của bài học này sẽ bị xóa.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy"
        });
        if (!result.isConfirmed) return;
        try {
            await EnglishTranslationService.deleteTranslation("grammar", id);
            setFields(emptyFields);
            Swal.fire("Thành công!", "Đã xóa bản dịch tiếng Anh.", "success");
        } catch (error) {
            console.error("Error deleting grammar translation:", error);
            Swal.fire("Thất bại!", "Không thể xóa bản dịch.", "error");
        }
    };

    if (loading) return <p>Đang tải dữ liệu...</p>;
    if (!grammar) return <p>Không tìm thấy bài học ngữ pháp.</p>;

    return (
        <div className="admin-translation-page">
            <div className="admin-translation-header">
                <div>
                    <h1>DỊCH TIẾNG ANH BÀI HỌC NGỮ PHÁP</h1>
                    <p>Quản lý bản dịch riêng trong collection englishtranslations.</p>
                </div>
                <a href="/admin/grammar" className="admin-translation-back">Quay lại</a>
            </div>

            <div className="admin-translation-grid">
                <section className="admin-translation-panel">
                    <h3>Nội dung gốc tiếng Việt</h3>
                    <label>Tiêu đề</label>
                    <div className="admin-translation-preview">{grammar.title}</div>
                    <label>Mô tả</label>
                    <div className="admin-translation-preview">{grammar.description}</div>
                    <label>Danh mục</label>
                    <div className="admin-translation-preview">{grammar.category}</div>
                    <label>Nội dung</label>
                    <div className="admin-translation-preview multiline">{grammar.content}</div>
                    <label>Quizzes</label>
                    <pre className="admin-translation-preview json">{originalQuizzes}</pre>
                </section>

                <section className="admin-translation-panel">
                    <h3>Bản dịch tiếng Anh</h3>
                    <label htmlFor="translation-title">Title</label>
                    <input
                        id="translation-title"
                        value={fields.title}
                        onChange={(e) => handleFieldChange("title", e.target.value)}
                        placeholder="Present Simple Tense"
                    />
                    <label htmlFor="translation-description">Description</label>
                    <textarea
                        id="translation-description"
                        value={fields.description}
                        onChange={(e) => handleFieldChange("description", e.target.value)}
                        rows={4}
                        placeholder="Short English description..."
                    />
                    <label htmlFor="translation-category">Category</label>
                    <input
                        id="translation-category"
                        value={fields.category}
                        onChange={(e) => handleFieldChange("category", e.target.value)}
                        placeholder="Module 1: Foundations"
                    />
                    <label htmlFor="translation-content">Content</label>
                    <textarea
                        id="translation-content"
                        value={fields.content}
                        onChange={(e) => handleFieldChange("content", e.target.value)}
                        rows={10}
                        placeholder="English lesson content..."
                    />
                    <label htmlFor="translation-quizzes">Quizzes JSON</label>
                    <textarea
                        id="translation-quizzes"
                        value={fields.quizzes}
                        onChange={(e) => handleFieldChange("quizzes", e.target.value)}
                        rows={8}
                        placeholder={originalQuizzes}
                    />
                </section>
            </div>

            <div className="admin-translation-actions">
                <button type="button" className="admin-translation-delete" onClick={handleDelete}>
                    Xóa bản dịch
                </button>
                <button type="button" className="admin-translation-save" onClick={handleSave} disabled={saving}>
                    {saving ? "Đang lưu..." : "Lưu bản dịch EN"}
                </button>
            </div>
        </div>
    );
}

export default TranslateGrammar;
