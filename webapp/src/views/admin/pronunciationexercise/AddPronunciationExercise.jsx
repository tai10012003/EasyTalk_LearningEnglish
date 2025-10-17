import React from "react";
import AddExercise from "../../../components/admin/exercise/AddExercise";
import { PronunciationExerciseService } from "@/services/PronunciationExerciseService.jsx";
import Swal from "sweetalert2";

const AddPronunciationExercise = () => {
    const handleSubmit = async (data) => {
        try {
            const res = await await PronunciationExerciseService.addPronunciationExercise(data);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Bài luyện tập phát âm đã được thêm thành công!',
            });
            window.location.href = "/admin/pronunciation-exercise";
            return res;
        } catch (err) {
            console.error("Error adding pronunciation:", err);
            await Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra khi thêm bài luyện tập phát âm!',
            });
        }
    };
    
    return <AddExercise onSubmit={handleSubmit} returnUrl="/admin/pronunciation-exercise" title="THÊM BÀI LUYỆN TẬP PHÁT ÂM" isPronunciationPage={true} />;
};

export default AddPronunciationExercise;