import React from "react";
import ExerciseList from "@/components/admin/exercise/ExerciseList.jsx";
import { VocabularyExerciseService } from "@/services/VocabularyExerciseService.jsx";

function VocabularyExercise() {
    const fetchVocabularyExercise = async (page = 1) => {
        const data = await VocabularyExerciseService.fetchVocabularyExercise(page, 6);
        return {
            lessons: data.data || [],
            currentPage: data.currentPage,
            totalPages: data.totalPages,
        };
    };

    const deleteVocabularyExercise = async (id) => {
        return await VocabularyExerciseService.deleteVocabularyExercise(id);
    };

    return (
        <div className="admin-lesson-page">
            <ExerciseList
                fetchData={fetchVocabularyExercise}
                deleteItem={deleteVocabularyExercise}
                title="DANH SÁCH BÀI LUYỆN TẬP TỪ VỰNG"
                dataKey="lessons"
                addUrl="/admin/vocabulary-exercise/add"
                updateUrl="/admin/vocabulary-exercise/update"
            />
        </div>
    );
}

export default VocabularyExercise;