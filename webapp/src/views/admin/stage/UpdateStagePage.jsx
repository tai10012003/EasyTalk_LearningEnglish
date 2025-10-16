import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UpdateStage from "../../../components/admin/stage/UpdateStage";
import { StageService } from "@/services/StageService.jsx";

const UpdateStagePage = () => {
    const { id } = useParams();
    const [stage, setStage] = useState(null);

    useEffect(() => {
        const fetchStage = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${import.meta.env.VITE_API_URL}/stage/api/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                });
                const data = await res.json();
                setStage(data.stage);
            } catch (err) {
                console.error("Error fetching stage", err);
            }
        };
        fetchStage();
    },  [id]);

    const handleSubmit = async (formData, id) => {
        try {
            await StageService.updateStage(id, formData);
            alert("Cập nhật chặng học tập thành công!");
            window.location.href = "/admin/stage";
        } catch (err) {
            console.error("Error updating stage:", err);
            alert("Có lỗi khi cập nhật!");
        }
    };

    if (!stage) return <p>Đang tải dữ liệu...</p>;

    return (
        <UpdateStage
            title="CẬP NHẬT CHẶNG HỌC TẬP"
            onSubmit={handleSubmit}
            returnUrl="/admin/stage"
            initialData={stage}
        />
    );
};

export default UpdateStagePage;