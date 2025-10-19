import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UpdateDictation from "../../../components/admin/dictation/UpdateDictation";
import { DictationExerciseService } from "@/services/DictationExerciseService.jsx";
import { AuthService } from "@/services/AuthService.jsx";
import Swal from "sweetalert2";

const UpdateDictationExercise = () => {
    const { id } = useParams();
    const [dictationexercise, setDictationExercise] = useState(null);

    useEffect(() => {
        const fetchDictationExercise = async () => {
            try {
                const res = await AuthService.fetchWithAuth(`${import.meta.env.VITE_API_URL}/dictation-exercise/api/${id}`, {
                    method: "GET",
                });
                const data = await res.json();
                setDictationExercise(data);
            } catch (err) {
                console.error("Error fetching dictation exercise", err);
            }
        };
        fetchDictationExercise();
    },  [id]);

    const handleSubmit = async (formData, id) => {
        try {
            await DictationExerciseService.updateDictationExercise(id, formData);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Bài luyện tập nghe chép chính tả đã được cập nhật thành công!',
            });
            window.location.href = "/admin/dictation-exercise";
        } catch (err) {
            console.error("Error updating dictation exercise:", err);
            await Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra khi cập nhật bài luyện tập nghe chép chính tả!',
            });
        }
    };

    if (!dictationexercise) return <p>Đang tải dữ liệu...</p>;

    return (
        <UpdateDictation
            title="CẬP NHẬT BÀI LUYỆN TẬP NGHE CHÉP CHÍNH TẢ"
            onSubmit={handleSubmit}
            returnUrl="/admin/dictation-exercise"
            initialData={dictationexercise}
        />
    );
};

export default UpdateDictationExercise;