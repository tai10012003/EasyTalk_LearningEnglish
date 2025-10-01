import React from "react";
import LessonList from "@/components/admin/LessonList.jsx";
import { PronunciationService } from "@/services/PronunciationService.jsx";

function Pronunciation() {
    const fetchPronunciations = async (page = 1) => {
        const data = await PronunciationService.fetchPronunciations(page, 6);
        return {
            lessons: data.pronunciations || [],
            currentPage: data.currentPage,
            totalPages: data.totalPages,
        };
    };

    const deletePronunciation = async (id) => {
        return await GrammarService.deleteGrammar(id);
    };

    return (
        <div className="admin-lesson-wrapper">
            <LessonList
                fetchData={fetchPronunciations}
                deleteItem={deletePronunciation}
                title="DANH SÁCH BÀI HỌC PHÁT ÂM"
                dataKey="lessons"
                addUrl="/admin/pronunciation/add"
            />
        </div>
    );
}

export default Pronunciation;