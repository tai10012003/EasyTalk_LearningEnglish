import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import { FlashCardService } from "@/services/FlashCardService";
import FlashCardCard from "@/components/user/flashcard/FlashCardCard.jsx";
import CreateFlashCard from "@/components/user/flashcard/CreateFlashCard.jsx";
import UpdateFlashCardList from "@/components/user/flashcardList/UpdateFlashCardList.jsx";
import { Trans, useTranslation } from "react-i18next";

const FlashCard = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [flashcardList, setFlashcardList] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isOwner, setIsOwner] = useState(false);
  const [limit] = useState(5);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditListModalOpen, setIsEditListModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await FlashCardService.fetchFlashcards(id, currentPage, limit);
      setFlashcardList(data.flashcardList);
      setFlashcards(data.flashcards || []);
      setTotalPages(data.totalPages || 1);
      setIsOwner(data.isOwner || false);
    } catch (error) {
      console.error("Error fetching flashcard list:", error);
      Swal.fire({
        icon: "error",
        title: t("flashcardPage.detail.loadErrorTitle"),
        text: t("flashcardPage.detail.loadErrorText", { message: error.message }),
        confirmButtonText: "OK",
      });
    }
    setIsLoading(false);
  }, [id, currentPage, limit, t]);

  useEffect(() => {
    document.title = t("flashcardPage.detail.documentTitle");
    fetchData();
  }, [fetchData, t]);

  const handleDeleteList = async () => {
    const result = await Swal.fire({
      title: t("flashcardPage.detail.deleteConfirmTitle"),
      text: t("flashcardPage.detail.deleteConfirmText"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("flashcardPage.detail.deleteConfirm"),
      cancelButtonText: t("flashcardPage.detail.deleteCancel"),
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });
    if (result.isConfirmed) {
      try {
        const data = await FlashCardService.deleteFlashcardList(id);
        if (data.success) {
          await Swal.fire({
            icon: "success",
            title: t("flashcardPage.detail.deleteSuccessTitle"),
            text: t("flashcardPage.detail.deleteSuccessText"),
            confirmButtonText: "OK",
          });
          navigate("/flashcards");
        } else {
          Swal.fire({
            icon: "error",
            title: t("flashcardPage.detail.deleteFailedTitle"),
            text: t("flashcardPage.detail.deleteFailedText", { message: data.message || t("flashcardPage.detail.unknownError") }),
            confirmButtonText: "OK",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: t("flashcardPage.detail.deleteErrorTitle"),
          text: t("flashcardPage.detail.deleteErrorText", { message: error.message }),
          confirmButtonText: "OK",
        });
      }
    }
  };

  const renderPagination = () => {
    const pages = [];
    if (currentPage > 1) {
      pages.push(
        <li className="page-item" key="prev">
          <button
            className="page-link"
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            &laquo; {t("flashcardPage.detail.previous")}
          </button>
        </li>
      );
    }
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <li
          className={`page-item ${i == currentPage ? "active" : ""}`}
          key={i}
        >
          <button className="page-link" onClick={() => setCurrentPage(i)}>
            {i}
          </button>
        </li>
      );
    }
    if (currentPage < totalPages) {
      pages.push(
        <li className="page-item" key="next">
          <button
            className="page-link"
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            {t("flashcardPage.detail.next")} &raquo;
          </button>
        </li>
      );
    }
    return pages;
  };

  if (isLoading) return <LoadingScreen />;
  if (!flashcardList) return <div>{t("flashcardPage.detail.notFound")}</div>;

  return (
    <div>
      <div className="flashcard-detail-container container">
        <div className="flashcard-detail-header">
          <div className="section_tittle">
            <h3>{t("flashcardPage.detail.titlePrefix", { name: flashcardList.name })}</h3>
          </div>
          <p className="flashcard-detail-description">{flashcardList.description}</p>
        </div>
        {isOwner && (
          <div className="flashcard-detail-actions">
            <button className="btn_4 mx-2" onClick={() => setIsCreateModalOpen(true)}>
              <i className="fas fa-plus"></i>{t("flashcardPage.detail.addWord")}
            </button>
            <button className="btn_4 mx-2" onClick={() => setIsEditListModalOpen(true)}>
              <i className="fas fa-edit"></i>{t("flashcardPage.detail.editList")}
            </button>
            <button className="btn_4 mx-2" onClick={handleDeleteList}>
              <i className="fas fa-trash-alt"></i>{t("flashcardPage.detail.deleteList")}
            </button>
          </div>
        )}
        <div className="flashcard-detail-alert alert alert-success">
          {t("flashcardPage.detail.languageNotice")}
        </div>
        {flashcards.length >= 3 ? (
          <button
            type="button"
            className="btn_1 btn-lg btn-block flashcard-detail-review"
            onClick={() => navigate(`/flashcards/flashcardlist/${flashcardList._id}/review`)}
          >
            <i className="fas fa-dumbbell"></i>{t("flashcardPage.detail.review")}
          </button>
        ) : (
          <div className="alert alert-error text-center mt-3">
            <Trans i18nKey="flashcardPage.detail.minWordsWarning" components={{ strong: <strong /> }} />
          </div>
        )}
        <div className="flashcard-detail-list">
          <div className="section_tittle">
            <h4>{t("flashcardPage.detail.wordListTitle")}</h4>
          </div>
          {flashcards.length == 0 ? (
            <p className="flashcard-detail-empty">{t("flashcardPage.detail.empty")}</p>
          ) : (
            flashcards.map((flashcard) => (
              <FlashCardCard
                key={flashcard._id}
                flashcard={flashcard}
                onUpdate={fetchData}
                onDelete={fetchData}
                isOwner={isOwner && flashcard.username === flashcardList.username}
              />
            ))
          )}
        </div>
        <nav aria-label="Page navigation">
          <ul className="pagination justify-content-center" id="pagination-controls">
            {renderPagination()}
          </ul>
        </nav>
      </div>
      <CreateFlashCard
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        listId={id}
        onCreated={fetchData}
      />
      {isOwner && (
        <UpdateFlashCardList
          isOpen={isEditListModalOpen}
          onClose={() => setIsEditListModalOpen(false)}
          flashcardList={flashcardList}
          onUpdated={fetchData}
        />
      )}
    </div>
  );
};

export default FlashCard;
