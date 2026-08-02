import React, { useState } from "react";
import { FlashCardService } from "@/services/FlashCardService.jsx";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

const UpdateFlashCard = ({ isOpen, onClose, flashcard, onUpdated }) => {
  const { t } = useTranslation();
  const [word, setWord] = useState(flashcard.word || "");
  const [meaning, setMeaning] = useState(flashcard.meaning || "");
  const [pos, setPos] = useState(flashcard.pos || "");
  const [pronunciation, setPronunciation] = useState(flashcard.pronunciation || "");
  const [exampleSentence, setExampleSentence] = useState(flashcard.exampleSentence || "");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!word.trim() || !meaning.trim() || !exampleSentence.trim()) {
      Swal.fire(t("flashcardPage.form.missingTitle"), t("flashcardPage.form.missingRequired"), "warning");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("word", word);
      formData.append("meaning", meaning);
      formData.append("pos", pos);
      formData.append("pronunciation", pronunciation);
      formData.append("exampleSentence", exampleSentence);
      if (image) formData.append("image", image);

      const data = await FlashCardService.updateFlashcard(flashcard._id, formData);
      if (data.success) {
        await Swal.fire(t("flashcardPage.form.successTitle"), t("flashcardPage.form.updateCardSuccess"), "success");
        onUpdated();
        onClose();
      } else {
        Swal.fire(t("flashcardPage.form.errorTitle"), data.message || t("flashcardPage.form.genericError"), "error");
      }
    } catch (error) {
      Swal.fire(t("flashcardPage.form.errorTitle"), t("flashcardPage.form.updateCardError", { message: error.message }), "error");
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="custom-modal-overlay" onClick={onClose}>
      <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
        <div className="custom-modal-header">
          <h5>{t("flashcardPage.form.updateCardTitle")}</h5>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="custom-modal-body">
            <div className="mb-3">
              <label className="form-label">{t("flashcardPage.form.word")}</label>
              <input
                type="text"
                className="form-control"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder={t("flashcardPage.form.wordPlaceholder")}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">{t("flashcardPage.form.meaning")}</label>
              <input
                type="text"
                className="form-control"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                placeholder={t("flashcardPage.form.meaningPlaceholder")}
                required
              />
            </div>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">{t("flashcardPage.form.pos")}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={pos}
                    onChange={(e) => setPos(e.target.value)}
                    placeholder={t("flashcardPage.form.posPlaceholder")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">{t("flashcardPage.form.pronunciation")}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={pronunciation}
                    onChange={(e) => setPronunciation(e.target.value)}
                    placeholder={t("flashcardPage.form.pronunciationPlaceholder")}
                  />
                </div>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">{t("flashcardPage.form.example")}</label>
              <textarea
                className="form-control"
                value={exampleSentence}
                onChange={(e) => setExampleSentence(e.target.value)}
                placeholder={t("flashcardPage.form.examplePlaceholder")}
                rows={4}
                maxLength={500}
                required
              />
              <small className="text-muted">{t("flashcardPage.form.charCount", { count: exampleSentence.length })}</small>
            </div>
            <div className="mb-3">
              <label className="form-label">
                <i className="bi bi-card-image"></i> {t("flashcardPage.form.image")}
              </label>
              <div>
                {flashcard.image && (
                  <img
                    src={`${flashcard.image}`}
                    alt={flashcard.word}
                    style={{ width: "180px", height: "auto", borderRadius: "5px", margin: "10px 0" }}
                  />
                )}
              </div>
              <input
                type="file"
                className="form-control"
                onChange={(e) => setImage(e.target.files[0])}
                accept="image/*"
              />
            </div>
          </div>
          <div
            className="custom-modal-footer"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button type="button" className="footer-btn" onClick={onClose} disabled={loading}>
              <i className="fas fa-times"></i>{t("flashcardPage.form.close")}
            </button>
            <button type="submit" className="footer-btn" disabled={loading}>
              <i className="fas fa-save"></i>{loading ? t("flashcardPage.form.saving") : t("flashcardPage.form.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateFlashCard;
