import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UpdateLesson from "../../../components/admin/lesson/UpdateLesson";
import { PronunciationService } from "@/services/PronunciationService.jsx";
import Swal from "sweetalert2";

const UpdatePronunciation = () => {
    const { id } = useParams();
    const [pronunciation, setPronunciation] = useState(null);

    useEffect(() => {
        const fetchPronunciation = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${import.meta.env.VITE_API_URL}/pronunciation/api/${id}`, {
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
            const res = await PronunciationService.updatePronunciation(id, formData);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Bài học phát âm đã được cập nhật thành công!',
            });
            window.location.href = "/admin/pronunciation";
            return res;
        } catch (err) {
            console.error("Error adding pronunciation:", err);
            await Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra khi cập nhật bài học phát âm!',
            });
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