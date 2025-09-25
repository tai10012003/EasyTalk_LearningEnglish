
import React, { useState } from "react";
import { FlashCardService } from "../../../services/FlashCardService";

const UpdateFlashCardList = ({ isOpen, onClose, flashcardList, onUpdated }) => {
  const [name, setName] = useState(flashcardList.name || "");
  const [description, setDescription] = useState(flashcardList.description || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    setLoading(true);
    try {
      const data = await FlashCardService.updateFlashcardList(flashcardList._id, name, description);
      if (data.success) {
        alert("✅ Cập nhật danh sách flashcard thành công!");
        onUpdated();
        onClose();
      } else {
        alert("❌ Có lỗi xảy ra: " + data.message);
      }
    } catch (error) {
      alert("❌ Lỗi khi cập nhật flashcard list: " + error.message);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="custom-modal-overlay" onClick={onClose}>
      <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
        <div className="custom-modal-header">
          <h5>CHỈNH SỬA DANH SÁCH FLASHCARD</h5>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="custom-modal-body">
            <div className="mb-3">
              <label className="form-label">Tên danh sách:</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên danh sách"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Mô tả:</label>
              <textarea
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả danh sách (tối đa 500 ký tự)"
                rows={4}
                maxLength={500}
                required
              />
              <small className="text-muted">{description.length}/500 ký tự</small>
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
              <i className="fas fa-times"></i>Đóng
            </button>
            <button type="submit" className="footer-btn" disabled={loading}>
              <i className="fas fa-save"></i>{loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateFlashCardList;