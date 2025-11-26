import React, { useEffect, useState, useRef } from "react";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import GrammarExerciseCard from "@/components/user/grammarexercise/GrammarExerciseCard.jsx";
import { useNavigate } from "react-router-dom";
import { GrammarExerciseService } from "@/services/GrammarExerciseService.jsx";

function GrammarExercise() {
    const [allGrammarExercises, setAllGrammarExercises] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [unlockedGrammarExercises, setUnlockedGrammarExercises] = useState([]);
    const currentLessonRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Bài luyện tập ngữ pháp - EasyTalk";
        GrammarExerciseService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const allResp = await GrammarExerciseService.fetchGrammarExercise(1, 10000);
                const all = allResp.data || [];
                setAllGrammarExercises(all);
                if (all.length > 0) {
                    try {
                        const detailResp = await GrammarExerciseService.getGrammarExerciseDetail(all[0]._id);
                        const userProg = detailResp?.userProgress || null;
                        const unlockedIds = Array.isArray(userProg?.unlockedGrammarExercises) ? userProg.unlockedGrammarExercises.map(s => s.toString()) : [];
                        setUnlockedGrammarExercises(unlockedIds);
                    } catch (err) {
                        console.error("Error fetching user progress:", err);
                        setUnlockedGrammarExercises([]);
                    }
                } else {
                    setUnlockedGrammarExercises([]);
                }
            } catch (err) {
                console.error("Error fetching grammar exercises:", err);
                setAllGrammarExercises([]);
                setUnlockedGrammarExercises([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const isGrammarExerciseUnlocked = (grammarExerciseId) => {
        return unlockedGrammarExercises.includes(grammarExerciseId.toString());
    };

    const findCurrentGrammarExerciseIndex = () => {
        if (unlockedGrammarExercises.length === 0) return -1;
        const lastUnlockedId = unlockedGrammarExercises[unlockedGrammarExercises.length - 1];
        return allGrammarExercises.findIndex(item => item._id.toString() === lastUnlockedId);
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
                            <i className="fas fa-pen me-2"></i> LỘ TRÌNH LUYỆN TẬP NGỮ PHÁP TỪ A-Z
                            <i
                                className="fas fa-question-circle help-icon"
                                style={{ cursor: "pointer", marginLeft: "10px" }}
                                onClick={() => setIsModalOpen(true)}
                            ></i>
                        </h1>
                        <p className="user-road-subtitle">
                            Hoàn thành từng bài để mở khóa bài tiếp theo • Đã mở khóa: {unlockedGrammarExercises.length} / {allGrammarExercises.length}
                        </p>
                        <div className="user-road-progress">
                            <div className="user-progress-bar">
                                <div className="user-progress-fill" style={{ width: `${allGrammarExercises.length > 0 ? (unlockedGrammarExercises.length / allGrammarExercises.length) * 100 : 0}%` }}/>
                            </div>
                            <span className="user-progress-text">
                                {allGrammarExercises.length > 0 ? Math.round((unlockedGrammarExercises.length / allGrammarExercises.length) * 100) : 0}% hoàn thành
                            </span>
                        </div>
                    </div>
                </div>
                <div className="container">
                    <div className="user-road-timeline">
                        {allGrammarExercises.map((item, index) => {
                            const isUnlocked = isGrammarExerciseUnlocked(item._id);
                            const currentIndex = findCurrentGrammarExerciseIndex();
                            const isCurrent = index === currentIndex;
                            return (
                                <div key={item._id} ref={isCurrent ? currentLessonRef : null} >
                                    <GrammarExerciseCard item={item} index={index} isUnlocked={isUnlocked} isCurrent={isCurrent} />
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
                            <h5>Hướng Dẫn Bài Luyện Tập Ngữ Pháp</h5>
                            <button
                                className="close-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>Chọn bài tập ngữ pháp mà bạn muốn luyện tập từ danh sách.</p>
                            <p>Mỗi bài tập sẽ có các câu hỏi ngữ pháp bao gồm các dạng câu hỏi như: trắc nghiệm, điền từ vào lỗ trống và dịch nghĩa.</p>
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
                            <p>Chúc bạn luyện tập tốt và cải thiện ngữ pháp của mình!</p>
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

export default GrammarExercise;