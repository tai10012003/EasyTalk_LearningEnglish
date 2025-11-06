import React, { useState } from "react";
import Swal from "sweetalert2";
import { FlashCardService } from "@/services/FlashCardService.jsx";

const FlashCardGoal = ({ isOpen, onClose, currentGoal }) => {
    const [goal, setGoal] = useState(currentGoal.goal || 20);
    const [isLoading, setIsLoading] = useState(false);
    const todayCount = currentGoal.todayCount || 0;

    const getBonusByGoal = (g) => {
        if (g <= 20) return 10;
        if (g <= 70) return 20;
        if (g <= 130) return 30;
        if (g <= 200) return 50;
        return 50;
    };

    const handleSave = async () => {
        if (todayCount > 0) {
            Swal.fire({
                icon: "warning",
                title: "Không thể thay đổi",
                text: "Bạn đã bắt đầu ôn tập hôm nay. Chỉ có thể set goal vào ngày mới!",
            });
            return;
        }
        if (goal < 0 || goal > 200) {
            Swal.fire({
                icon: "warning",
                title: "Cảnh báo",
                text: "Mục tiêu phải từ 0 đến 200 review/ngày.",
            });
            return;
        }
        setIsLoading(true);
        try {
            await FlashCardService.updateDailyGoal(goal);
            const bonus = getBonusByGoal(goal);
            Swal.fire({
                icon: "success",
                title: "Cập nhật thành công!",
                text: `Mục tiêu mới: ${goal} flashcard/ngày. Bonus EXP khi đạt: +${bonus}XP.`,
            });
            onClose(goal);
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không thể cập nhật mục tiêu.",
            });
        }
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="custom-modal-overlay" onClick={onClose}>
            <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                <div className="custom-modal-header">
                    <h5>Đặt Mục Tiêu Hàng Ngày</h5>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="custom-modal-body">
                    <p>Chọn số flashcard bạn muốn review mỗi ngày (từ 0-200):</p>
                    <input
                        type="number"
                        value={goal}
                        onChange={(e) => setGoal(parseInt(e.target.value) || 0)}
                        min="0"
                        max="200"
                        className="form-control mb-3"
                        placeholder="Ví dụ: 20"
                        disabled={todayCount > 0}
                    />
                    {todayCount > 0 && (
                        <small className="text-warning d-block mb-2">
                            Hôm nay đã ôn {todayCount} lần, không thể thay đổi goal.
                        </small>
                    )}
                    <p><strong>Tặng EXP khi đạt mục tiêu:</strong></p>
                    <ul className="mb-0">
                        <li>0-20 lần: +10XP</li>
                        <li>21-70 lần: +20XP</li>
                        <li>71-130 lần: +30XP</li>
                        <li>131-200 lần: +50XP</li>
                    </ul>
                    <p className="small text-info mt-2">
                        Mỗi khi bạn đánh giá độ khó (Dễ/Thường/Khó) cho flashcard của mình, nó sẽ đếm vào tiến độ hôm nay.
                    </p>
                </div>
                {todayCount == 0 && (
                    <div className="custom-modal-footer">
                        <button className="footer-btn" onClick={handleSave} disabled={isLoading}>
                            {isLoading ? "Đang lưu..." : "Lưu"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlashCardGoal;