import React, { useState, useEffect } from "react";
import AddDictation from "../../../components/admin/dictation/AddDictation";
import { DictationExerciseService } from "@/services/DictationExerciseService.jsx";
import Swal from "sweetalert2";

const AddDictationExercise = () => {
    const [existingDictations, setExistingDictations] = useState([]);

    useEffect(() => {
        const fetchDictations = async () => {
            try {
                const data = await DictationExerciseService.fetchDictationExercise(1, 10000);
                setExistingDictations(data.dictationExercises || []);
            } catch (err) {
                console.error("Error fetching dictation:", err);
            }
        };
        fetchDictations();
    }, []);

    const handleSubmit = async (data) => {
        try {
            const res = await DictationExerciseService.addDictationExercise(data);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Bài luyện tập nghe chép chính tả đã được thêm thành công!',
            });
            window.location.href = "/admin/dictation-exercise";
            return res;
        } catch (err) {
            console.error("Error adding dictation:", err);
            await Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra khi thêm bài luyện tập nghe chép chính tả!',
            });
        }
    };
    return <AddDictation onSubmit={handleSubmit} returnUrl="/admin/dictation-exercise" title="THÊM BÀI LUYỆN TẬP NGHE CHÉP CHÍNH TẢ" existingItems={existingDictations} />;
};

export default AddDictationExercise;