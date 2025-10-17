import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UpdateExercise from "../../../components/admin/exercise/UpdateExercise";
import { VocabularyExerciseService } from "@/services/VocabularyExerciseService.jsx";
import Swal from "sweetalert2";

const UpdateVocabularyExercise = () => {
    const { id } = useParams();
    const [vocabularyexercise, setVocabularyExercise] = useState(null);

    useEffect(() => {
        const fetchVocabularyExercise = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${import.meta.env.VITE_API_URL}/vocabulary-exercise/api/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setVocabularyExercise(data);
            } catch (err) {
                console.error("Error fetching vocabulary exercise", err);
            }
        };
        fetchVocabularyExercise();
    },  [id]);
    
    const handleSubmit = async (formData, id) => {
        try {
            const res = await VocabularyExerciseService.updateVocabularyExercise(id, formData);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Cập nhật bài luyện tập từ vựng thành công!',
            });
            window.location.href = "/admin/vocabulary-exercise";
            return res;
        } catch (err) {
            console.error("Error adding pronunciation:", err);
            await Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra khi cập nhật bài luyện tập từ vựng!',
            });
        }
    };

    if (!vocabularyexercise) return <p>Đang tải dữ liệu...</p>;

    return (
        <UpdateExercise
            title="CẬP NHẬT BÀI LUYỆN TẬP TỪ VỰNG"
            onSubmit={handleSubmit}
            returnUrl="/admin/vocabulary-exercise"
            initialData={vocabularyexercise}
        />
    );
};

export default UpdateVocabularyExercise;