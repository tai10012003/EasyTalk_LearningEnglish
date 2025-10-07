import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UpdateDictation from "../../../components/admin/dictation/UpdateDictation";
import { DictationExerciseService } from "@/services/DictationExerciseService.jsx";

const UpdateDictationExercise = () => {
    const { id } = useParams();
    const [dictationexercise, setDictationExercise] = useState(null);

    useEffect(() => {
        const fetchDictationExercise = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/dictation-exercise/api/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
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
            alert("Cập nhật bài luyện tập nghe chép chính tả thành công!");
            window.location.href = "/admin/dictation-exercise";
        } catch (err) {
            console.error("Error updating dictation exercise:", err);
            alert("Có lỗi khi cập nhật!");
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