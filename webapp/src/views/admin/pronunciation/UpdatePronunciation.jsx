import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UpdateLesson from "../../../components/admin/lesson/UpdateLesson";
import { PronunciationService } from "@/services/PronunciationService.jsx";

const UpdatePronunciation = () => {
    const { id } = useParams();
    const [pronunciation, setPronunciation] = useState(null);

    useEffect(() => {
        const fetchPronunciation = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/pronunciation/api/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setPronunciation(data);
            } catch (err) {
                console.error("Error fetching pronunciation:", err);
            }
        };
        fetchPronunciation();
    },  [id]);

    const handleSubmit = async (formData, id) => {
        try {
            await PronunciationService.updatePronunciation(id, formData);
            alert("Cập nhật bài học phát âm thành công!");
            window.location.href = "/admin/pronunciation";
        } catch (err) {
            console.error("Error updating pronunciation:", err);
            alert("Có lỗi khi cập nhật!");
        }
    };

    if (!pronunciation) return <p>Đang tải dữ liệu...</p>;

    return (
        <UpdateLesson
            title="CẬP NHẬT BÀI HỌC PHÁT ÂM"
            onSubmit={handleSubmit}
            returnUrl="/admin/pronunciation"
            initialData={pronunciation}
        />
    );
};

export default UpdatePronunciation;