import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import GrammarSentence from "../../components/user/grammar/GrammarSentence";
import GrammarComplete from "../../components/user/grammar/GrammarComplete";
import { GrammarService } from "../../services/GrammarService";

function GrammarDetail() {
    const { id } = useParams();
    const [grammar, setGrammar] = useState(null);
    const [displayContent, setDisplayContent] = useState("");
    const [isComplete, setIsComplete] = useState(false);
    const contentRef = useRef(null);

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

    if (!grammar) return <p className="no-grammar">Đang tải...</p>;

    return (
        <div className="grammar-detail-container container">
            <div className="grammar-detail-header my-4">
                <div className="section_tittle">
                    <h3>{grammar.title}</h3>
                </div>
                <p className="grammar-detail-description">{grammar.description}</p>
            </div>
            <div ref={contentRef} className="grammar-content">
                <GrammarSentence
                    content={displayContent}
                    onComplete={() => setIsComplete(true)}
                />
                {isComplete && <GrammarComplete />}
            </div>
        </div>
    );
}

export default GrammarDetail;