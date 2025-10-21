import React, { useEffect, useState, useRef } from "react";
import { useParams, UNSAFE_NavigationContext } from "react-router-dom";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import PronunciationSentence from "@/components/user/pronunciation/PronunciationSentence.jsx";
import PronunciationQuiz from "@/components/user/pronunciation/PronunciationQuiz.jsx";
import PronunciationComplete from "@/components/user/pronunciation/PronunciationComplete.jsx";
import { PronunciationService } from "@/services/PronunciationService.jsx";
import Swal from "sweetalert2";

function PronunciationDetail() {
    const { id } = useParams();
    const { navigator } = React.useContext(UNSAFE_NavigationContext);
    const [pronunciation, setPronunciation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [displayContent, setDisplayContent] = useState("");
    const [showQuiz, setShowQuiz] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const allowNavigationRef = useRef(false);
    const [pronunciationCompleted, setPronunciationCompleted] = useState(false);
    const contentRef = useRef(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [totalSteps, setTotalSteps] = useState(1);

    useEffect(() => {
        if (!navigator || !pronunciation || pronunciationCompleted) return;
        const originalPush = navigator.push;
        const originalReplace = navigator.replace;
        const handleNavigation = async (originalMethod, args) => {
            if (!allowNavigationRef.current && displayContent && !pronunciationCompleted) {
                const result = await Swal.fire({
                    icon: "warning",
                    title: "Cảnh báo",
                    text: "Bạn đang học giữa chừng. Nếu rời trang, tiến trình sẽ không được lưu. Bạn có chắc muốn rời đi?",
                    showCancelButton: true,
                    confirmButtonText: "Rời đi",
                    cancelButtonText: "Ở lại",
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                });
                if (result.isConfirmed) {
                    allowNavigationRef.current = true;
                    originalMethod.apply(navigator, args);
                }
            } else {
                originalMethod.apply(navigator, args);
            }
        };
        navigator.push = (...args) => handleNavigation(originalPush, args);
        navigator.replace = (...args) => handleNavigation(originalReplace, args);
        return () => {
            navigator.push = originalPush;
            navigator.replace = originalReplace;
        };
    }, [navigator, pronunciation, displayContent, pronunciationCompleted]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!pronunciationCompleted && displayContent) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [pronunciationCompleted, displayContent]);

    useEffect(() => {
        document.title = "Chi tiết bài học phát âm - EasyTalk";
        const fetchPronunciationDetail = async () => {
            setIsLoading(true);
            try {
                const res = await PronunciationService.getPronunciationById(id);
                if (res && res.pronunciation && res.pronunciation.content) {
                    setPronunciation(res.pronunciation);
                    setTimeout(() => {
                        setDisplayContent(res.pronunciation.content);
                        setTimeout(() => {
                            if (contentRef.current) {
                                contentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                            }
                        }, 50);
                    }, 2000);
                }
            } catch (error) {
                console.error("Error fetching pronunciation:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPronunciationDetail();
    }, [id]);

    const handleStepChange = (step, total) => {
        setCurrentStep(step);
        setTotalSteps(total);
    };
    const progressPercent = Math.round((currentStep / totalSteps) * 100);

    if (isLoading) { return <LoadingScreen />; }
    if (!pronunciation) return <p className="no-pronunciation">Đang tải bài học phát âm ...</p>;

    return (
        <div className="lesson-detail-container container">
            <div className="lesson-detail-header my-4">
                <div className="section_tittle">
                    <h3>{pronunciation.title}</h3>
                </div>
                <p className="lesson-detail-description">{pronunciation.description}</p>
            </div>
            <div className="lesson-progress-container"> 
                <div
                    className="lesson-progress-bar-fill"
                    style={{ width: `${progressPercent}%` }}
                >
                    {progressPercent}%
                </div>
            </div>
            <p className="lesson-step-counter">Step {currentStep} / {totalSteps}</p>
            <div ref={contentRef} className="lesson-content" style={{ display: showQuiz && !isComplete ? "none" : "block" }}>
                <PronunciationSentence
                    content={displayContent}
                    onComplete={() => setShowQuiz(true)}
                    onStepChange={handleStepChange}
                />
            </div>
            {pronunciation.quizzes && (
                <div style={{ display: showQuiz ? "block" : "none" }}>
                    <PronunciationQuiz
                        quizzes={pronunciation.quizzes}
                        onComplete={() => setIsComplete(true)}
                    />
                </div>
            )}
            {isComplete && (
                <PronunciationComplete 
                    onComplete={async () => {
                        try {
                            await PronunciationService.completePronunciation(pronunciation._id);
                            setPronunciationCompleted(true);
                            Swal.fire({
                                icon: "success",
                                title: "Hoàn thành!",
                                text: "Chúc mừng! Bạn đã hoàn thành bài học phát âm. Bài học phát âm tiếp theo đã được mở khóa.",
                                confirmButtonText: "Quay lại danh sách bài học phát âm",
                            }).then(() => {
                                window.location.href = "/pronunciation";
                            });
                        } catch (err) {
                            console.error("Error completing pronunciation:", err);
                            Swal.fire({
                                icon: "error",
                                title: "Lỗi",
                                text: "Có lỗi xảy ra khi cập nhật tiến độ."
                            });
                        }
                    }} 
                />
            )}
        </div>
    );
}

export default PronunciationDetail;