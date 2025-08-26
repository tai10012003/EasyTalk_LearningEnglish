import React, { useEffect, useState, useRef } from "react";

function GrammarSentence({ content, onComplete }) {
    const [steps, setSteps] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showButton, setShowButton] = useState(false);
    const stepRefs = useRef([]);

    useEffect(() => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = content;
        const divNodes = Array.from(tempDiv.querySelectorAll("div"));
        const tempSteps = divNodes.map(div => div.outerHTML);
        setSteps(tempSteps);
        stepRefs.current = [];
        setCurrentIndex(0);
        setShowButton(false);
    }, [content]);

    useEffect(() => {
        setShowButton(false);
        if (currentIndex < steps.length - 1) {
            const timer = setTimeout(() => setShowButton(true), 5000);
            return () => clearTimeout(timer);
        }
        if (currentIndex == steps.length - 1 && onComplete) {
            onComplete();
        }
    }, [currentIndex, steps.length, onComplete]);

    const handleNext = () => {
        if (currentIndex < steps.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setTimeout(() => {
                if (stepRefs.current[currentIndex + 1]) {
                    stepRefs.current[currentIndex + 1].scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 50);
        }
    };

    return (
        <>
            {steps.slice(0, currentIndex + 1).map((step, idx) => (
                <div
                    key={idx}
                    ref={el => stepRefs.current[idx] = el}
                    className="grammar-sentence shadow-sm p-4 my-4"
                >
                    <div dangerouslySetInnerHTML={{ __html: step }} />
                    {idx == currentIndex && currentIndex < steps.length - 1 && showButton && (
                        <button className="btn_1 mt-4" onClick={handleNext}>
                            Tiếp tục
                        </button>
                    )}
                </div>
            ))}
        </>
    );
}

export default GrammarSentence;