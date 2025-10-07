import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UpdateExercise from "../../../components/admin/exercise/UpdateExercise";
import { GrammarExerciseService } from "@/services/GrammarExerciseService.jsx";

const UpdateGrammarExercise = () => {
    const { id } = useParams();
    const [grammarexercise, setGrammarExercise] = useState(null);

    useEffect(() => {
        const fetchGrammarExercise = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/grammar-exercise/api/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
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
            alert("Cập nhật bài luyện tập ngữ pháp thành công!");
            window.location.href = "/admin/grammar-exercise";
        } catch (err) {
            console.error("Error updating grammar exercise:", err);
            alert("Có lỗi khi cập nhật!");
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