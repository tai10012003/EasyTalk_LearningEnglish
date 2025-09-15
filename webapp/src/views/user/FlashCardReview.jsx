import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FlashcardService } from "../../services/flashcardService";
import FlashCardReviewCard from "../../components/user/flashcard/FlashCardReviewCard";

const FlashCardReview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [flashcards, setFlashcards] = useState([]);
    const [listName, setListName] = useState(""); 
    const [currentIndex, setCurrentIndex] = useState(0);
    const [mode, setMode] = useState("flip");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await FlashcardService.fetchReview(id);
                setFlashcards(data.flashcards);
                setListName(data.flashcardList.name);  
                setCurrentIndex(0);
                randomMode();
            } catch (err) {
                alert("Lỗi tải flashcard: " + err.message);
                navigate("/flashcards");
            }
            setLoading(false);
        };
        load();
    }, [id]);

    const randomMode = () => {
        let modes = ["flip", "choice", "fill"];
        if (flashcards.length < 4) {
            modes = modes.filter(m => m != "choice");
        }
        setMode(modes[Math.floor(Math.random() * modes.length)]);
    };

    const handleNext = () => {
        if (flashcards.length == 0) return;
        const nextIdx = Math.floor(Math.random() * flashcards.length);
        setCurrentIndex(nextIdx);
        randomMode();
    };

    const handleRemove = () => {
        if (window.confirm("Bạn đã nhớ từ này rồi chứ? Hệ thống sẽ tự động xóa từ vựng đã ghi nhớ khỏi danh sách luyện tập !")) {
            const updated = flashcards.filter((_, idx) => idx !== currentIndex);
            setFlashcards(updated);
            if (updated.length == 0) {
                alert("🎉 Bạn đã hoàn thành luyện tập!");
                navigate(`/flashcards/flashcardlist/${id}`);
            } else {
                setCurrentIndex(0);
                randomMode();
            }
        }
    };

    const handleCheckAnswer = (answer, correct) => {
        if (answer.toLowerCase() == correct.toLowerCase()) {
            alert("✅ Chính xác!");
        } else {
            alert("❌ Sai. Đáp án đúng là: " + correct);
        }
    };

    const handleStop = () => {
        if (window.confirm("Bạn có chắc chắn muốn dừng học không?")) {
           navigate(`/flashcards/flashcardlist/${id}`);
        }
    };

    if (loading) return <div className="loading">Đang tải...</div>;
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