import React, { useState } from "react";
import UpdateFlashCard from "@/components/user/flashcard/UpdateFlashCard.jsx";
import { FlashCardService } from "@/services/FlashCardService.jsx";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

const FlashCardCard = ({ flashcard, onUpdate, onDelete, isOwner = false }) => {
  const { t } = useTranslation();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = async () => {
    const confirm = await Swal.fire({
      title: t("flashcardPage.card.deleteConfirmTitle"),
      text: t("flashcardPage.card.deleteConfirmText"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("flashcardPage.card.deleteConfirm"),
      cancelButtonText: t("flashcardPage.card.deleteCancel"),
    });
    if (!confirm.isConfirmed) return;
    try {
      const data = await FlashCardService.deleteFlashcard(flashcard._id);
      if (data.success) {
        await Swal.fire(t("flashcardPage.card.deleteSuccessTitle"), t("flashcardPage.card.deleteSuccessText"), "success");
        onDelete();
      } else {
        Swal.fire(t("flashcardPage.card.deleteErrorTitle"), data.message || t("flashcardPage.card.deleteFailed"), "error");
      }
    } catch (error) {
      Swal.fire(t("flashcardPage.card.deleteErrorTitle"), t("flashcardPage.card.deleteErrorText", { message: error.message }), "error");
    }
  };

  const speakWord = (word) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 1;
      speechSynthesis.speak(utterance);
    } else {
      Swal.fire(t("flashcardPage.card.speechUnsupportedTitle"), t("flashcardPage.card.speechUnsupportedText"), "warning");
    }
  };

  return (
    <div className="flashcard-item row shadow-sm p-4 my-4 mb-3">
      <div className="col-md-7">
        <h5>
          <span className="audio-icons ms-2">
            <button
              onClick={() => speakWord(flashcard.word)}
              className="btn-speak me-2"
            >
              🔊
            </button>
          </span>
          {flashcard.word}{" "}
          <em className="pos">({flashcard.pos})</em>
          <em className="pronunciation">({flashcard.pronunciation})</em>
        </h5>
        <p className="definition">
          <strong>{t("flashcardPage.card.definition")}</strong> {flashcard.meaning}
        </p>
        <p className="example">
          <strong>{t("flashcardPage.card.example")}</strong> {flashcard.exampleSentence}
        </p>
        <p>{t("flashcardPage.card.creator", { username: flashcard.username || t("flashcardPage.card.unknown") })}</p>
      </div>
      <div className="col-md-5 text-center">
        {flashcard.image && (
          <div className="flashcard-image mb-2">
            <img
              src={flashcard.image}
              alt={flashcard.word}
              width="130px"
            />
          </div>
        )}
        {isOwner && (
          <div className="actions d-flex justify-content-center align-items-center gap-2">
            <button
              className="btn_4"
              onClick={() => setIsEditModalOpen(true)}
            >
              <i className="fas fa-edit"></i>{t("flashcardPage.card.edit")}
            </button>
            <button
              className="btn_4"
              onClick={handleDelete}
            >
              <i className="fas fa-trash-alt"></i>{t("flashcardPage.card.delete")}
            </button>
          </div>
        )}
      </div>
      <UpdateFlashCard
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        flashcard={flashcard}
        onUpdated={onUpdate}
      />
    </div>
  );
};

export default FlashCardCard;
