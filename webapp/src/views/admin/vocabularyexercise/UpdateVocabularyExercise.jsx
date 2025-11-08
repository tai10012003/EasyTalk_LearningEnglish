import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UpdateExercise from "@/components/admin/exercise/UpdateExercise";
import { VocabularyExerciseService } from "@/services/VocabularyExerciseService.jsx";
import { AuthService } from "@/services/AuthService.jsx";
import Swal from "sweetalert2";

const UpdateVocabularyExercise = () => {
    const { id } = useParams();
    const [vocabularyexercise, setVocabularyExercise] = useState(null);
    const [existingVocabularyExercises, setExistingVocabularyExercises] = useState([]);

    useEffect(() => {
        const fetchVocabularyExercise = async () => {
            try {
                const res = await AuthService.fetchWithAuth(`${import.meta.env.VITE_API_URL}/vocabulary-exercise/api/${id}`, {
                    method: "GET",
                });
                const data = await res.json();
                setVocabularyExercise(data);
            } catch (err) {
                console.error("Error fetching vocabulary exercise", err);
            }
        };
        fetchVocabularyExercise();
    },  [id]);

    useEffect(() => {
        const fetchVocabularyExercises = async () => {
            try {
                const data = await VocabularyExerciseService.fetchVocabularyExercise(1, 10000);
                setExistingVocabularyExercises(data.data || []);
            } catch (err) {
                console.error("Error fetching vocabulary exercises:", err);
            }
        };
        fetchVocabularyExercises();
    }, []);
    
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
            console.error("Error adding vocabulary:", err);
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
            existingItems={existingVocabularyExercises}
        />
    );
};

export default UpdateVocabularyExercise;