import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import PronunciationSentence from "../../components/user/pronunciation/PronunciationSentence";
import PronunciationQuiz from "../../components/user/pronunciation/PronunciationQuiz";
import PronunciationComplete from "../../components/user/pronunciation/PronunciationComplete";
import { PronunciationService } from "../../services/PronunciationService";

function PronunciationDetail() {
    const { id } = useParams();
    const [pronunciation, setPronunciation] = useState(null);
    const [displayContent, setDisplayContent] = useState("");
    const [showQuiz, setShowQuiz] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const contentRef = useRef(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [totalSteps, setTotalSteps] = useState(1);

    useEffect(() => {
        PronunciationService.getPronunciationById(id).then((res) => {
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
        });
    }, [id]);

    const handleStepChange = (step, total) => {
        setCurrentStep(step);
        setTotalSteps(total);
    };
    const progressPercent = Math.round((currentStep / totalSteps) * 100);

    if (!pronunciation) return <p className="no-pronunciation">Đang tải...</p>;

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
                            window.alert("Chúc mừng! Bạn đã hoàn thành bài phát âm. Bài tiếp theo đã được mở khóa.");
                            window.location.href = "/pronunciation";
                        } catch (err) {
                            console.error("Error completing pronunciation:", err);
                            window.alert("Có lỗi xảy ra khi cập nhật tiến độ.");
                        }
                    }} 
                />
            )}
        </div>
    );
}

export default PronunciationDetail;