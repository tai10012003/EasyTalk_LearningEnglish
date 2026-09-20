import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { JourneyService } from "@/services/JourneyService.jsx";
import { EnglishTranslationService } from "@/services/EnglishTranslationService.jsx";

function TranslateJourney() {
    const { id } = useParams();
    const [journey, setJourney] = useState(null);
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [journeyData, translation] = await Promise.all([
                    JourneyService.fetchJourneyAdmin(1, 1000),
                    EnglishTranslationService.getTranslation("journey", id)
                ]);
                const originalJourney = (journeyData.journeys || []).find((item) => item._id === id);
                setJourney(originalJourney || null);
                setTitle(translation?.fields?.title || "");
            } catch (error) {
                console.error("Error loading journey translation:", error);
                Swal.fire("Thất bại!", "Không thể tải dữ liệu dịch hành trình.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const fields = {};
            if (title.trim()) fields.title = title.trim();
            await EnglishTranslationService.saveTranslation("journey", id, {
                sourceSlug: `journey:${id}`,
                fields
            });
            Swal.fire("Thành công!", "Bản dịch tiếng Anh đã được lưu.", "success");
        } catch (error) {
            console.error("Error saving journey translation:", error);
            Swal.fire("Thất bại!", "Không thể lưu bản dịch.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: "Xóa bản dịch?",
            text: "Bản dịch tiếng Anh của hành trình này sẽ bị xóa.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy"
        });
        if (!result.isConfirmed) return;
        try {
            await EnglishTranslationService.deleteTranslation("journey", id);
            setTitle("");
            Swal.fire("Thành công!", "Đã xóa bản dịch tiếng Anh.", "success");
        } catch (error) {
            console.error("Error deleting journey translation:", error);
            Swal.fire("Thất bại!", "Không thể xóa bản dịch.", "error");
        }
    };

    if (loading) return <p>Đang tải dữ liệu...</p>;
    if (!journey) return <p>Không tìm thấy hành trình.</p>;

    return (
        <div className="admin-translation-page">
            <div className="admin-translation-header">
                <div>
                    <h1>DỊCH TIẾNG ANH HÀNH TRÌNH</h1>
                    <p>Quản lý bản dịch riêng trong collection englishtranslations.</p>
                </div>
                <a href="/admin/journey" className="admin-translation-back">Quay lại</a>
            </div>

            <div className="admin-translation-grid">
                <section className="admin-translation-panel">
                    <h3>Nội dung gốc tiếng Việt</h3>
                    <label>Tiêu đề</label>
                    <div className="admin-translation-preview">{journey.title}</div>
                </section>

                <section className="admin-translation-panel">
                    <h3>Bản dịch tiếng Anh</h3>
                    <label htmlFor="translation-title">Title</label>
                    <input
                        id="translation-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Beginner"
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

export default TranslateJourney;
