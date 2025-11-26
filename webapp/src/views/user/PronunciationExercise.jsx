import React, { useEffect, useState, useRef } from "react";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import PronunciationExerciseCard from "@/components/user/pronunciationexercise/PronunciationExerciseCard.jsx";
import { useNavigate } from "react-router-dom";
import { PronunciationExerciseService } from "@/services/PronunciationExerciseService.jsx";

function PronunciationExercise() {
    const [allPronunciationExercises, setAllPronunciationExercises] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [unlockedPronunciationExercises, setUnlockedPronunciationExercises] = useState([]);
    const currentLessonRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Bài luyện tập phát âm - EasyTalk";
        PronunciationExerciseService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const allResp = await PronunciationExerciseService.fetchPronunciationExercise(1, 10000);
                const all = allResp.data || [];
                setAllPronunciationExercises(all);
                if (all.length > 0) {
                    try {
                        const detailResp = await PronunciationExerciseService.getPronunciationExerciseDetail(all[0]._id);
                        const userProg = detailResp?.userProgress || null;
                        const unlockedIds = Array.isArray(userProg?.unlockedPronunciationExercises) ? userProg.unlockedPronunciationExercises.map(s => s.toString()) : [];
                        setUnlockedPronunciationExercises(unlockedIds);
                    } catch (err) {
                        console.error("Error fetching user progress:", err);
                        setUnlockedPronunciationExercises([]);
                    }
                } else {
                    setUnlockedPronunciationExercises([]);
                }
            } catch (err) {
                console.error("Error fetching pronunciation exercises:", err);
                setAllPronunciationExercises([]);
                setUnlockedPronunciationExercises([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const isPronunciationExerciseUnlocked = (pronunciationExerciseId) => {
        return unlockedPronunciationExercises.includes(pronunciationExerciseId.toString());
    };

    const findCurrentPronunciationExerciseIndex = () => {
        if (unlockedPronunciationExercises.length === 0) return -1;
        const lastUnlockedId = unlockedPronunciationExercises[unlockedPronunciationExercises.length - 1];
        return allPronunciationExercises.findIndex(item => item._id.toString() === lastUnlockedId);
    };

    const scrollToCurrentLesson = () => {
        if (currentLessonRef.current) {
            currentLessonRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    };

    return (
        <>
            <div className="user-road-roadmap">
                <div className="user-road-header">
                    <div className="container">
                        <h1 className="user-road-title">
                            <i className="fas fa-volume-up me-2"></i> LỘ TRÌNH LUYỆN TẬP PHÁT ÂM TỪ A-Z
                            <i
                                className="fas fa-question-circle help-icon"
                                style={{ cursor: "pointer", marginLeft: "10px" }}
                                onClick={() => setIsModalOpen(true)}
                            ></i>
                        </h1>
                        <p className="user-road-subtitle">
                            Hoàn thành từng bài để mở khóa bài tiếp theo • Đã mở khóa: {unlockedPronunciationExercises.length} / {allPronunciationExercises.length}
                        </p>
                        <div className="user-road-progress">
                            <div className="user-progress-bar">
                                <div className="user-progress-fill" style={{ width: `${allPronunciationExercises.length > 0 ? (unlockedPronunciationExercises.length / allPronunciationExercises.length) * 100 : 0}%` }}/>
                            </div>
                            <span className="user-progress-text">
                                {allPronunciationExercises.length > 0 ? Math.round((unlockedPronunciationExercises.length / allPronunciationExercises.length) * 100) : 0}% hoàn thành
                            </span>
                        </div>
                    </div>
                </div>
                <div className="container">
                    <div className="user-road-timeline">
                        {allPronunciationExercises.map((item, index) => {
                            const isUnlocked = isPronunciationExerciseUnlocked(item._id);
                            const currentIndex = findCurrentPronunciationExerciseIndex();
                            const isCurrent = index === currentIndex;
                            return (
                                <div key={item._id} ref={isCurrent ? currentLessonRef : null} >
                                    <PronunciationExerciseCard item={item} index={index} isUnlocked={isUnlocked} isCurrent={isCurrent} />
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="user-floating-buttons">
                    <button className="user-scroll-current-btn" onClick={scrollToCurrentLesson} title="Cuộn đến bài luyện tập hiện tại" >
                        <i className="fas fa-play-circle"></i>
                        <span className="user-scroll-current-text">Tiếp tục luyện tập</span>
                        <span className="user-scroll-hot-badge">HOT</span>
                    </button>
                    <button className="user-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} title="Lên đầu trang" >
                        <i className="fas fa-arrow-up"></i>
                    </button>
                </div>
            </div>
            {isModalOpen && (
                <div
                    className="custom-modal-overlay"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="custom-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="custom-modal-header">
                            <h5>Hướng Dẫn Bài Luyện Tập Phát Âm</h5>
                            <button
                                className="close-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>Chọn bài luyện tập phát âm mà bạn muốn luyện tập từ danh sách.</p>
                            <p>Mỗi bài luyện tập sẽ có các câu hỏi phát âm với hai dạng câu hỏi chính: chọn đáp án đúng và phát âm.</p>
                            <p><strong>Dạng câu hỏi:</strong></p>
                            <ul>
                                <li><strong>Trắc nghiệm:</strong> Nghe một câu và chọn đáp án đúng nhất từ các lựa chọn đưa ra.</li>
                                <li><strong>Phát Âm:</strong> Người dùng sẽ nghe một câu hoặc cụm từ, sau đó phát âm lại. Hệ thống sẽ ghi lại giọng nói, phân tích và hiển thị độ chính xác theo tỷ lệ phần trăm (%).</li>
                            </ul>
                            <p><strong>Lưu ý:</strong></p>
                            <ul>
                                <li>Nhấn <strong>Kiểm tra</strong> sau khi hoàn thành mỗi câu hỏi để xem kết quả và giải thích.</li>
                                <li>Khi thực hiện câu hỏi <strong>phát âm</strong>, hệ thống sẽ ghi lại giọng nói của bạn, phân tích và chỉ ra các từ phát âm đúng và sai. Độ chính xác sẽ được hiển thị dưới dạng phần trăm.</li>
                                <li>Thời gian làm bài là 20 phút. Hãy cố gắng hoàn thành đúng giờ nhé.</li>
                                <li>Sau khi nhấn <strong>Nộp bài</strong>, hệ thống sẽ hiển thị kết quả luyện tập, bao gồm: tổng số câu hỏi, số câu trả lời đúng, tỷ lệ chính xác (%) và phân tích chi tiết về các từ bạn đã phát âm đúng hoặc sai. Nhấn <strong>Xem lịch sử</strong> để xem lại các câu hỏi đã làm và đánh giá độ chính xác của từng câu.</li>
                            </ul>
                            <p>Chúc bạn luyện tập tốt và cải thiện kỹ năng phát âm của mình!</p>
                        </div>
                        <div className="custom-modal-footer">
                            <button
                                className="footer-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isLoading && <LoadingScreen />}
        </>
    );
}

export default PronunciationExercise;