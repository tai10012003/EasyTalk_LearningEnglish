import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { LearningAgentService } from "@/services/LearningAgentService.jsx";

const LABELS = {
    newbie: "Mới bắt đầu",
    beginner: "Beginner",
    elementary: "Elementary",
    intermediate: "Intermediate",
    "upper-intermediate": "Upper-intermediate",
    advanced: "Advanced",
    daily_habit: "Tạo thói quen học",
    communication: "Giao tiếp",
    pronunciation: "Phát âm",
    vocabulary: "Từ vựng",
    grammar: "Ngữ pháp",
    listening: "Nghe",
    writing: "Viết",
    exam: "Thi cử",
    work: "Công việc",
    speaking: "Nói",
    reading: "Đọc",
    friendly: "Thân thiện",
    strict: "Nghiêm khắc",
    encouraging: "Động viên nhiều",
    concise: "Ngắn gọn"
};

function toInputText(values = []) {
    return values.join(", ");
}

function fromInputText(value = "") {
    return value
        .split(",")
        .map(item => item.trim())
        .filter(Boolean)
        .slice(0, 12);
}

function CoachMemoryPanel({ onMemorySaved }) {
    const [options, setOptions] = useState(null);
    const [form, setForm] = useState(null);
    const [topicsInput, setTopicsInput] = useState("");
    const [mistakesInput, setMistakesInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let mounted = true;
        async function loadMemory() {
            setIsLoading(true);
            try {
                const [memory, memoryOptions] = await Promise.all([
                    LearningAgentService.getMemory(),
                    LearningAgentService.getMemoryOptions()
                ]);
                if (!mounted) return;
                setOptions(memoryOptions);
                setForm({
                    proficiencyLevel: memory.proficiencyLevel || "beginner",
                    learningGoals: memory.learningGoals || [],
                    weakSkills: memory.weakSkills || [],
                    coachTone: memory.coachTone || "friendly",
                    notes: memory.notes || ""
                });
                setTopicsInput(toInputText(memory.preferredTopics || []));
                setMistakesInput(toInputText(memory.frequentMistakes || []));
            } catch (error) {
                console.error("Cannot load learner memory:", error);
            } finally {
                if (mounted) setIsLoading(false);
            }
        }
        loadMemory();
        return () => {
            mounted = false;
        };
    }, []);

    const toggleArrayValue = (field, value) => {
        setForm((current) => {
            const values = new Set(current?.[field] || []);
            if (values.has(value)) {
                values.delete(value);
            } else {
                values.add(value);
            }
            return { ...current, [field]: [...values] };
        });
    };

    const handleSave = async () => {
        if (!form) return;
        setIsSaving(true);
        try {
            const payload = {
                ...form,
                preferredTopics: fromInputText(topicsInput),
                frequentMistakes: fromInputText(mistakesInput)
            };
            const memory = await LearningAgentService.updateMemory(payload);
            Swal.fire({
                icon: "success",
                title: "Đã lưu hồ sơ học tập",
                text: "AI Coach đang làm mới kế hoạch hôm nay.",
                timer: 1500,
                showConfirmButton: false
            });
            await onMemorySaved?.(memory);
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Không thể lưu hồ sơ",
                text: error.message || "Vui lòng thử lại sau."
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <section className="coach-memory-card" data-coach-target="coach-memory-profile">
                <div className="coach-memory-loading">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Đang tải hồ sơ học tập...</p>
                </div>
            </section>
        );
    }

    if (!form || !options) {
        return (
            <section className="coach-memory-card" data-coach-target="coach-memory-profile">
                <div className="coach-memory-loading">
                    <i className="fas fa-exclamation-circle"></i>
                    <p>Chưa tải được hồ sơ học tập.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="coach-memory-card">
            <div className="coach-section-heading" data-coach-target="coach-memory-profile">
                <h3>Hồ sơ học tập</h3>
                <span>Memory nền</span>
            </div>

            <div className="coach-memory-field">
                <label>Trình độ hiện tại</label>
                <select
                    value={form.proficiencyLevel}
                    onChange={(e) => setForm({ ...form, proficiencyLevel: e.target.value })}
                >
                    {options.proficiencyLevels.map(level => (
                        <option key={level} value={level}>{LABELS[level] || level}</option>
                    ))}
                </select>
            </div>

            <div className="coach-memory-field">
                <label>Mục tiêu học</label>
                <div className="coach-memory-chips">
                    {options.learningGoals.map(goal => (
                        <button
                            key={goal}
                            type="button"
                            className={form.learningGoals.includes(goal) ? "active" : ""}
                            onClick={() => toggleArrayValue("learningGoals", goal)}
                        >
                            {LABELS[goal] || goal}
                        </button>
                    ))}
                </div>
            </div>

            <div className="coach-memory-field">
                <label>Kỹ năng yếu cần Coach ưu tiên</label>
                <div className="coach-memory-chips">
                    {options.skills.map(skill => (
                        <button
                            key={skill}
                            type="button"
                            className={form.weakSkills.includes(skill) ? "active" : ""}
                            onClick={() => toggleArrayValue("weakSkills", skill)}
                        >
                            {LABELS[skill] || skill}
                        </button>
                    ))}
                </div>
            </div>

            <div className="coach-memory-field">
                <label>Chủ đề yêu thích</label>
                <input
                    value={topicsInput}
                    onChange={(e) => setTopicsInput(e.target.value)}
                    placeholder="travel, work, food"
                />
            </div>

            <div className="coach-memory-field">
                <label>Lỗi thường gặp</label>
                <input
                    value={mistakesInput}
                    onChange={(e) => setMistakesInput(e.target.value)}
                    placeholder="past tense, article a/an, pronunciation /θ/"
                />
            </div>

            <div className="coach-memory-field">
                <label>Phong cách Coach</label>
                <select
                    value={form.coachTone}
                    onChange={(e) => setForm({ ...form, coachTone: e.target.value })}
                >
                    {options.coachTones.map(tone => (
                        <option key={tone} value={tone}>{LABELS[tone] || tone}</option>
                    ))}
                </select>
            </div>

            <div className="coach-memory-field">
                <label>Ghi chú riêng</label>
                <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    maxLength={1000}
                    placeholder="Ví dụ: Tôi muốn giao tiếp tự tin hơn khi đi làm."
                />
            </div>

            <button className="coach-memory-save" onClick={handleSave} disabled={isSaving}>
                <i className={isSaving ? "fas fa-spinner fa-spin" : "fas fa-save"}></i>
                {isSaving ? "Đang lưu..." : "Lưu hồ sơ học tập"}
            </button>
        </section>
    );
}

export default CoachMemoryPanel;
