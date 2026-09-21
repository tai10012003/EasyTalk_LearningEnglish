import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { StageService } from "@/services/StageService.jsx";
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

function TranslateStage() {
    const { id } = useParams();
    const [stage, setStage] = useState(null);
    const [fields, setFields] = useState(emptyFields);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [stageData, translation] = await Promise.all([
                    StageService.getStage(id, { includeLanguage: false }),
                    EnglishTranslationService.getTranslation("stage", id)
                ]);
                const originalStage = stageData?.stage || stageData;
                const translationFields = translation?.fields || {};
                setStage(originalStage);
                setFields({
                    title: translationFields.title || "",
                    questions: translationFields.questions ? formatJson(translationFields.questions) : ""
                });
            } catch (error) {
                console.error("Error loading stage translation:", error);
                Swal.fire("Thất bại!", "Không thể tải dữ liệu dịch chặng.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const originalQuestions = useMemo(() => formatJson(stage?.questions), [stage]);

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
            await EnglishTranslationService.saveTranslation("stage", id, {
                sourceSlug: `stage:${id}`,
                fields: payloadFields
            });
            Swal.fire("Thành công!", "Bản dịch tiếng Anh đã được lưu.", "success");
        } catch (error) {
            console.error("Error saving stage translation:", error);
            Swal.fire("Thất bại!", "Không thể lưu bản dịch. Vui lòng kiểm tra JSON questions nếu có.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: "Xóa bản dịch?",
            text: "Bản dịch tiếng Anh của chặng này sẽ bị xóa.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy"
        });
        if (!result.isConfirmed) return;
        try {
            await EnglishTranslationService.deleteTranslation("stage", id);
            setFields(emptyFields);
            Swal.fire("Thành công!", "Đã xóa bản dịch tiếng Anh.", "success");
        } catch (error) {
            console.error("Error deleting stage translation:", error);
            Swal.fire("Thất bại!", "Không thể xóa bản dịch.", "error");
        }
    };

    if (loading) return <p>Đang tải dữ liệu...</p>;
    if (!stage) return <p>Không tìm thấy chặng.</p>;

    return (
        <div className="admin-translation-page">
            <div className="admin-translation-header">
                <div>
                    <h1>DỊCH TIẾNG ANH CHẶNG HỌC TẬP</h1>
                    <p>Quản lý bản dịch riêng trong collection englishtranslations.</p>
                </div>
                <a href="/admin/stage" className="admin-translation-back">Quay lại</a>
            </div>

            <div className="admin-translation-grid">
                <section className="admin-translation-panel">
                    <h3>Nội dung gốc tiếng Việt</h3>
                    <label>Tiêu đề</label>
                    <div className="admin-translation-preview">{stage.title}</div>
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
                        placeholder="Stage 1"
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

export default TranslateStage;
