import React, { useState, useEffect } from "react";
import AddExercise from "@/components/admin/exercise/AddExercise";
import { GrammarExerciseService } from "@/services/GrammarExerciseService.jsx";
import Swal from "sweetalert2";

const AddGrammarExercise = () => {
    const [existingGrammarExercises, setExistingGrammarExercises] = useState([]);
    
    useEffect(() => {
        const fetchGrammarExercises = async () => {
            try {
                const data = await GrammarExerciseService.fetchGrammarExercise(1, 10000);
                setExistingGrammarExercises(data.data || []);
            } catch (err) {
                console.error("Error fetching grammar exercises:", err);
            }
        };
        fetchGrammarExercises();
    }, []);

    const handleSubmit = async (data) => {
        try {
            const res = await GrammarExerciseService.addGrammarExercise(data);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Bài luyện tập ngữ pháp đã được thêm thành công!',
            });
            window.location.href = "/admin/grammar-exercise";
            return res;
        } catch (err) {
            console.error("Error adding grammar:", err);
            await Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra khi thêm bài luyện tập ngữ pháp!',
            });
        }
    };
    
    return <AddExercise onSubmit={handleSubmit} returnUrl="/admin/grammar-exercise" title="THÊM BÀI LUYỆN TẬP NGỮ PHÁP" existingItems={existingGrammarExercises} />;
};

export default AddGrammarExercise;