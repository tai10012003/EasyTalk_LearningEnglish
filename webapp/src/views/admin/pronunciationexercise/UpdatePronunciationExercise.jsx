import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UpdateExercise from "@/components/admin/exercise/UpdateExercise";
import { PronunciationExerciseService } from "@/services/PronunciationExerciseService.jsx";
import { AuthService } from "@/services/AuthService.jsx";
import Swal from "sweetalert2";

const UpdatePronunciationExercise = () => {
    const { id } = useParams();
    const [pronunciationexercise, setPronunciationExercise] = useState(null);
    const [existingPronunciationExercises, setExistingPronunciationExercises] = useState([]);

    useEffect(() => {
        const fetchPronunciationExercise = async () => {
            try {
                const res = await AuthService.fetchWithAuth(`${import.meta.env.VITE_API_URL}/pronunciation-exercise/api/${id}`, {
                    method: "GET",
                });
                const data = await res.json();
                setPronunciationExercise(data);
            } catch (err) {
                console.error("Error fetching pronunciation exercise", err);
            }
        };
        fetchPronunciationExercise();
    },  [id]);

    useEffect(() => {
        const fetchPronunciationExercises = async () => {
            try {
                const data = await PronunciationExerciseService.fetchPronunciationExercise(1, 10000);
                setExistingPronunciationExercises(data.data || []);
            } catch (err) {
                console.error("Error fetching pronunciation exercises:", err);
            }
        };
        fetchPronunciationExercises();
    }, []);

    const handleSubmit = async (formData, id) => {
        try {
            const res = await PronunciationExerciseService.updatePronunciationExercise(id, formData);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Bài luyện tập phát âm đã được cập nhật thành công!',
            });
            window.location.href = "/admin/pronunciation-exercise";
            return res;
        } catch (err) {
            console.error("Error adding pronunciation:", err);
            await Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra khi cập nhật bài luyện tập phát âm!',
            });
        }
    };

    if (!pronunciationexercise) return <p>Đang tải dữ liệu...</p>;

    return (
        <UpdateExercise
            title="CẬP NHẬT BÀI LUYỆN TẬP PHÁT ÂM"
            onSubmit={handleSubmit}
            returnUrl="/admin/pronunciation-exercise"
            initialData={pronunciationexercise}
            isPronunciationPage={true}
            existingItems={existingPronunciationExercises}
        />
    );
};

export default UpdatePronunciationExercise;