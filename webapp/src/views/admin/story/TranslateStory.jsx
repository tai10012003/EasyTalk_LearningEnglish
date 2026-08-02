import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { StoryService } from "@/services/StoryService.jsx";
import { EnglishTranslationService } from "@/services/EnglishTranslationService.jsx";

const emptyFields = {
    title: "",
    description: "",
    category: "",
    content: ""
};

const formatJson = (value) => {
    if (!value) return "";
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return "";
    }
};

const buildEnglishContentTemplate = (content = []) => {
    return content.map((sentence) => ({
        ...sentence,
        vi: sentence.en || sentence.vi
    }));
};

function TranslateStory() {
    const { id } = useParams();
    const [story, setStory] = useState(null);
    const [fields, setFields] = useState(emptyFields);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [storyData, translation] = await Promise.all([
                    StoryService.getStory(id),
                    EnglishTranslationService.getTranslation("story", id)
                ]);
                const translationFields = translation?.fields || {};
                setStory(storyData);
                setFields({
                    title: translationFields.title || "",
                    description: translationFields.description || "",
                    category: translationFields.category || "",
                    content: translationFields.content
                        ? formatJson(translationFields.content)
                        : formatJson(buildEnglishContentTemplate(storyData?.content || []))
                });
            } catch (error) {
                console.error("Error loading story translation:", error);
                Swal.fire("Thất bại!", "Không thể tải dữ liệu dịch câu chuyện.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const originalContent = useMemo(() => formatJson(story?.content), [story]);

    const handleFieldChange = (name, value) => {
        setFields((prev) => ({ ...prev, [name]: value }));
    };

    const buildPayloadFields = () => {
        const payloadFields = {
            title: fields.title.trim(),
            description: fields.description.trim(),
            category: fields.category.trim()
        };
        Object.keys(payloadFields).forEach((key) => {
            if (!payloadFields[key]) delete payloadFields[key];
        });
        if (fields.content.trim()) {
            payloadFields.content = JSON.parse(fields.content);
        }
        return payloadFields;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payloadFields = buildPayloadFields();
            await EnglishTranslationService.saveTranslation("story", id, {
                sourceSlug: story?.slug || "",
                fields: payloadFields
            });
            Swal.fire("Thành công!", "Bản dịch tiếng Anh đã được lưu.", "success");
        } catch (error) {
            console.error("Error saving story translation:", error);
            Swal.fire("Thất bại!", "Không thể lưu bản dịch. Vui lòng kiểm tra JSON content.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: "Xóa bản dịch?",
            text: "Bản dịch tiếng Anh của câu chuyện này sẽ bị xóa.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy"
        });
        if (!result.isConfirmed) return;
        try {
            await EnglishTranslationService.deleteTranslation("story", id);
            setFields({
                ...emptyFields,
                content: formatJson(buildEnglishContentTemplate(story?.content || []))
            });
            Swal.fire("Thành công!", "Đã xóa bản dịch tiếng Anh.", "success");
        } catch (error) {
            console.error("Error deleting story translation:", error);
            Swal.fire("Thất bại!", "Không thể xóa bản dịch.", "error");
        }
    };

    if (loading) return <p>Đang tải dữ liệu...</p>;
    if (!story) return <p>Không tìm thấy bài học câu chuyện.</p>;

    return (
        <div className="admin-translation-page">
            <div className="admin-translation-header">
                <div>
                    <h1>DỊCH TIẾNG ANH BÀI HỌC CÂU CHUYỆN</h1>
                    <p>Quản lý bản dịch riêng trong collection englishtranslations.</p>
                </div>
                <a href="/admin/story" className="admin-translation-back">Quay lại</a>
            </div>

            <div className="admin-translation-grid">
                <section className="admin-translation-panel">
                    <h3>Nội dung gốc</h3>
                    <label>Tiêu đề</label>
                    <div className="admin-translation-preview">{story.title}</div>
                    <label>Mô tả</label>
                    <div className="admin-translation-preview">{story.description}</div>
                    <label>Loại câu chuyện</label>
                    <div className="admin-translation-preview">{story.category}</div>
                    <label>Content JSON</label>
                    <pre className="admin-translation-preview json">{originalContent}</pre>
                </section>

                <section className="admin-translation-panel">
                    <h3>Bản dịch tiếng Anh</h3>
                    <label htmlFor="translation-title">Title</label>
                    <input
                        id="translation-title"
                        value={fields.title}
                        onChange={(e) => handleFieldChange("title", e.target.value)}
                        placeholder={story.title}
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
                        placeholder={story.category}
                    />
                    <label htmlFor="translation-content">Content JSON</label>
                    <textarea
                        id="translation-content"
                        value={fields.content}
                        onChange={(e) => handleFieldChange("content", e.target.value)}
                        rows={16}
                        placeholder={formatJson(buildEnglishContentTemplate(story.content || []))}
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

export default TranslateStory;
