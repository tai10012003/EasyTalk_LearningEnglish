class MockAIResponseService {
    generateJson(task, input) {
        if (task === 'enhance_daily_plan') {
            return this.mockDailyPlanCopy(input);
        }
        if (task === 'provider_health_check') {
            return {
                ok: true,
                message: 'Mock provider is ready.'
            };
        }
        if (task === 'agent_chat_reply') {
            return this.mockAgentChatReply(input);
        }
        if (task === 'agent_chat_summary') {
            return this.mockAgentChatSummary(input);
        }
        if (task === 'writing_feedback') {
            return this.mockWritingFeedback(input);
        }
        return {};
    }

    safeDailyPlanCopy(plan) {
        try {
            return this.mockDailyPlanCopy(plan);
        } catch {
            return {
                headline: plan?.headline,
                motivation: plan?.motivation,
                tasks: []
            };
        }
    }

    mockAgentChatReply(input = {}) {
        const memory = input.memory || {};
        const topic = input.session?.topic || memory.preferredTopics?.[0] || 'daily routine';
        if (input.isFirstTurn) {
            return {
                reply: `Hi! I am your EasyTalk Coach. Today we can practice ${topic}. What did you do today?`,
                corrections: [],
                suggestions: ['I studied English today.', 'I went to work today.']
            };
        }
        const message = input.message || '';
        const corrections = [];
        if (/\bi am go\b/i.test(message)) {
            corrections.push({
                original: 'I am go',
                corrected: 'I am going',
                explanation: 'Use am/is/are + V-ing for an action happening now.'
            });
        }
        return {
            reply: `Nice answer. ${corrections.length ? 'Small correction noted.' : 'Keep going.'} Can you tell me one more detail about ${topic}?`,
            corrections,
            suggestions: ['It was interesting.', 'I want to practice more.']
        };
    }

    mockAgentChatSummary(input = {}) {
        const messages = input.session?.messages || [];
        const userMessages = messages.filter(message => message.role === 'user');
        const mistakes = userMessages.some(message => /\bi am go\b/i.test(message.content))
            ? ['present continuous: use "I am going" instead of "I am go"']
            : [];
        return {
            summary: `You practiced ${userMessages.length} message(s) in English conversation.`,
            mistakes,
            weakSkills: mistakes.length ? ['grammar', 'speaking'] : ['speaking'],
            recommendedNextActions: [
                { type: 'chat', title: 'Practice one more short conversation', path: '/chat' },
                { type: 'grammar_exercise', title: 'Review one grammar exercise', path: '/grammar-exercise' }
            ]
        };
    }

    mockWritingFeedback(input = {}) {
        const text = input.text || "";
        const modeTitle = input.modeConfig?.title || "Writing Practice";
        const corrections = [];
        if (/\bpeople is\b/i.test(text)) {
            corrections.push({
                original: "people is",
                corrected: "people are",
                explanation: "People là danh từ số nhiều, nên dùng are."
            });
        }
        if (/\bi am go\b/i.test(text)) {
            corrections.push({
                original: "I am go",
                corrected: "I am going",
                explanation: "Dùng am/is/are + V-ing cho hành động đang diễn ra."
            });
        }
        return {
            score: corrections.length ? 6.5 : 7.5,
            summary: `Mock feedback cho ${modeTitle}: bài viết có ý chính rõ, nên chỉnh thêm độ tự nhiên và độ chính xác câu.`,
            strengths: ["Có nỗ lực diễn đạt ý chính", "Bố cục đủ để tiếp tục cải thiện"],
            corrections,
            rubric: {
                taskResponse: 7,
                coherence: 6.5,
                vocabulary: corrections.length ? 6 : 7,
                grammar: corrections.length ? 6 : 7
            },
            rewriteSuggestion: text || "Write a short paragraph, then I will help you improve it.",
            nextActions: [
                { type: "writing", title: "Viết lại bản cải thiện", path: "/writing" },
                { type: "chat", title: "Luyện nói bằng các câu đã sửa", path: "/chat" }
            ]
        };
    }

    mockDailyPlanCopy(plan) {
        const snapshot = plan?.learnerSnapshot || {};
        const memory = snapshot.memory || {};
        const weakSkills = memory.weakSkills || [];
        const goals = memory.learningGoals || [];
        const tone = memory.coachTone || 'friendly';
        const totalMinutes = plan?.totalEstimatedMinutes || 10;
        const focus = weakSkills[0] || goals[0] || 'daily_habit';

        return {
            headline: this.buildMockHeadline(snapshot, totalMinutes, focus, tone),
            motivation: this.buildMockMotivation(snapshot, memory, focus, tone),
            tasks: (plan?.tasks || []).map(task => ({
                type: task.type,
                title: this.rewriteTaskTitle(task, memory),
                description: this.rewriteTaskDescription(task, memory)
            }))
        };
    }

    buildMockHeadline(snapshot, totalMinutes, focus, tone) {
        if (!snapshot.hasProgress) {
            return `Khởi động nhẹ với ${totalMinutes} phút học tiếng Anh hôm nay.`;
        }
        if (tone === 'concise') {
            return `${totalMinutes} phút hôm nay: tập trung ${this.translateFocus(focus)}.`;
        }
        if (tone === 'strict') {
            return `Hoàn thành ${totalMinutes} phút học hôm nay để giữ đúng cam kết.`;
        }
        if (snapshot.streak > 0) {
            return `Giữ streak ${snapshot.streak} ngày với ${totalMinutes} phút học thật gọn.`;
        }
        return `Bắt nhịp lại với ${totalMinutes} phút học vừa sức hôm nay.`;
    }

    buildMockMotivation(snapshot, memory, focus, tone) {
        const topicText = memory.preferredTopics?.length ? ` Chủ đề gợi ý: ${memory.preferredTopics[0]}.` : '';
        if (tone === 'strict') {
            return `Coach đã ưu tiên ${this.translateFocus(focus)} dựa trên hồ sơ học tập của bạn.${topicText}`;
        }
        if (tone === 'concise') {
            return `Ưu tiên: ${this.translateFocus(focus)}.${topicText}`;
        }
        if (snapshot.dailyFlashcardRemaining > 0) {
            return `Bạn còn ${snapshot.dailyFlashcardRemaining} flashcard. Mình xếp bài ngắn để bạn dễ hoàn thành hôm nay.${topicText}`;
        }
        return `Kế hoạch này bám theo mục tiêu và kỹ năng cần cải thiện của bạn.${topicText}`;
    }

    rewriteTaskTitle(task, memory) {
        if (task.type === 'chat' && memory.preferredTopics?.length) {
            return `Luyện nói chủ đề ${memory.preferredTopics[0]}`;
        }
        if (task.type === 'dictation' && memory.weakSkills?.includes('listening')) {
            return 'Tập trung nghe chủ động';
        }
        if (task.type === 'grammar_exercise' && memory.weakSkills?.includes('grammar')) {
            return 'Sửa điểm yếu ngữ pháp';
        }
        return task.title;
    }

    rewriteTaskDescription(task, memory) {
        if (task.type === 'chat' && memory.learningGoals?.includes('communication')) {
            return 'Một lượt hội thoại ngắn để tăng phản xạ giao tiếp và sự tự tin.';
        }
        if (task.type === 'pronunciation_exercise' && memory.weakSkills?.includes('pronunciation')) {
            return 'Đọc theo câu mẫu để làm rõ âm và giảm lỗi phát âm lặp lại.';
        }
        return task.description;
    }

    translateFocus(focus) {
        const labels = {
            daily_habit: 'thói quen học',
            communication: 'giao tiếp',
            pronunciation: 'phát âm',
            vocabulary: 'từ vựng',
            grammar: 'ngữ pháp',
            listening: 'nghe',
            speaking: 'nói',
            writing: 'viết',
            reading: 'đọc',
            exam: 'ôn thi',
            work: 'tiếng Anh công việc'
        };
        return labels[focus] || focus;
    }
}

module.exports = MockAIResponseService;
