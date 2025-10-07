import React from "react";
import ExerciseList from "@/components/admin/exercise/ExerciseList.jsx";
import { PronunciationExerciseService } from "@/services/PronunciationExerciseService.jsx";

function PronunciationExercise() {
    const fetchPronunciationExercise = async (page = 1) => {
        const data = await PronunciationExerciseService.fetchPronunciationExercise(page, 6);
        return {
            lessons: data.data || [],
            currentPage: data.currentPage,
            totalPages: data.totalPages,
        };
    };

    const deletePronunciationExercise = async (id) => {
        return await PronunciationExerciseService.deletePronunciationExercise(id);
    };

    return (
        <div className="admin-lesson-page">
            <ExerciseList
                fetchData={fetchPronunciationExercise}
                deleteItem={deletePronunciationExercise}
                title="DANH SÁCH BÀI LUYỆN TẬP PHÁT ÂM"
                dataKey="lessons"
                addUrl="/admin/pronunciation-exercise/add"
                updateUrl="/admin/pronunciation-exercise/update"
            />
        </div>
    );
}

export default PronunciationExercise;