import React, { useEffect, useState, useRef } from "react";
import LoadingScreen from "@/components/user/LoadingScreen.jsx";
import GateCard from "@/components/user/gate/GateCard.jsx";
import { GateService } from "@/services/GateService.jsx";

const Gate = () => {
    const [journeyTitle, setJourneyTitle] = useState("HÀNH TRÌNH");
    const [gates, setGates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const currentGateRef = useRef(null);

    useEffect(() => {
        document.title = "Cổng học tập - EasyTalk";
        const fetchJourneyData = async () => {
            setIsLoading(true);
            try {
                const journeyId = window.location.pathname.split("/").pop();
                const data = await GateService.getGate(journeyId);
                if (!data || !data.journey) return;
                setJourneyTitle(data.journey.title || "HÀNH TRÌNH");
                const formattedGates = data.journey.gates.map((gate) => ({
                    ...gate,
                    unlocked: data.userProgress.unlockedGates.includes(gate._id),
                    stages: gate.stages.map((stage) => ({
                        id: stage._id,
                        title: stage.title,
                        unlocked: data.userProgress.unlockedStages.includes(stage._id),
                    })),
                }));
                setGates(formattedGates);
            } catch (error) {
                console.error("Lỗi khi fetch journey data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchJourneyData();
    }, []);

    const getCurrentGateIndex = () => {
        if (gates.length === 0) return -1;
        for (let i = 0; i < gates.length; i++) {
            const gate = gates[i];
            if (!gate.unlocked) {
                return i > 0 && gates[i - 1].unlocked ? i - 1 : -1;
            }
            const hasUnfinishedStage = gate.stages.length > 0 && gate.stages.some(s => !s.unlocked);
            if (hasUnfinishedStage) {
                return i;
            }
        }
        const lastUnlockedIndex = gates.findLastIndex(g => g.unlocked);
        return lastUnlockedIndex !== -1 ? lastUnlockedIndex : -1;
    };

    const currentGateIndex = getCurrentGateIndex();
    const hasCurrentGate = currentGateIndex !== -1;

    const scrollToCurrentGate = () => {
        currentGateRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    return (
        <div className="user-gate-roadmap">
            <div className="user-gate-header">
                <h3 className="user-gate-title">HÀNH TRÌNH: {journeyTitle.toUpperCase()}</h3>
                <p className="user-gate-subtitle">Hoàn thành từng cổng để mở khóa chặng tiếp theo</p>
            </div>
            <div className="user-gate-timeline">
                {gates.map((gate, index) => (
                    <div
                        key={gate._id}
                        ref={index === currentGateIndex ? currentGateRef : null}
                    >
                        <GateCard
                            gate={gate}
                            index={index}
                            total={gates.length}
                            isCurrent={index === currentGateIndex}
                        />
                    </div>
                ))}
            </div>
            {hasCurrentGate && (
                <div className="user-floating-buttons">
                    <button
                        className="user-scroll-current-btn"
                        onClick={scrollToCurrentGate}
                        title="Cuộn đến cổng hiện tại"
                    >
                        <i className="fas fa-play-circle"></i>
                        <span className="user-scroll-current-text">Tiếp tục học</span>
                        <span className="user-scroll-hot-badge">HOT</span>
                    </button>
                    <button
                        className="user-scroll-top"
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        title="Lên đầu trang"
                    >
                        <i className="fas fa-arrow-up"></i>
                    </button>
                </div>
            )}
            {isLoading && <LoadingScreen />}
        </div>
    );
};

export default Gate;