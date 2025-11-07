import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import Swal from "sweetalert2";
import html2canvas from "html2canvas";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import FlashCardListCard from "@/components/user/flashcardList/FlashCardListCard.jsx";
import CreateFlashCardList from "@/components/user/flashcardList/CreateFlashCardList.jsx";
import FlashCardGraph from "@/components/user/flashcardList/FlashCardGraph.jsx";
import FlashCardGoal from "@/components/user/flashcardList/FlashCardGoal.jsx";
import { FlashCardService } from "@/services/FlashCardService.jsx";

const BADGES = [
    { name: "Tân binh chăm chỉ", threshold: 1000, icon: "🥉" },
    { name: "Chiến binh ngôn từ", threshold: 3000, icon: "🥈" },
    { name: "Bậc thầy từ vựng", threshold: 6000, icon: "🥇" },
    { name: "Huyền thoại ôn tập", threshold: 10000, icon: "🏆" },
    { name: "Vua từ vựng", threshold: 15000, icon: "👑" },
];

const FlashCardList = () => {
    const [flashcards, setFlashcards] = useState([]);
    const [dailyReviews, setDailyReviews] = useState({});
    const [totalFlashcards, setTotalFlashcards] = useState(0);
    const [totalRemembered, setTotalRemembered] = useState(0);
    const [totalToReview, setTotalToReview] = useState(0);
    const [dailyGoal, setDailyGoal] = useState({ goal: 20, todayCount: 0, isAchieved: false });
    const [showConfetti, setShowConfetti] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [goalModalOpen, setGoalModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("mine");
    const [lastBadge, setLastBadge] = useState(localStorage.getItem("lastBadge") || "");
    const [monthlyBadges, setMonthlyBadges] = useState({ monthlyTotal: 0, status: [] });

    const loadFlashcards = async (page = currentPage, tab = activeTab) => {
        setIsLoading(true);
        try {
            const data = await FlashCardService.fetchFlashcardLists(page, 3, tab);
            setFlashcards(data.flashcardLists || []);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error(err);
            setFlashcards([]);
        }
        setIsLoading(false);
    };

    const loadDailyGoal = async () => {
        const data = await FlashCardService.fetchDailyGoal();
        setDailyGoal(data);
        if (data.isAchieved && !showConfetti) {
            triggerConfetti();
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
        }
    };

    const triggerConfetti = () => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#bb0000', '#ffffff', '#00bb00']
        });
    };

    useEffect(() => {
        document.title = "Danh sách flashcard - EasyTalk";
        FlashCardService.resetAlertFlag();
        setCurrentPage(1);
    }, [activeTab]);

    useEffect(() => {
        loadFlashcards(currentPage, activeTab);
    }, [currentPage, activeTab]);

    useEffect(() => {
        if (activeTab === "mine") {
            FlashCardService.fetchDailyReviews().then((data) => {
                setDailyReviews(data.dailyFlashcardReviews || {});
            });
            loadDailyGoal();
            loadBadges();
        } else {
            setDailyReviews({});
            setDailyGoal({ goal: 20, todayCount: 0, isAchieved: false });
            setMonthlyBadges({ monthlyTotal: 0, status: [] });
        }
    }, [activeTab]);

    const loadBadges = async () => {
        try {
            const data = await FlashCardService.fetchBadges();
            setMonthlyBadges(data);
        } catch (err) {
            console.error("Error loading badges:", err);
            setMonthlyBadges({ monthlyTotal: 0, status: [] });
        }
    };

    useEffect(() => {
        if (activeTab === "mine" && flashcards.length > 0) {
            let totalFc = 0, totalRem = 0, totalRev = 0;
            flashcards.forEach((list) => {
                totalFc += list.wordCount || 0;
                totalRem += list.remembered || 0;
                totalRev += list.toReview || 0;
            });
            setTotalFlashcards(totalFc);
            setTotalRemembered(totalRem);
            setTotalToReview(totalRev);
        } else {
            setTotalFlashcards(0);
            setTotalRemembered(0);
            setTotalToReview(0);
        }
    }, [flashcards, activeTab]);

    const handleGoalUpdate = (newGoal) => {
        setDailyGoal(prev => ({ ...prev, goal: newGoal }));
        setGoalModalOpen(false);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            Swal.fire({
                icon: "success",
                title: "Đã copy!",
                text: "Chia sẻ tiến độ của bạn.",
                timer: 1500,
            });
        });
    };

    const handleShareProgress = async () => {
        const shareText = `Tôi đã nhớ ${totalRemembered} từ với EasyTalk Flashcard! Cần ôn: ${totalToReview}. Streak: ${dailyGoal.streak || 0} ngày. Thử ngay! ${window.location.origin}/flashcards #EasyTalkVocab`;
        const section = document.querySelector(".contribution-section");
        if (!section) return Swal.fire("Lỗi", "Không tìm thấy phần tiến độ để chụp ảnh.", "error");
        Swal.fire({
            title: "Đang tạo ảnh chia sẻ...",
            didOpen: async () => {
                Swal.showLoading();
                try {
                    const canvas = await html2canvas(section, {
                        backgroundColor: "#f9fafb",
                        scale: 2,
                        useCORS: true,
                    });
                    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
                    const file = new File([blob], "tien-do-easytalk.png", { type: "image/png" });
                    const imgUrl = URL.createObjectURL(blob);
                    Swal.close();
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            files: [file],
                            text: shareText,
                            title: "Tiến độ Flashcard của tôi",
                        });
                    } else {
                        Swal.fire({
                            title: "Ảnh tiến độ của bạn",
                            html: `
                                <img src="${imgUrl}" alt="Tiến độ học" style="max-width: 100%; border-radius: 10px; margin-bottom: 10px;">
                                <p>Bạn có thể lưu ảnh hoặc copy nội dung để chia sẻ:</p>
                                <button id="copyShare" class="btn btn-success">
                                    <i class="fas fa-copy"></i> Copy nội dung chia sẻ
                                </button>
                            `,
                            didOpen: () => {
                                document.getElementById("copyShare").addEventListener("click", () => {
                                    copyToClipboard(shareText);
                                });
                            },
                        });
                    }
                } catch (err) {
                    Swal.fire("Lỗi", "Không thể tạo ảnh chia sẻ.", "error");
                    console.error(err);
                }
            },
        });
    };

    useEffect(() => {
        if (activeTab !== "mine" || !monthlyBadges.monthlyTotal) return;
        const totalMonthReviews = monthlyBadges.monthlyTotal;
        const latestBadge = BADGES.slice().reverse().find(b => totalMonthReviews >= b.threshold);
        if (latestBadge && latestBadge.name !== lastBadge) {
            setLastBadge(latestBadge.name);
            localStorage.setItem("lastBadge", latestBadge.name);
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            Swal.fire({
                title: `${latestBadge.icon} ${latestBadge.name}!`,
                html: `<div style="font-size:18px">Bạn đã đạt ${latestBadge.threshold} lượt ôn trong tháng này!<br><br>
                    <span style="font-size:40px">${latestBadge.icon}</span></div>`,
                background: "#1c1c1c",
                color: "#fff",
                confirmButtonText: "Tuyệt vời 🎉",
            });
        }
    }, [monthlyBadges]);

    const renderPagination = () => {
        const pages = [];
        if (currentPage > 1) {
            pages.push(
                <li className="page-item" key="prev">
                    <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        &laquo; Previous
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
                        Next &raquo;
                    </button>
                </li>
            );
        }
        return pages;
    };

    const isMine = activeTab === "mine";

    const renderBadges = () => {
        const totalMonthReviews = monthlyBadges.monthlyTotal || 0;
        const handleBadgeClick = (badge, unlocked) => {
            Swal.fire({
                title: `${badge.icon} ${badge.name}`,
                html: unlocked
                    ? `<div style="font-size:18px">
                        🎉 Bạn đã đạt <b>${badge.threshold}</b> lượt ôn trong tháng này!<br><br>
                        <span style="font-size:40px">${badge.icon}</span>
                    </div>`
                    : `<div style="font-size:18px">
                        Bạn cần thêm <b>${badge.threshold - totalMonthReviews}</b> lượt ôn để đạt huy hiệu này.<br><br>
                        <span style="font-size:40px; opacity:0.5">${badge.icon}</span>
                    </div>`,
                background: unlocked ? "#1c1c1c" : "#222",
                color: "#fff",
                confirmButtonText: unlocked ? "Tuyệt vời 🎉" : "Cố lên 💪",
            });
        };
        return (
            <div className="my-badges mt-4 text-center">
                <h5 className="mb-3">🏅 Huy hiệu tháng này của bạn</h5>
                <div className="badge-grid">
                    {BADGES.map((b) => {
                        const unlocked = totalMonthReviews >= b.threshold;
                        return (
                            <div
                                key={b.name}
                                className={`badge-item ${unlocked ? "unlocked" : "locked"}`}
                                title={`${b.name} - ${b.threshold} review/tháng`}
                                onClick={() => handleBadgeClick(b, unlocked)}
                            >
                                <div className="badge-circle">
                                    <span className="badge-icon">{b.icon}</span>
                                </div>
                                <div className="badge-label">{b.name}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="lesson-container">
            <div className="hero-mini d-flex justify-content-between align-items-center">
                <h3 className="hero-title mb-0">DANH SÁCH TỪ VỰNG FLASHCARD</h3>
            </div>
            <div className="container">
                <div className="flashcard-menu d-flex justify-content-between align-items-center mb-4">
                    <div className="flashcard-btn-group btn-group">
                        <button
                            className={`flashcard-btn ${activeTab == "mine" ? "active" : ""}`}
                            onClick={() => setActiveTab("mine")}
                        >
                            Dành cho bạn
                        </button>
                        <button
                            className={`flashcard-btn ${activeTab == "explore" ? "active" : ""}`}
                            onClick={() => setActiveTab("explore")}
                        >
                            Khám phá
                        </button>
                    </div>
                </div>
                {isMine && (
                    <div className="contribution-section mb-4">
                        <div className="goal-header d-flex justify-content-between align-items-center">
                            <h5>Lịch sử ôn tập của bạn</h5>
                            <button className="btn_4 btn-sm" onClick={() => setGoalModalOpen(true)}>
                                Đặt mục tiêu
                            </button>
                        </div>
                        {dailyGoal.goal > 0 && (
                            <div className="daily-goal-progress mb-3">
                                <div className="progress position-relative">
                                    <div
                                        className="progress-bar"
                                        role="progressbar"
                                        style={{ width: `${(dailyGoal.todayCount / dailyGoal.goal) * 100}%` }}
                                    ></div>
                                    <span
                                        className={`progress-text ${
                                            (dailyGoal.todayCount / dailyGoal.goal) * 100 > 30
                                                ? "text-white"
                                                : "text-green"
                                        }`}
                                    >
                                        {dailyGoal.todayCount}/{dailyGoal.goal} review hôm nay
                                    </span>
                                </div>
                                {dailyGoal.isAchieved && <small className="text-success">🎉 Đã đạt mục tiêu!</small>}
                            </div>
                        )}
                        <div className="flashcard-stats-row">
                            <div className="flashcard-stat">
                                <span className="stat-label">Tổng số flashcard</span>
                                <span className="stat-value">{totalFlashcards}</span>
                            </div>
                            <div className="flashcard-stat">
                                <span className="stat-label">Đã nhớ</span>
                                <span className="stat-value">{totalRemembered}</span>
                            </div>
                            <div className="flashcard-stat">
                                <span className="stat-label">Cần ôn tập</span>
                                <span className="stat-value red">{totalToReview}</span>
                            </div>
                        </div>
                        <FlashCardGraph dailyReviews={dailyReviews} />
                        {renderBadges()}
                    </div>
                )}
                <CreateFlashCardList
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onCreated={() => loadFlashcards(1, activeTab)}
                />
                <FlashCardGoal
                    isOpen={goalModalOpen}
                    onClose={() => setGoalModalOpen(false)}
                    onUpdate={handleGoalUpdate}
                    currentGoal={dailyGoal}
                />
                {isMine && (
                    <div className="flashcard-action-row d-flex justify-content-between align-items-center mb-4">
                        <button className="btn_1" onClick={() => setIsModalOpen(true)}>
                            <i className="fas fa-plus mr-2"></i>Tạo mới
                        </button>
                        <button className="btn_1 btn-sm" onClick={handleShareProgress}>
                            <i className="fas fa-share-alt"></i> Share
                        </button>
                    </div>
                )}
                <div className="lesson-list">
                    {flashcards.length > 0 ? (
                        <div className="container">
                            <div className="row">
                                {flashcards.map((flashcardLists) => (
                                    <FlashCardListCard
                                        key={flashcardLists._id}
                                        flashcardLists={flashcardLists}
                                        isMine={isMine}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-center no-stories">Không có flashcard nào.</p>
                    )}
                </div>
                <nav aria-label="Page navigation">
                    <ul className="pagination justify-content-center" id="pagination-controls">
                        {renderPagination()}
                    </ul>
                </nav>
            </div>
            {isLoading && <LoadingScreen />}
        </div>
    );
};

export default FlashCardList;