import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import { FlashCardService } from "@/services/FlashCardService.jsx";
import FlashCardReviewCard from "@/components/user/flashcard/FlashCardReviewCard.jsx";
import Swal from "sweetalert2";

const FlashCardReview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [flashcards, setFlashcards] = useState([]);
    const [listName, setListName] = useState(""); 
    const [currentIndex, setCurrentIndex] = useState(0);
    const [mode, setMode] = useState("flip");
    const [isOwner, setIsOwner] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        document.title = "Ôn tập flashcard - EasyTalk";
        const load = async () => {
            setIsLoading(true);
            try {
                const data = await FlashCardService.fetchReview(id);
                setFlashcards(data.flashcards);
                setListName(data.flashcardList.name);  
                setIsOwner(data.isOwner || false);
                setCurrentIndex(0);
                randomMode();
            } catch (err) {
                Swal.fire({
                    icon: "error",
                    title: "Lỗi tải flashcard",
                    text: err.message,
                    confirmButtonText: "Quay lại",
                }).then(() => navigate("/flashcards"));
            }
            setIsLoading(false);
        };
        load();
    }, [id]);

    const randomMode = () => {
        let modes = ["flip", "choice", "fill"];
        if (flashcards.length < 4) {
            modes = modes.filter(m => m !== "choice");
        }
        setMode(modes[Math.floor(Math.random() * modes.length)]);
    };

    const handleNext = () => {
        if (flashcards.length == 0) return;
        const nextIdx = Math.floor(Math.random() * flashcards.length);
        setCurrentIndex(nextIdx);
        randomMode();
    };

    const handleNextWeighted = () => {
        if (flashcards.length == 0) return;
        const weights = flashcards.map(f => {
            switch (f.difficulty) {
                case 1: return 0.2;
                case 2: return 1;
                case 3: return 3;
                default: return 1;
            }
        });
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * totalWeight;
        let idx = 0;
        for (; idx < weights.length; idx++) {
            r -= weights[idx];
            if (r <= 0) break;
        }
        setCurrentIndex(idx);
        randomMode();
    };

    const handleRate = async (difficulty) => {
        const card = flashcards[currentIndex];
        try {
            await FlashCardService.updateDifficulty(card._id, difficulty);
            card.difficulty = difficulty;
            let title = "";
            switch (difficulty) {
                case 1: title = "Tuyệt vời!"; break;
                case 2: title = "Tốt!"; break;
                case 3: title = "Cố lên!"; break;
            }
            Swal.fire({
                icon: "success",
                title,
                timer: 1000,
                showConfirmButton: false,
            });
            handleNextWeighted();
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không thể cập nhật độ khó.",
            });
        }
    };

    const handleRemove = async () => {
        const result = await Swal.fire({
            title: "Xác nhận xóa từ vựng",
            text: "Bạn đã nhớ từ này rồi chứ? Hệ thống sẽ tự động xóa từ vựng đã ghi nhớ khỏi danh sách luyện tập!",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Đúng vậy",
            cancelButtonText: "Hủy",
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
        });

        if (result.isConfirmed) {
            const updated = flashcards.filter((_, idx) => idx !== currentIndex);
            setFlashcards(updated);
            if (updated.length == 0) {
                Swal.fire({
                    icon: "success",
                    title: "🎉 Hoàn thành!",
                    text: "Bạn đã hoàn thành luyện tập!",
                    confirmButtonText: "OK",
                }).then(() => navigate(`/flashcards/flashcardlist/${id}`));
            } else {
                setCurrentIndex(0);
                randomMode();
                Swal.fire({
                    icon: "success",
                    title: "Đã xóa từ vựng",
                    text: "Từ vựng đã được loại khỏi danh sách ôn tập.",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
        }
    };

    const handleCheckAnswer = (answer, correct) => {
        if (answer.toLowerCase() == correct.toLowerCase()) {
            Swal.fire({
                icon: "success",
                title: "Chính xác!",
                timer: 1200,
                showConfirmButton: false,
            });
        } else {
            Swal.fire({
                icon: "error",
                title: "Sai rồi!",
                text: `Đáp án đúng là: ${correct}`,
            });
        }
    };

    const handleStop = async () => {
        const result = await Swal.fire({
            title: "Dừng học?",
            text: "Bạn có chắc chắn muốn dừng học không?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Có, dừng lại",
            cancelButtonText: "Tiếp tục học",
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
        });

        if (result.isConfirmed) {
            navigate(`/flashcards/flashcardlist/${id}`);
        }
    };

    if (isLoading) return <LoadingScreen />;
    if (flashcards.length == 0) return <p>Không có flashcards nào.</p>;

    return (
        <div className="flashcard-review-container">
            <div className="section_tittle" style={{ marginBottom: "30px" }}>
                <h3 className="title">Luyện tập: {listName}</h3> 
            </div>
            <button className="btn_1" onClick={handleStop}>
                <i className="fas fa-stop-circle mr-2"></i>Dừng học
            </button>
            <FlashCardReviewCard
                card={flashcards[currentIndex]}
                mode={mode}
                onCheckAnswer={handleCheckAnswer}
                allWords={flashcards.map(c => c.word)}
            />
            <div className="flashcard-review-actions">
                {isOwner ? (
                    <>
                        <button className="btn_1 easy" onClick={() => handleRate(1)}>
                            <i className="fas fa-thumbs-up"></i> Dễ
                        </button>
                        <button className="btn_1 normal" onClick={() => handleRate(2)}>
                            <i className="fas fa-minus"></i> Thường
                        </button>
                        <button className="btn_1 hard" onClick={() => handleRate(3)}>
                            <i className="fas fa-thumbs-down"></i> Khó
                        </button>
                    </>
                ) : (
                    <>
                        <button className="btn_1 danger" onClick={handleRemove}>
                            <i className="fas fa-check-circle"></i> Đã nhớ từ vựng
                        </button>
                        <button className="btn_1 primary" onClick={handleNext}>
                            <i className="fas fa-arrow-right"></i> Tiếp theo
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default FlashCardReview;