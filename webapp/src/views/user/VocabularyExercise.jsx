import React, { useEffect, useState, useRef } from "react";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import VocabularyExerciseCard from "@/components/user/vocabularyexercise/VocabularyExerciseCard.jsx";
import { useNavigate } from "react-router-dom";
import { VocabularyExerciseService } from "@/services/VocabularyExerciseService.jsx";

function VocabularyExercise() {
    const [allVocabularyExercises, setAllVocabularyExercises] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [unlockedVocabularyExercises, setUnlockedVocabularyExercises] = useState([]);
    const [roadmapProgress, setRoadmapProgress] = useState({ unlockedCount: 0, totalCount: 0, percent: 0 });
    const currentLessonRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Bài luyện tập từ vựng - EasyTalk";
        VocabularyExerciseService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const roadmap = await VocabularyExerciseService.fetchVocabularyExerciseRoadmap();
                const items = roadmap.items || [];
                setAllVocabularyExercises(items);
                setUnlockedVocabularyExercises(items.filter(item => item.isUnlocked).map(item => item._id.toString()));
                setRoadmapProgress(roadmap.progress || { unlockedCount: 0, totalCount: items.length, percent: 0 });
            } catch (err) {
                console.error("Error fetching vocabulary exercises:", err);
                setAllVocabularyExercises([]);
                setUnlockedVocabularyExercises([]);
                setRoadmapProgress({ unlockedCount: 0, totalCount: 0, percent: 0 });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const isVocabularyExerciseUnlocked = (vocabularyExerciseId) => {
        return unlockedVocabularyExercises.includes(vocabularyExerciseId.toString());
    };

    const findCurrentVocabularyExerciseIndex = () => {
        if (unlockedVocabularyExercises.length === 0) return -1;
        const lastUnlockedId = unlockedVocabularyExercises[unlockedVocabularyExercises.length - 1];
        return allVocabularyExercises.findIndex(item => item._id.toString() === lastUnlockedId);
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
                            <i className="fas fa-spell-check me-2"></i> LỘ TRÌNH LUYỆN TẬP TỪ VỰNG TỪ A-Z
                            <i
                                className="fas fa-question-circle help-icon"
                                style={{ cursor: "pointer", marginLeft: "10px" }}
                                onClick={() => setIsModalOpen(true)}
                            ></i>
                        </h1>
                        <p className="user-road-subtitle">
                            Hoàn thành từng bài để mở khóa bài tiếp theo • Đã mở khóa: {roadmapProgress.unlockedCount} / {roadmapProgress.totalCount}
                        </p>
                        <button className="btn_2 mb-4" type="button" onClick={() => navigate("/vocabulary-exercise/history")}>
                            <i className="fas fa-history"></i> LỊCH SỬ LÀM BÀI LUYỆN TẬP TỪ VỰNG
                        </button>
                        <div className="user-road-progress">
                            <div className="user-progress-bar">
                                <div className="user-progress-fill" style={{ width: `${roadmapProgress.percent}%` }}/>
                            </div>
                            <span className="user-progress-text">
                                {roadmapProgress.percent}% hoàn thành
                            </span>
                        </div>
                    </div>
                </div>
                <div className="container">
                    <div className="user-road-timeline">
                        {allVocabularyExercises.map((item, index) => {
                            const isUnlocked = item.isUnlocked ?? isVocabularyExerciseUnlocked(item._id);
                            const currentIndex = findCurrentVocabularyExerciseIndex();
                            const isCurrent = item.isCurrent ?? index === currentIndex;
                            return (
                                <div key={item._id} ref={isCurrent ? currentLessonRef : null} >
                                    <VocabularyExerciseCard item={item} index={index} isUnlocked={isUnlocked} isCurrent={isCurrent} />
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
                            <h5>Hướng Dẫn Bài Luyện Tập Từ Vựng</h5>
                            <button
                                className="close-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>Chọn bài tập từ vựng mà bạn muốn luyện tập từ danh sách.</p>
                            <p>Mỗi bài tập sẽ có các câu hỏi từ vựng bao gồm các dạng câu hỏi như: trắc nghiệm, điền từ vào lỗ trống và dịch nghĩa.</p>
                            <p><strong>Dạng câu hỏi:</strong></p>
                            <ul>
                                <li><strong>Trắc Nghiệm:</strong> Chọn đáp án đúng nhất trong các lựa chọn được đưa ra.</li>
                                <li><strong>Điền Từ Vào Chỗ Trống:</strong> Điền từ thích hợp vào ô trống để hoàn thành câu.</li>
                                <li><strong>Dịch Nghĩa:</strong> Dịch câu từ Tiếng Việt sang Tiếng Anh hoặc ngược lại.</li>
                            </ul>
                            <p><strong>Lưu ý:</strong></p>
                            <ul>
                                <li>Nhấn <strong>Kiểm tra</strong> sau khi trả lời mỗi câu hỏi để xem đáp án và giải thích.</li>
                                <li>Mỗi bộ đề có số lượng câu hỏi khác nhau, hãy cố gắng hoàn thành hết các câu hỏi.</li>
                                <li>Thời gian làm bài là 20 phút. Hãy cố gắng hoàn thành đúng giờ nhé.</li>
                                <li>Nhấn <strong>Nộp bài</strong> bài thì hệ thống sẽ hiển thị kết quả bài luyện tập gồm có: số câu hỏi, số câu đúng, số câu sai, tỷ lệ chính xác (%). Nhấn <strong>Xem lịch sử</strong> để thấy những câu mình đã làm, để biết mình đúng hoặc sai chỗ nào.</li>
                            </ul>
                            <p>Chúc bạn luyện tập tốt và cải thiện từ vựng của mình!</p>
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

export default VocabularyExercise;
