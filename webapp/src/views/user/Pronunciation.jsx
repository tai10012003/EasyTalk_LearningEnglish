import React, { useEffect, useState, useRef } from "react";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import PronunciationCard from "@/components/user/pronunciation/PronunciationCard.jsx";
import { useNavigate } from "react-router-dom";
import { PronunciationService } from "@/services/PronunciationService.jsx";

function Pronunciation() {
    const [allPronunciations, setAllPronunciations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [unlockedPronunciations, setUnlockedPronunciations] = useState([]);
    const currentLessonRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Bài học phát âm - EasyTalk";
        PronunciationService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const allResp = await PronunciationService.fetchPronunciations(1, 10000);
                const all = allResp.pronunciations || [];
                setAllPronunciations(all);
                if (all.length > 0) {
                    try {
                        const detailResp = await PronunciationService.getPronunciationDetail(all[0]._id);
                        const userProg = detailResp?.userProgress || null;
                        const unlockedIds = Array.isArray(userProg?.unlockedPronunciations) ? userProg.unlockedPronunciations.map(s => s.toString()) : [];
                        setUnlockedPronunciations(unlockedIds);
                    } catch (err) {
                        console.error("Error fetching user progress:", err);
                        setUnlockedPronunciations([]);
                    }
                } else {
                    setUnlockedPronunciations([]);
                }
            } catch (err) {
                console.error("Error fetching pronunciations:", err);
                setAllPronunciations([]);
                setUnlockedPronunciations([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const isPronunciationUnlocked = (pronunciationId) => {
        return unlockedPronunciations.includes(pronunciationId.toString());
    };

    const findCurrentPronunciationIndex = () => {
        if (unlockedPronunciations.length === 0) return -1;
        const lastUnlockedId = unlockedPronunciations[unlockedPronunciations.length - 1];
        return allPronunciations.findIndex(item => item._id.toString() === lastUnlockedId);
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
                            <i className="fas fa-microphone-alt"></i> LỘ TRÌNH HỌC PHÁT ÂM TỪ A-Z
                            <i
                                className="fas fa-question-circle help-icon"
                                style={{ cursor: "pointer", marginLeft: "10px" }}
                                onClick={() => setIsModalOpen(true)}
                            ></i>
                        </h1>
                        <p className="user-road-subtitle">
                            Hoàn thành từng bài để mở khóa bài tiếp theo • Đã mở khóa: {unlockedPronunciations.length} / {allPronunciations.length}
                        </p>
                        <div className="user-road-progress">
                            <div className="user-progress-bar">
                                <div className="user-progress-fill" style={{ width: `${allPronunciations.length > 0 ? (unlockedPronunciations.length / allPronunciations.length) * 100 : 0}%` }}/>
                            </div>
                            <span className="user-progress-text">
                                {allPronunciations.length > 0 ? Math.round((unlockedPronunciations.length / allPronunciations.length) * 100) : 0}% hoàn thành
                            </span>
                        </div>
                    </div>
                </div>
                <div className="container">
                    <div className="user-road-timeline">
                        {allPronunciations.map((item, index) => {
                            const isUnlocked = isPronunciationUnlocked(item._id);
                            const currentIndex = findCurrentPronunciationIndex();
                            const isCurrent = index === currentIndex;
                            return (
                                <div key={item._id} ref={isCurrent ? currentLessonRef : null} >
                                    <PronunciationCard item={item} index={index} isUnlocked={isUnlocked} isCurrent={isCurrent} />
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="user-floating-buttons">
                    <button className="user-scroll-current-btn" onClick={scrollToCurrentLesson} title="Cuộn đến bài học hiện tại" >
                        <i className="fas fa-play-circle"></i>
                        <span className="user-scroll-current-text">Tiếp tục học</span>
                        <span className="user-scroll-hot-badge">HOT</span>
                    </button>
                    <button className="user-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} title="Lên đầu trang" >
                        <i className="fas fa-arrow-up"></i>
                    </button>
                </div>
            </div>
            {isModalOpen && (
                <div className="custom-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="custom-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="custom-modal-header">
                            <h5><i className="fas fa-info-circle me-2"></i>Hướng Dẫn Bài Học Phát Âm</h5>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>
                                Chào mừng bạn đến với <strong>Lộ trình phát âm từ A-Z</strong>! 
                                Bạn sẽ học từng âm một cách khoa học, từ cơ bản đến nâng cao.
                            </p>
                            <p><strong>Các bước trong mỗi bài học phát âm:</strong></p>
                            <ol>
                                <li><strong>Xem video hướng dẫn</strong> – Quan sát miệng, lưỡi, cách đặt hơi của giáo viên bản xứ</li>
                                <li><strong>Nghe & lặp lại</strong> – Nghe từng câu và luyện nói theo thật chuẩn</li>
                                <li><strong>So sánh giọng bạn với bản xứ</strong> – Hệ thống sẽ chấm điểm độ giống (0–100)</li>
                                <li><strong>Luyện tập nhiều lần</strong> – Càng luyện càng lên điểm, càng giống người bản xứ</li>
                                <li><strong>Làm bài kiểm tra nhỏ</strong> – Để mở khóa bài học tiếp theo</li>
                            </ol>
                            <p><strong>Biểu tượng trên lộ trình:</strong></p>
                            <ul>
                                <li><i className="fas fa-check text-success"></i> <strong>Đã hoàn thành</strong> – Bạn có thể ôn lại bất kỳ lúc nào</li>
                                <li><i className="fas fa-play-circle text-primary"></i> <strong>Bài đang mở</strong> – Hãy học ngay để mở khóa bài tiếp theo!</li>
                                <li><i className="fas fa-lock text-muted"></i> <strong>Chưa mở khóa</strong> – Hoàn thành bài hiện tại để tiếp tục</li>
                            </ul>
                            <div className="alert alert-success mt-3" style={{fontSize: '0.95rem'}}>
                                <strong>Mẹo hay:</strong> Luyện mỗi bài ít nhất <strong>3–5 lần</strong> cho đến khi đạt 
                                <span className="text-success"> 90+</span> điểm giống bản xứ thì chuyển sang bài mới nhé!
                            </div>
                            <p className="text-center mt-4">
                                <strong>Chỉ cần kiên trì 10–15 phút mỗi ngày – bạn sẽ nói chuẩn như người bản xứ!</strong>
                            </p>
                        </div>
                        <div className="custom-modal-footer">
                            <button className="footer-btn" onClick={() => setIsModalOpen(false)}>
                                Đã hiểu, bắt đầu học ngay!
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isLoading && <LoadingScreen />}
        </>
    );
}

export default Pronunciation;