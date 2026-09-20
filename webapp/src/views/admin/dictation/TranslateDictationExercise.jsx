import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { DictationExerciseService } from "@/services/DictationExerciseService.jsx";
import { EnglishTranslationService } from "@/services/EnglishTranslationService.jsx";

const emptyFields = {
    title: "",
    description: "",
    content: ""
};

function TranslateDictationExercise() {
    const { id } = useParams();
    const [dictationExercise, setDictationExercise] = useState(null);
    const [fields, setFields] = useState(emptyFields);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [exerciseData, translation] = await Promise.all([
                    DictationExerciseService.getDictationExerciseAdmin(id),
                    EnglishTranslationService.getTranslation("dictationExercise", id)
                ]);
                const originalExercise = exerciseData?.data || exerciseData;
                const translationFields = translation?.fields || {};
                setDictationExercise(originalExercise);
                setFields({
                    title: translationFields.title || "",
                    description: translationFields.description || "",
                    content: translationFields.content || ""
                });
            } catch (error) {
                console.error("Error loading dictation exercise translation:", error);
                Swal.fire("Thất bại!", "Không thể tải dữ liệu dịch bài nghe chép chính tả.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleFieldChange = (name, value) => {
        setFields((prev) => ({ ...prev, [name]: value }));
    };

    const buildPayloadFields = () => {
        const payloadFields = {
            title: fields.title.trim(),
            description: fields.description.trim(),
            content: fields.content.trim()
        };
        Object.keys(payloadFields).forEach((key) => {
            if (!payloadFields[key]) delete payloadFields[key];
        });
        return payloadFields;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await EnglishTranslationService.saveTranslation("dictationExercise", id, {
                sourceSlug: dictationExercise?.slug || "",
                fields: buildPayloadFields()
            });
            Swal.fire("Thành công!", "Bản dịch tiếng Anh đã được lưu.", "success");
        } catch (error) {
            console.error("Error saving dictation exercise translation:", error);
            Swal.fire("Thất bại!", "Không thể lưu bản dịch.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: "Xóa bản dịch?",
            text: "Bản dịch tiếng Anh của bài nghe chép chính tả này sẽ bị xóa.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy"
        });
        if (!result.isConfirmed) return;
        try {
            await EnglishTranslationService.deleteTranslation("dictationExercise", id);
            setFields(emptyFields);
            Swal.fire("Thành công!", "Đã xóa bản dịch tiếng Anh.", "success");
        } catch (error) {
            console.error("Error deleting dictation exercise translation:", error);
            Swal.fire("Thất bại!", "Không thể xóa bản dịch.", "error");
        }
    };

    if (loading) return <p>Đang tải dữ liệu...</p>;
    if (!dictationExercise) return <p>Không tìm thấy bài nghe chép chính tả.</p>;

    return (
        <div className="admin-translation-page">
            <div className="admin-translation-header">
                <div>
                    <h1>DỊCH TIẾNG ANH BÀI NGHE CHÉP CHÍNH TẢ</h1>
                    <p>Quản lý bản dịch riêng trong collection englishtranslations.</p>
                </div>
                <a href="/admin/dictation-exercise" className="admin-translation-back">Quay lại</a>
            </div>

            <div className="admin-translation-grid">
                <section className="admin-translation-panel">
                    <h3>Nội dung gốc tiếng Việt</h3>
                    <label>Tiêu đề</label>
                    <div className="admin-translation-preview">{dictationExercise.title}</div>
                    <label>Mô tả</label>
                    <div className="admin-translation-preview">{dictationExercise.description}</div>
                    <label>Content</label>
                    <pre className="admin-translation-preview json">{dictationExercise.content}</pre>
                </section>

                <section className="admin-translation-panel">
                    <h3>Bản dịch tiếng Anh</h3>
                    <label htmlFor="translation-title">Title</label>
                    <input
                        id="translation-title"
                        value={fields.title}
                        onChange={(e) => handleFieldChange("title", e.target.value)}
                        placeholder="At Home"
                    />
                    <label htmlFor="translation-description">Description</label>
                    <input
                        id="translation-description"
                        value={fields.description}
                        onChange={(e) => handleFieldChange("description", e.target.value)}
                        placeholder="A useful listening dictation lesson"
                    />
                    <label htmlFor="translation-content">Content</label>
                    <textarea
                        id="translation-content"
                        value={fields.content}
                        onChange={(e) => handleFieldChange("content", e.target.value)}
                        rows={12}
                        placeholder={dictationExercise.content}
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

export default TranslateDictationExercise;
