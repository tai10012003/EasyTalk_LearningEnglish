import React from "react";

const FlashCardListCard = ({ flashcardLists }) => {
    return (
        <div className="col-md-4 col-lg-4 mb-4">
            <div
                className="lesson-card"
                onClick={() => window.location.href = `/flashcards/flashcardlist/${flashcardLists._id}`}
            >
                <h5 className="lesson-title">{flashcardLists.name}</h5>
                <div className="lesson-content">
                    <p><i className="far fa-clone"></i> {flashcardLists.wordCount || 0} từ</p>
                </div>
                <div className="lesson-review-status">
                    <p className="mb-1">Cần ôn tập: <span className="text-danger font-weight-bold">{flashcardLists.toReview || 0}</span></p>
                    <p>Đã nhớ: {flashcardLists.remembered || 0}</p>
                </div>
                <div className="lesson-review-status">
                    <p>Người tạo: {flashcardLists.username || 'Unknown'}</p>
                    <p>Ngày tạo: {new Date(flashcardLists.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
};

export default FlashCardListCard;