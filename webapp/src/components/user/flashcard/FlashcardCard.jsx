import React from "react";

const FlashcardCard = ({ flashcardList }) => {
    return (
        <div className="col-6 col-md-3 my-2">
            <div
                className="flashcard p-3 shadow-sm clickable-card"
                onClick={() => window.location.href = `/flashcards/flashcardlist/${flashcardList._id}`}
            >
                <h5 className="flashcard-title">{flashcardList.name}</h5>
                <div className="flashcard-content">
                    <p><i className="far fa-clone"></i> {flashcardList.wordCount || 0} từ</p>
                </div>
                <div className="flashcard-review-status">
                    <p className="mb-1">Cần ôn tập: <span className="text-danger font-weight-bold">{flashcardList.toReview || 0}</span></p>
                    <p>Đã nhớ: {flashcardList.remembered || 0}</p>
                </div>
                <div className="flashcard-review-status">
                    <p>Ngày tạo: {new Date(flashcardList.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
};

export default FlashcardCard;