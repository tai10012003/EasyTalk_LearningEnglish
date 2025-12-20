import React, { useEffect, useState, useRef, useMemo } from "react";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import GrammarCard from "@/components/user/grammar/GrammarCard.jsx";
import { useNavigate } from "react-router-dom";
import { GrammarService } from "@/services/GrammarService.jsx";

function Grammar() {
    const [allGrammars, setAllGrammars] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [unlockedGrammars, setUnlockedGrammars] = useState([]);
    const currentLessonRef = useRef(null);
    const navigate = useNavigate();

    const levels = [
        { key: "A1", name: "GIAI ĐOẠN 1: CƠ BẢN - A1 (Người mới bắt đầu)", color: "#4CAF50" },
        { key: "A2", name: "GIAI ĐOẠN 2: SƠ CẤP - A2 (Sơ cấp)", color: "#8BC34A" },
        { key: "B1", name: "GIAI ĐOẠN 3: TRUNG CẤP - B1 (Trung cấp)", color: "#FFC107" },
        { key: "B2", name: "GIAI ĐOẠN 4: TRUNG CẤP CAO - B2 (Thượng cấp)", color: "#FF9800" },
        { key: "C1", name: "GIAI ĐOẠN 5: CAO CẤP - C1 (Nâng cao)", color: "#F44336" },
    ];

    const groupedGrammars = useMemo(() => {
        const grouped = {};
        levels.forEach(l => (grouped[l.key] = {}));
        allGrammars.forEach((item, index) => {
            let levelKey = item.level || "A1";
            let category = item.category || "Module 1: Nền tảng căn bản";
            if (!grouped[levelKey][category]) {
                grouped[levelKey][category] = [];
            }
            grouped[levelKey][category].push({ ...item, originalIndex: index });
        });
        return grouped;
    }, [allGrammars]);

    useEffect(() => {
        document.title = "Bài học ngữ pháp - EasyTalk";
        GrammarService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const allResp = await GrammarService.fetchGrammars(1, 10000);
                const all = allResp.grammars || [];
                setAllGrammars(all);
                if (all.length > 0) {
                    try {
                        const detailResp = await GrammarService.getGrammarDetail(all[0]._id);
                        const userProg = detailResp?.userProgress || null;
                        const unlockedIds = Array.isArray(userProg?.unlockedGrammars) ? userProg.unlockedGrammars.map(s => s.toString()) : [];
                        setUnlockedGrammars(unlockedIds);
                    } catch (err) {
                        console.error("Error fetching user progress:", err);
                        setUnlockedGrammars([]);
                    }
                } else {
                    setUnlockedGrammars([]);
                }
            } catch (err) {
                console.error("Error fetching grammars:", err);
                setAllGrammars([]);
                setUnlockedGrammars([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const isGrammarUnlocked = (grammarId) => {
        return unlockedGrammars.includes(grammarId.toString());
    };

    const currentIndex = useMemo(() => {
        if (unlockedGrammars.length === 0 || allGrammars.length === 0) return -1;
        const lastUnlockedId = unlockedGrammars[unlockedGrammars.length - 1];
        return allGrammars.findIndex(item => item._id.toString() === lastUnlockedId);
    }, [unlockedGrammars, allGrammars]);

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
                            <i className="fas fa-language me-2"></i> LỘ TRÌNH HỌC NGỮ PHÁP TỪ A-Z
                            <i
                                className="fas fa-question-circle help-icon"
                                style={{ cursor: "pointer", marginLeft: "10px" }}
                                onClick={() => setIsModalOpen(true)}
                            ></i>
                        </h1>
                        <p className="user-road-subtitle">
                            Hoàn thành từng bài để mở khóa bài tiếp theo • Đã mở khóa: {unlockedGrammars.length} / {allGrammars.length}
                        </p>
                        <div className="user-road-progress">
                            <div className="user-progress-bar">
                                <div className="user-progress-fill" style={{ width: `${allGrammars.length > 0 ? (unlockedGrammars.length / allGrammars.length) * 100 : 0}%` }}/>
                            </div>
                            <span className="user-progress-text">
                                {allGrammars.length > 0 ? Math.round((unlockedGrammars.length / allGrammars.length) * 100) : 0}% hoàn thành
                            </span>
                        </div>
                    </div>
                </div>
                <div className="container">
                    <div className="user-road-timeline">
                        {levels.map((level) => {
                            const categories = groupedGrammars[level.key];
                            if (!categories || Object.keys(categories).length === 0) return null;
                            return (
                                <div key={level.key} className="user-level-section">
                                    <div className="user-level-header" style={{ backgroundColor: level.color }}>
                                        <h3>{level.name}</h3>
                                    </div>
                                    {Object.keys(categories).map((categoryName) => {
                                        const items = categories[categoryName];
                                        return (
                                            <div key={categoryName} className="user-module-section">
                                                <div className="user-module-header">
                                                    <h3>{categoryName}</h3>
                                                </div>
                                                <div className="user-module-cards">
                                                    {items.map((item) => {
                                                        const isUnlocked = isGrammarUnlocked(item._id);
                                                        const isCurrent = item.originalIndex === currentIndex;
                                                        return (
                                                            <div key={item._id} ref={isCurrent ? currentLessonRef : null}
                                                            >
                                                                <GrammarCard item={item} index={item.originalIndex} isUnlocked={isUnlocked} isCurrent={isCurrent} />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="user-floating-buttons">
                    <button className="user-scroll-current-btn" onClick={scrollToCurrentLesson} title="Cuộn đến bài học hiện tại">
                        <i className="fas fa-play-circle"></i>
                        <span className="user-scroll-current-text">Tiếp tục học</span>
                        <span className="user-scroll-hot-badge">HOT</span>
                    </button>
                    <button className="user-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} title="Lên đầu trang">
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
                            <h5><i className="fas fa-info-circle me-2"></i>Hướng Dẫn Bài Học Ngữ Pháp</h5>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>
                                Chào mừng bạn đến với <strong>Lộ trình ngữ pháp từ A-Z</strong>! 
                                Bạn sẽ học từng âm một cách khoa học, từ cơ bản đến nâng cao.
                            </p>
                            <p><strong>Các bước trong mỗi bài học ngữ pháp:</strong></p>
                            <ol>
                                <li><strong>Xem video hướng dẫn</strong> – Quan sát cách sử dụng ngữ pháp của giáo viên bản xứ</li>
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

export default Grammar;