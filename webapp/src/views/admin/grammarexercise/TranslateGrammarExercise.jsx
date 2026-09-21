import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { GrammarExerciseService } from "@/services/GrammarExerciseService.jsx";
import { EnglishTranslationService } from "@/services/EnglishTranslationService.jsx";

const emptyFields = {
    title: "",
    questions: ""
};

const formatJson = (value) => {
    if (!value) return "";
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return "";
    }
};

function TranslateGrammarExercise() {
    const { id } = useParams();
    const [grammarExercise, setGrammarExercise] = useState(null);
    const [fields, setFields] = useState(emptyFields);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [exerciseData, translation] = await Promise.all([
                    GrammarExerciseService.getGrammarExerciseAdmin(id),
                    EnglishTranslationService.getTranslation("grammarExercise", id)
                ]);
                const originalExercise = exerciseData?.data || exerciseData;
                const translationFields = translation?.fields || {};
                setGrammarExercise(originalExercise);
                setFields({
                    title: translationFields.title || "",
                    questions: translationFields.questions ? formatJson(translationFields.questions) : ""
                });
            } catch (error) {
                console.error("Error loading grammar exercise translation:", error);
                Swal.fire("Thất bại!", "Không thể tải dữ liệu dịch bài luyện tập ngữ pháp.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const originalQuestions = useMemo(() => formatJson(grammarExercise?.questions), [grammarExercise]);

    const handleFieldChange = (name, value) => {
        setFields((prev) => ({ ...prev, [name]: value }));
    };

    const buildPayloadFields = () => {
        const payloadFields = {
            title: fields.title.trim()
        };
        if (!payloadFields.title) delete payloadFields.title;
        if (fields.questions.trim()) {
            payloadFields.questions = JSON.parse(fields.questions);
        }
        return payloadFields;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payloadFields = buildPayloadFields();
            await EnglishTranslationService.saveTranslation("grammarExercise", id, {
                sourceSlug: grammarExercise?.slug || "",
                fields: payloadFields
            });
            Swal.fire("Thành công!", "Bản dịch tiếng Anh đã được lưu.", "success");
        } catch (error) {
            console.error("Error saving grammar exercise translation:", error);
            Swal.fire("Thất bại!", "Không thể lưu bản dịch. Vui lòng kiểm tra JSON questions nếu có.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: "Xóa bản dịch?",
            text: "Bản dịch tiếng Anh của bài luyện tập này sẽ bị xóa.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy"
        });
        if (!result.isConfirmed) return;
        try {
            await EnglishTranslationService.deleteTranslation("grammarExercise", id);
            setFields(emptyFields);
            Swal.fire("Thành công!", "Đã xóa bản dịch tiếng Anh.", "success");
        } catch (error) {
            console.error("Error deleting grammar exercise translation:", error);
            Swal.fire("Thất bại!", "Không thể xóa bản dịch.", "error");
        }
    };

    if (loading) return <p>Đang tải dữ liệu...</p>;
    if (!grammarExercise) return <p>Không tìm thấy bài luyện tập ngữ pháp.</p>;

    return (
        <div className="admin-translation-page">
            <div className="admin-translation-header">
                <div>
                    <h1>DỊCH TIẾNG ANH BÀI LUYỆN TẬP NGỮ PHÁP</h1>
                    <p>Quản lý bản dịch riêng trong collection englishtranslations.</p>
                </div>
                <a href="/admin/grammar-exercise" className="admin-translation-back">Quay lại</a>
            </div>

            <div className="admin-translation-grid">
                <section className="admin-translation-panel">
                    <h3>Nội dung gốc tiếng Việt</h3>
                    <label>Tiêu đề</label>
                    <div className="admin-translation-preview">{grammarExercise.title}</div>
                    <label>Questions</label>
                    <pre className="admin-translation-preview json">{originalQuestions}</pre>
                </section>

                <section className="admin-translation-panel">
                    <h3>Bản dịch tiếng Anh</h3>
                    <label htmlFor="translation-title">Title</label>
                    <input
                        id="translation-title"
                        value={fields.title}
                        onChange={(e) => handleFieldChange("title", e.target.value)}
                        placeholder="Grammar Exercise Set 1"
                    />
                    <label htmlFor="translation-questions">Questions JSON</label>
                    <textarea
                        id="translation-questions"
                        value={fields.questions}
                        onChange={(e) => handleFieldChange("questions", e.target.value)}
                        rows={18}
                        placeholder={originalQuestions}
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

export default TranslateGrammarExercise;
