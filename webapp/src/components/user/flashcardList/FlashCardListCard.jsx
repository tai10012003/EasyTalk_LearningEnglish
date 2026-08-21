import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const FlashCardListCard = ({ flashcardLists, isMine }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const openFlashcardList = () => {
        navigate(`/flashcards/flashcardlist/${flashcardLists._id}`);
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFlashcardList();
        }
    };

    return (
        <div className="col-md-4 col-lg-4 mb-4">
            <div
                className="lesson-card"
                onClick={openFlashcardList}
                onKeyDown={handleKeyDown}
                role="button"
                tabIndex={0}
            >
                <h5 className="lesson-title">{flashcardLists.name}</h5>
                <div className="lesson-content">
                    <p><i className="far fa-clone"></i> {t("flashcardPage.listCard.words", { count: flashcardLists.wordCount || 0 })}</p>
                </div>
                {isMine && (
                    <div className="lesson-review-status">
                        <p className="mb-1">{t("flashcardPage.listCard.toReview", { count: flashcardLists.toReview || 0 })}</p>
                        <p>{t("flashcardPage.listCard.remembered", { count: flashcardLists.remembered || 0 })}</p>
                    </div>
                )}
                <div className="lesson-review-status">
                    <p>{t("flashcardPage.listCard.creator", { username: flashcardLists.username || t("flashcardPage.listCard.unknown") })}</p>
                    <p>{t("flashcardPage.listCard.createdAt", { date: new Date(flashcardLists.createdAt).toLocaleDateString() })}</p>
                </div>
            </div>
        </div>
    );
};

export default FlashCardListCard;
