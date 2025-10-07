import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UpdateExercise from "../../../components/admin/exercise/UpdateExercise";
import { VocabularyExerciseService } from "@/services/VocabularyExerciseService.jsx";

const UpdateVocabularyExercise = () => {
    const { id } = useParams();
    const [vocabularyexercise, setVocabularyExercise] = useState(null);

    useEffect(() => {
        const fetchVocabularyExercise = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/vocabulary-exercise/api/${id}`, {
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
            await VocabularyExerciseService.updateVocabularyExercise(id, formData);
            alert("Cập nhật bài luyện tập từ vựng thành công!");
            window.location.href = "/admin/vocabulary-exercise";
        } catch (err) {
            console.error("Error updating vocabulary exercise:", err);
            alert("Có lỗi khi cập nhật!");
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