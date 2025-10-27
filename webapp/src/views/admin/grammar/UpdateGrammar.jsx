import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UpdateLesson from "../../../components/admin/lesson/UpdateLesson";
import { GrammarService } from "@/services/GrammarService.jsx";
import { AuthService } from "@/services/AuthService.jsx";
import Swal from "sweetalert2";

const UpdateGrammar = () => {
    const { id } = useParams();
    const [grammar, setGrammar] = useState(null);
    const [existingGrammars, setExistingGrammars] = useState([]);

    useEffect(() => {
        const fetchGrammar = async () => {
            try {
                const res = await AuthService.fetchWithAuth(`${import.meta.env.VITE_API_URL}/grammar/api/${id}`, {
                    method: "GET",
                });
                const data = await res.json();
                setGrammar(data);
            } catch (err) {
                console.error("Error fetching grammar:", err);
            }
        };
        fetchGrammar();
    },  [id]);

    useEffect(() => {
        const fetchGrammars = async () => {
            try {
                const data = await GrammarService.fetchGrammars(1, 10000);
                setExistingGrammars(data.grammars || []);
            } catch (err) {
                console.error("Error fetching grammars:", err);
            }
        };
        fetchGrammars();
    }, []);

    const handleSubmit = async (formData, id) => {
        try {
            const res = await GrammarService.updateGrammar(id, formData);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Bài học ngữ pháp đã được cập nhật thành công!',
            });
            window.location.href = "/admin/grammar";
            return res;
        } catch (err) {
            console.error("Error updating grammar:", err);
            Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra khi cập nhật bài học ngữ pháp!',
            });
        }
    };

    if (!grammar) return <p>Đang tải dữ liệu...</p>;

    return (
        <UpdateLesson
            title="CẬP NHẬT BÀI HỌC NGỮ PHÁP"
            onSubmit={handleSubmit}
            returnUrl="/admin/grammar"
            initialData={grammar}
            existingItems={existingGrammars}
        />
    );
};

export default UpdateGrammar;