import React from "react";
import LessonList from "@/components/admin/lesson/LessonList.jsx";
import { PronunciationService } from "@/services/PronunciationService.jsx";

function Pronunciation() {
    const fetchPronunciations = async (page = 1) => {
        const data = await PronunciationService.fetchPronunciations(page, 6, { admin: true });
        return {
            lessons: data.data.pronunciations || [],
            currentPage: data.data.currentPage,
            totalPages: data.data.totalPages,
        };
    };

    const deletePronunciation = async (id) => {
        return await PronunciationService.deletePronunciation(id);
    };

    return (
        <div className="admin-lesson-wrapper">
            <LessonList
                fetchData={fetchPronunciations}
                deleteItem={deletePronunciation}
                title="DANH SÁCH BÀI HỌC PHÁT ÂM"
                dataKey="lessons"
                addUrl="/admin/pronunciation/add"
                updateUrl="/admin/pronunciation/update"
                translateUrl="/admin/pronunciation/translate"
            />
        </div>
    );
}

export default Pronunciation;
