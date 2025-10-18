import React, { useState } from "react";
import { FlashCardService } from "@/services/FlashCardService.jsx";
import Swal from "sweetalert2";

const UpdateFlashCard = ({ isOpen, onClose, flashcard, onUpdated }) => {
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
      Swal.fire("⚠️ Thiếu thông tin", "Vui lòng nhập đầy đủ thông tin bắt buộc!", "warning");
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
        await Swal.fire("✅ Thành công", "Cập nhật flashcard thành công!", "success");
        onUpdated();
        onClose();
      } else {
        Swal.fire("❌ Lỗi", data.message || "Có lỗi xảy ra.", "error");
      }
    } catch (error) {
      Swal.fire("❌ Lỗi", "Lỗi khi cập nhật flashcard: " + error.message, "error");
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="custom-modal-overlay" onClick={onClose}>
      <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
        <div className="custom-modal-header">
          <h5>CHỈNH SỬA TỪ VỰNG</h5>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="custom-modal-body">
            <div className="mb-3">
              <label className="form-label">Từ vựng:</label>
              <input
                type="text"
                className="form-control"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Nhập từ vựng"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Định nghĩa:</label>
              <input
                type="text"
                className="form-control"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                placeholder="Nhập định nghĩa"
                required
              />
            </div>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Từ loại:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={pos}
                    onChange={(e) => setPos(e.target.value)}
                    placeholder="Nhập từ loại (VD: noun, verb)"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Phát âm:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={pronunciation}
                    onChange={(e) => setPronunciation(e.target.value)}
                    placeholder="Nhập phát âm (VD: /ˈæp.əl/)"
                  />
                </div>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Ví dụ:</label>
              <textarea
                className="form-control"
                value={exampleSentence}
                onChange={(e) => setExampleSentence(e.target.value)}
                placeholder="Thêm ví dụ"
                rows={4}
                maxLength={500}
                required
              />
              <small className="text-muted">{exampleSentence.length}/500 ký tự</small>
            </div>
            <div className="mb-3">
              <label className="form-label">
                <i className="bi bi-card-image"></i> Hình ảnh:
              </label>
              {flashcard.image && (
                <img
                  src={`data:image/jpeg;base64,${flashcard.image}`}
                  alt={flashcard.word}
                  style={{ width: "130px", height: "auto", borderRadius: "5px", marginBottom: "10px" }}
                />
              )}
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

export default UpdateFlashCard;