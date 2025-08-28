import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FlashcardService } from "../../services/flashcardService";
import FlashCardReviewCard from "../../components/user/flashcard/FlashCardReviewCard";

const FlashCardReview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [flashcards, setFlashcards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [mode, setMode] = useState("flip");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await FlashcardService.fetchReview(id);
                setFlashcards(data.flashcards);
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
        const modes = ["flip", "choice", "fill"];
        setMode(modes[Math.floor(Math.random() * modes.length)]);
    };

    const handleNext = () => {
        if (flashcards.length == 0) return;
        const nextIdx = Math.floor(Math.random() * flashcards.length);
        setCurrentIndex(nextIdx);
        randomMode();
    };

    const handleRemove = () => {
        if (window.confirm("Bạn có muốn loại từ này khỏi luyện tập?")) {
        const updated = flashcards.filter((_, idx) => idx !== currentIndex);
        setFlashcards(updated);
        if (updated.length == 0) {
            alert("Không còn từ nào để luyện tập.");
            navigate("/flashcards");
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

    if (loading) return <div className="loading">Đang tải...</div>;
    if (flashcards.length == 0) return <p>Không có flashcards nào.</p>;

    return (
        <div className="flashcard-review-container">
            <div className="section_tittle">
                <h3 className="title">Luyện tập: {flashcards[currentIndex].listName}</h3>
            </div>
        <FlashCardReviewCard
            card={flashcards[currentIndex]}
            mode={mode}
            onCheckAnswer={handleCheckAnswer}
            allWords={flashcards.map(c => c.word)}
        />
        <div className="flashcard-review-actions">
            <button className="btn_4 danger" onClick={handleRemove}>Loại từ</button>
            <button className="btn_4 primary" onClick={handleNext}>Tiếp theo</button>
            <button className="btn_1 outline" onClick={() => navigate("/flashcards")}>Dừng học</button>
        </div>
        </div>
    );
};

export default FlashCardReview;