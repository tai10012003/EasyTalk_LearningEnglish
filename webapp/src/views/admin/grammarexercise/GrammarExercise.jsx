import React from "react";
import ExerciseList from "@/components/admin/exercise/ExerciseList.jsx";
import { GrammarExerciseService } from "@/services/GrammarExerciseService.jsx";

function GrammarExercise() {
    const fetchGrammarExercise = async (page = 1) => {
        const data = await GrammarExerciseService.fetchGrammarExercise(page, 6);
        return {
            lessons: data.data || [],
            currentPage: data.currentPage,
            totalPages: data.totalPages,
        };
    };

    const deleteGrammarExercise = async (id) => {
        return await GrammarExerciseService.deleteGrammarExercise(id);
    };

    return (
        <div className="admin-lesson-page">
            <ExerciseList
                fetchData={fetchGrammarExercise}
                deleteItem={deleteGrammarExercise}
                title="DANH SÁCH BÀI LUYỆN TẬP NGỮ PHÁP"
                dataKey="lessons"
                addUrl="/admin/grammar-exercise/add"
                updateUrl="/admin/grammar-exercise/update"
            />
        </div>
    );
}

export default GrammarExercise;