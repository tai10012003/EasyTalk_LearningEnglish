import React, { useState, useEffect } from "react";
import AddExercise from "../../../components/admin/exercise/AddExercise";
import { VocabularyExerciseService } from "@/services/VocabularyExerciseService.jsx";
import Swal from "sweetalert2";

const AddVocabularyExercise = () => {
    const [existingVocabularyExercises, setExistingVocabularyExercises] = useState([]);
    
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

    const handleSubmit = async (data) => {
        try {
            const res = await VocabularyExerciseService.addVocabularyExercise(data);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Bài luyện tập từ vựng đã được thêm thành công!',
            });
            window.location.href = "/admin/vocabulary-exercise";
            return res;
        } catch (err) {
            console.error("Error adding vocabulary:", err);
            await Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra khi thêm bài luyện tập từ vựng!',
            });
        }
    };
    
    return <AddExercise onSubmit={handleSubmit} returnUrl="/admin/vocabulary-exercise" title="THÊM BÀI LUYỆN TẬP TỪ VỰNG" existingItems={existingVocabularyExercises} />;
};

export default AddVocabularyExercise;