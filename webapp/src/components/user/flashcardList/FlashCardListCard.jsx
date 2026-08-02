import React from "react";
import { useTranslation } from "react-i18next";

const FlashCardListCard = ({ flashcardLists, isMine }) => {
    const { t } = useTranslation();
    return (
        <div className="col-md-4 col-lg-4 mb-4">
            <div
                className="lesson-card"
                onClick={() => window.location.href = `/flashcards/flashcardlist/${flashcardLists._id}`}
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
