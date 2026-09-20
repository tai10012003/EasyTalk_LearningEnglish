import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { GateService } from "@/services/GateService.jsx";
import { EnglishTranslationService } from "@/services/EnglishTranslationService.jsx";

function TranslateGate() {
    const { id } = useParams();
    const [gate, setGate] = useState(null);
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [gateData, translation] = await Promise.all([
                    GateService.fetchGate(1, 1000),
                    EnglishTranslationService.getTranslation("gate", id)
                ]);
                const originalGate = (gateData.gates || []).find((item) => item._id === id);
                setGate(originalGate || null);
                setTitle(translation?.fields?.title || "");
            } catch (error) {
                console.error("Error loading gate translation:", error);
                Swal.fire("Thất bại!", "Không thể tải dữ liệu dịch cổng.", "error");
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
            await EnglishTranslationService.saveTranslation("gate", id, {
                sourceSlug: `gate:${id}`,
                fields
            });
            Swal.fire("Thành công!", "Bản dịch tiếng Anh đã được lưu.", "success");
        } catch (error) {
            console.error("Error saving gate translation:", error);
            Swal.fire("Thất bại!", "Không thể lưu bản dịch.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: "Xóa bản dịch?",
            text: "Bản dịch tiếng Anh của cổng này sẽ bị xóa.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy"
        });
        if (!result.isConfirmed) return;
        try {
            await EnglishTranslationService.deleteTranslation("gate", id);
            setTitle("");
            Swal.fire("Thành công!", "Đã xóa bản dịch tiếng Anh.", "success");
        } catch (error) {
            console.error("Error deleting gate translation:", error);
            Swal.fire("Thất bại!", "Không thể xóa bản dịch.", "error");
        }
    };

    if (loading) return <p>Đang tải dữ liệu...</p>;
    if (!gate) return <p>Không tìm thấy cổng.</p>;

    return (
        <div className="admin-translation-page">
            <div className="admin-translation-header">
                <div>
                    <h1>DỊCH TIẾNG ANH CỔNG HỌC TẬP</h1>
                    <p>Quản lý bản dịch riêng trong collection englishtranslations.</p>
                </div>
                <a href="/admin/gate" className="admin-translation-back">Quay lại</a>
            </div>

            <div className="admin-translation-grid">
                <section className="admin-translation-panel">
                    <h3>Nội dung gốc tiếng Việt</h3>
                    <label>Tiêu đề</label>
                    <div className="admin-translation-preview">{gate.title}</div>
                    <label>Hành trình</label>
                    <div className="admin-translation-preview">{gate.journeyInfo?.title || ""}</div>
                </section>

                <section className="admin-translation-panel">
                    <h3>Bản dịch tiếng Anh</h3>
                    <label htmlFor="translation-title">Title</label>
                    <input
                        id="translation-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Gate 1"
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

export default TranslateGate;
