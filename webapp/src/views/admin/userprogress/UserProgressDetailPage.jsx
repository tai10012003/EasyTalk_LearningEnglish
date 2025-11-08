import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UserProgressDetail from "@/components/admin/userprogress/UserProgressDetail";
import { UserProgressService } from "@/services/UserProgressService.jsx";
import Swal from "sweetalert2";

const UserProgressDetailPage = () => {
    const { id } = useParams();
    const [userProgress, setUserProgress] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserProgressDetail = async () => {
            try {
                setLoading(true);
                const data = await UserProgressService.getUserProgressDetail(id);
                setUserProgress(data);
            } catch (error) {
                console.error("Error fetching user progress detail:", error);
                Swal.fire({
                    icon: "error",
                    title: "Lỗi tải dữ liệu",
                    text: "Không thể tải tiến trình người dùng. Vui lòng thử lại sau!",
                });
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchUserProgressDetail();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh] text-gray-700 text-lg font-semibold">
                Đang tải dữ liệu tiến trình người dùng...
            </div>
        );
    }

    if (!userProgress) {
        return (
            <div className="flex items-center justify-center h-[80vh] text-gray-700 text-lg font-semibold">
                Không tìm thấy dữ liệu tiến trình người dùng.
            </div>
        );
    }

    return (
        <div className="p-6">
            <UserProgressDetail userProgress={userProgress} />
        </div>
    );
};

export default UserProgressDetailPage;