import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UpdateExercise from "../../../components/admin/exercise/UpdateExercise";
import { GrammarExerciseService } from "@/services/GrammarExerciseService.jsx";
import { AuthService } from "@/services/AuthService.jsx";
import Swal from "sweetalert2";

const UpdateGrammarExercise = () => {
    const { id } = useParams();
    const [grammarexercise, setGrammarExercise] = useState(null);

    useEffect(() => {
        const fetchGrammarExercise = async () => {
            try {
                const res = await AuthService.fetchWithAuth(`${import.meta.env.VITE_API_URL}/grammar-exercise/api/${id}`, {
                    method: "GET",
                });
                const data = await res.json();
                setGrammarExercise(data);
            } catch (err) {
                console.error("Error fetching grammar exercise", err);
            }
        };
        fetchGrammarExercise();
    },  [id]);

    const handleSubmit = async (formData, id) => {
        try {
            await GrammarExerciseService.updateGrammarExercise(id, formData);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Bài luyện tập ngữ pháp đã được cập nhật thành công!',
            });
            window.location.href = "/admin/grammar-exercise";
        } catch (err) {
            console.error("Error updating grammar exercise:", err);
            await Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra khi cập nhật bài luyện tập ngữ pháp!',
            });
        }
    };

    if (!grammarexercise) return <p>Đang tải dữ liệu...</p>;

    return (
        <UpdateExercise
            title="CẬP NHẬT BÀI LUYỆN TẬP NGỮ PHÁP"
            onSubmit={handleSubmit}
            returnUrl="/admin/grammar-exercise"
            initialData={grammarexercise}
        />
    );
};

export default UpdateGrammarExercise;