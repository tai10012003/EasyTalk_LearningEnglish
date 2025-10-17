import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UpdateStage from "../../../components/admin/stage/UpdateStage";
import { StageService } from "@/services/StageService.jsx";
import Swal from "sweetalert2";

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
            const res = await StageService.updateStage(id, formData);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Cập nhật chặng học tập thành công!',
            });
            window.location.href = "/admin/stage";
            return res;
        } catch (err) {
            console.error("Error adding pronunciation:", err);
            await Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra khi cập nhật chặng học tập!',
            });
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