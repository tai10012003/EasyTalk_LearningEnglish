import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { PrizeService } from "@/services/PrizeService.jsx";
import { EnglishTranslationService } from "@/services/EnglishTranslationService.jsx";

function TranslatePrize() {
    const { id } = useParams();
    const [prize, setPrize] = useState(null);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [prizeData, translation] = await Promise.all([
                    PrizeService.getPrizeById(id, { includeLanguage: false }),
                    EnglishTranslationService.getTranslation("prize", id)
                ]);
                setPrize(prizeData?.prize || prizeData);
                setName(translation?.fields?.name || "");
            } catch (error) {
                console.error("Error loading prize translation:", error);
                Swal.fire("Thất bại!", "Không thể tải dữ liệu dịch phần thưởng.", "error");
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
            if (name.trim()) fields.name = name.trim();
            await EnglishTranslationService.saveTranslation("prize", id, {
                sourceSlug: `prize:${id}`,
                fields
            });
            Swal.fire("Thành công!", "Bản dịch tiếng Anh đã được lưu.", "success");
        } catch (error) {
            console.error("Error saving prize translation:", error);
            Swal.fire("Thất bại!", "Không thể lưu bản dịch.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: "Xóa bản dịch?",
            text: "Bản dịch tiếng Anh của phần thưởng này sẽ bị xóa.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy"
        });
        if (!result.isConfirmed) return;
        try {
            await EnglishTranslationService.deleteTranslation("prize", id);
            setName("");
            Swal.fire("Thành công!", "Đã xóa bản dịch tiếng Anh.", "success");
        } catch (error) {
            console.error("Error deleting prize translation:", error);
            Swal.fire("Thất bại!", "Không thể xóa bản dịch.", "error");
        }
    };

    if (loading) return <p>Đang tải dữ liệu...</p>;
    if (!prize) return <p>Không tìm thấy phần thưởng.</p>;

    return (
        <div className="admin-translation-page">
            <div className="admin-translation-header">
                <div>
                    <h1>DỊCH TIẾNG ANH PHẦN THƯỞNG</h1>
                    <p>Quản lý bản dịch riêng trong collection englishtranslations.</p>
                </div>
                <a href="/admin/prize" className="admin-translation-back">Quay lại</a>
            </div>

            <div className="admin-translation-grid">
                <section className="admin-translation-panel">
                    <h3>Nội dung gốc tiếng Việt</h3>
                    <label>Mã</label>
                    <div className="admin-translation-preview">{prize.code}</div>
                    <label>Tên phần thưởng</label>
                    <div className="admin-translation-preview">{prize.name}</div>
                    <label>Loại</label>
                    <div className="admin-translation-preview">{prize.type}</div>
                    <label>Cấp độ</label>
                    <div className="admin-translation-preview">{prize.level}</div>
                </section>

                <section className="admin-translation-panel">
                    <h3>Bản dịch tiếng Anh</h3>
                    <label htmlFor="translation-name">Name</label>
                    <input
                        id="translation-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Knowledge God Level 1"
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

export default TranslatePrize;
