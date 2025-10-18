import React, { useState } from "react";
import UpdateFlashCard from "@/components/user/flashcard/UpdateFlashCard.jsx";
import { FlashCardService } from "@/services/FlashCardService.jsx";
import Swal from "sweetalert2";

const FlashCardCard = ({ flashcard, onUpdate, onDelete }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = async () => {
    const confirm = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Bạn có chắc chắn muốn xóa flashcard này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });
    if (!confirm.isConfirmed) return;
    try {
      const data = await FlashCardService.deleteFlashcard(flashcard._id);
      if (data.success) {
        await Swal.fire("🗑️ Đã xóa", "Flashcard đã bị xóa thành công!", "success");
        onDelete();
      } else {
        Swal.fire("❌ Lỗi", data.message || "Xóa thất bại!", "error");
      }
    } catch (error) {
      Swal.fire("❌ Lỗi", "Lỗi khi xóa flashcard: " + error.message, "error");
    }
  };

  const speakWord = (word) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 1;
      speechSynthesis.speak(utterance);
    } else {
      Swal.fire("⚠️ Không hỗ trợ", "Trình duyệt của bạn không hỗ trợ phát âm!", "warning");
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
          <strong>Định nghĩa:</strong> {flashcard.meaning}
        </p>
        <p className="example">
          <strong>Ví dụ:</strong> {flashcard.exampleSentence}
        </p>
      </div>
      <div className="col-md-5 text-center">
        {flashcard.image && (
          <div className="flashcard-image mb-2">
            <img
              src={`data:image/jpeg;base64,${flashcard.image}`}
              alt={flashcard.word}
              width="130px"
            />
          </div>
        )}
        <div className="actions d-flex justify-content-center align-items-center gap-2">
          <button
            className="btn_4"
            onClick={() => setIsEditModalOpen(true)}
          >
            <i className="fas fa-edit"></i>Sửa
          </button>
          <button
            className="btn_4"
            onClick={handleDelete}
          >
            <i className="fas fa-trash-alt"></i>Xóa
          </button>
        </div>
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