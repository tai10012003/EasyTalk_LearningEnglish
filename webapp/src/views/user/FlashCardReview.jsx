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
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        document.title = "Ôn tập flashcard - EasyTalk";
        const load = async () => {
            setIsLoading(true);
            try {
                const data = await FlashCardService.fetchReview(id);
                setFlashcards(data.flashcards);
                setListName(data.flashcardList.name);  
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
                <button className="btn_1 danger" onClick={handleRemove}><i className="fas fa-check-circle"></i>Đã nhớ từ vựng</button>
                <button className="btn_1 primary" onClick={handleNext}><i className="fas fa-arrow-right"></i>Tiếp theo</button>
            </div>
        </div>
    );
};

export default FlashCardReview;