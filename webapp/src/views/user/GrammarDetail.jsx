import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import GrammarSentence from "@/components/user/grammar/GrammarSentence.jsx";
import GrammarQuiz from "@/components/user/grammar/GrammarQuiz.jsx";
import GrammarComplete from "@/components/user/grammar/GrammarComplete.jsx";
import { GrammarService } from "@/services/GrammarService.jsx";

function GrammarDetail() {
    const { id } = useParams();
    const [grammar, setGrammar] = useState(null);
    const [displayContent, setDisplayContent] = useState("");
    const [showQuiz, setShowQuiz] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const contentRef = useRef(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [totalSteps, setTotalSteps] = useState(1);

    useEffect(() => {
        document.title = "Chi tiết bài học ngữ pháp - EasyTalk";
        GrammarService.getGrammarById(id).then((res) => {
            if (res && res.grammar && res.grammar.content) {
                setGrammar(res.grammar);
                setTimeout(() => {
                    setDisplayContent(res.grammar.content);
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

    if (!grammar) return <p className="no-grammar">Đang tải...</p>;

    return (
        <div className="lesson-detail-container container">
            <div className="lesson-detail-header my-4">
                <div className="section_tittle">
                    <h3>{grammar.title}</h3>
                </div>
                <p className="lesson-detail-description">{grammar.description}</p>
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
                <GrammarSentence
                    content={displayContent}
                    onComplete={() => setShowQuiz(true)}
                    onStepChange={handleStepChange}
                />
            </div>
            {grammar.quizzes && (
                <div style={{ display: showQuiz ? "block" : "none" }}>
                    <GrammarQuiz
                        quizzes={grammar.quizzes}
                        onComplete={() => setIsComplete(true)}
                    />
                </div>
            )}
            {isComplete && (
                <GrammarComplete 
                    onComplete={async () => {
                        try {
                            await GrammarService.completeGrammar(grammar._id);
                            window.alert("Chúc mừng! Bạn đã hoàn thành bài ngữ pháp. Bài tiếp theo đã được mở khóa.");
                            window.location.href = "/grammar";
                        } catch (err) {
                            console.error("Error completing grammar:", err);
                            window.alert("Có lỗi xảy ra khi cập nhật tiến độ.");
                        }
                    }} 
                />
            )}
        </div>
    );
}

export default GrammarDetail;