import React from "react";
import DictationList from "@/components/admin/dictation/DictationList.jsx";
import { DictationExerciseService } from "@/services/DictationExerciseService.jsx";

function DictationExercise() {
    const fetchDictationExercise = async (page = 1) => {
        const data = await DictationExerciseService.fetchDictationExercise(page, 12);
        return {
            lessons: data.dictationExercises || [],
            currentPage: data.currentPage,
            totalPages: data.totalPages,
        };
    };

    const deleteDictationExercise = async (id) => {
        return await DictationExerciseService.deleteDictationExercise(id);
    };

    return (
        <div className="admin-lesson-page">
            <DictationList
                fetchData={fetchDictationExercise}
                deleteItem={deleteDictationExercise}
                title="DANH SÁCH BÀI LUYỆN TẬP NGHE CHÉP CHÍNH TẢ"
                dataKey="lessons"
                addUrl="/admin/dictation-exercise/add"
                updateUrl="/admin/dictation-exercise/update"
            />
        </div>
    );
}

export default DictationExercise;