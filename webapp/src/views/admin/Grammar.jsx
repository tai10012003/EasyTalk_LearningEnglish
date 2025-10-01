import React from "react";
import LessonList from "@/components/admin/LessonList.jsx";
import { GrammarService } from "@/services/GrammarService.jsx";

function Grammar() {
    const fetchGrammar = async (page = 1) => {
        const data = await GrammarService.fetchGrammars(page, 6);
        return {
            lessons: data.grammars || [],
            currentPage: data.currentPage,
            totalPages: data.totalPages,
        };
    };

    const deleteGrammar = async (id) => {
        return await GrammarService.deleteGrammar(id);
    };

    return (
        <div className="admin-lesson-page">
            <LessonList
                fetchData={fetchGrammar}
                deleteItem={deleteGrammar}
                title="DANH SÁCH BÀI HỌC NGỮ PHÁP"
                dataKey="lessons"
                addUrl="/admin/grammar/add"
            />
        </div>
    );
}

export default Grammar;