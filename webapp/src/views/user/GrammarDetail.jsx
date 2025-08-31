import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import GrammarSentence from "../../components/user/grammar/GrammarSentence";
import GrammarQuiz from "../../components/user/grammar/GrammarQuiz";
import GrammarComplete from "../../components/user/grammar/GrammarComplete";
import { GrammarService } from "../../services/GrammarService";

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
        GrammarService.getGrammarById(id).then((res) => {
            if (res && res.content) {
                setGrammar(res);
                setTimeout(() => {
                    setDisplayContent(res.content);
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
        <div className="grammar-detail-container container">
            <div className="grammar-detail-header my-4">
                <div className="section_tittle">
                    <h3>{grammar.title}</h3>
                </div>
                <p className="grammar-detail-description">{grammar.description}</p>
            </div>
            <div className="grammar-progress-container"> 
                <div
                    className="grammar-progress-bar-fill"
                    style={{ width: `${progressPercent}%` }}
                >
                    {progressPercent}%
                </div>
            </div>
            <p className="grammar-step-counter">Step {currentStep} / {totalSteps}</p>
            <div ref={contentRef} className="grammar-content" style={{ display: showQuiz && !isComplete ? "none" : "block" }}>
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
            {isComplete && <GrammarComplete />}
        </div>
    );
}

export default GrammarDetail;