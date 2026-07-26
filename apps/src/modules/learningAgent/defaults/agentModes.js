const DEFAULT_AGENT_MODES = [
    {
        key: "free_chat",
        activityType: "chat",
        title: "Free Chat",
        description: "Trò chuyện tự do để luyện phản xạ tiếng Anh hằng ngày.",
        skillFocus: ["speaking", "vocabulary"],
        suggestedLevel: ["beginner", "intermediate", "advanced"],
        estimatedMinutes: 8,
        correctionDepth: "light",
        openingPrompt: "Start a friendly free conversation based on the learner's preferred topics.",
        promptHints: [
            "Keep the conversation natural and low pressure.",
            "Correct only the most useful mistake.",
            "Ask one simple follow-up question."
        ],
        config: { topicSuggestions: ["daily routine", "hobbies", "food", "movies", "work"] },
        display: true,
        sort: 10
    },
    {
        key: "speaking_practice",
        activityType: "chat",
        title: "Speaking Practice",
        description: "Luyện nói ngắn theo chủ đề để tăng phản xạ giao tiếp.",
        skillFocus: ["speaking", "pronunciation"],
        suggestedLevel: ["beginner", "intermediate"],
        estimatedMinutes: 10,
        correctionDepth: "medium",
        openingPrompt: "Guide the learner through a short speaking practice with simple questions.",
        promptHints: [
            "Encourage complete sentences.",
            "Give short corrections in friendly Vietnamese when needed.",
            "Keep the learner speaking more than the coach."
        ],
        config: { topicSuggestions: ["today's plan", "school", "work", "family", "weekend"] },
        display: true,
        sort: 20
    },
    {
        key: "grammar_correction",
        activityType: "chat",
        title: "Grammar Correction",
        description: "Gửi câu tiếng Anh và được sửa lỗi ngữ pháp có giải thích ngắn.",
        skillFocus: ["grammar", "writing", "speaking"],
        suggestedLevel: ["beginner", "intermediate", "advanced"],
        estimatedMinutes: 8,
        correctionDepth: "detailed",
        openingPrompt: "Ask the learner to send one or two English sentences for grammar correction.",
        promptHints: [
            "Focus on grammar patterns, not long conversation.",
            "Explain why the correction is better.",
            "Give one upgraded example sentence."
        ],
        config: { topicSuggestions: ["past tense", "present perfect", "articles", "prepositions"] },
        display: true,
        sort: 30
    },
    {
        key: "interview_practice",
        activityType: "chat",
        title: "Interview Practice",
        description: "Luyện trả lời phỏng vấn bằng tiếng Anh trong bối cảnh công việc.",
        skillFocus: ["speaking", "vocabulary"],
        suggestedLevel: ["intermediate", "advanced"],
        estimatedMinutes: 12,
        correctionDepth: "medium",
        openingPrompt: "Act as a professional interviewer and ask one interview question at a time.",
        promptHints: [
            "Keep the interview realistic and supportive.",
            "Suggest stronger professional wording.",
            "Avoid inventing the learner's work history."
        ],
        config: { topicSuggestions: ["self introduction", "strengths", "teamwork", "project experience"] },
        display: true,
        sort: 40
    },
    {
        key: "travel_roleplay",
        activityType: "chat",
        title: "Travel Roleplay",
        description: "Đóng vai tình huống du lịch như sân bay, khách sạn, nhà hàng.",
        skillFocus: ["speaking", "listening", "vocabulary"],
        suggestedLevel: ["beginner", "intermediate"],
        estimatedMinutes: 10,
        correctionDepth: "light",
        openingPrompt: "Start a travel roleplay and play one realistic role such as airport staff, hotel receptionist, or waiter.",
        promptHints: [
            "Stay in role unless a correction is needed.",
            "Use practical travel phrases.",
            "Keep questions short and realistic."
        ],
        config: { topicSuggestions: ["airport check-in", "hotel booking", "ordering food", "asking directions"] },
        display: true,
        sort: 50
    },
    {
        key: "daily_checkin",
        activityType: "chat",
        title: "Daily Check-in",
        description: "Coach hỏi nhanh hôm nay bạn học gì và chốt một bước tiếp theo.",
        skillFocus: ["speaking", "daily_habit"],
        suggestedLevel: ["beginner", "intermediate", "advanced"],
        estimatedMinutes: 5,
        correctionDepth: "light",
        openingPrompt: "Ask a short daily check-in question and help the learner choose one action for today.",
        promptHints: [
            "Keep it brief and action-oriented.",
            "Connect to daily plan when available.",
            "Do not shame the learner for missing practice."
        ],
        config: { topicSuggestions: ["today's goal", "study habit", "energy level"] },
        display: true,
        sort: 60
    },
    {
        key: "quick_correction",
        activityType: "writing",
        title: "Quick Correction",
        description: "Sửa nhanh đoạn viết ngắn, tập trung lỗi rõ nhất.",
        skillFocus: ["writing", "grammar"],
        suggestedLevel: ["beginner", "intermediate", "advanced"],
        estimatedMinutes: 8,
        correctionDepth: "light",
        promptHints: [
            "Correct the most important grammar and wording issues.",
            "Keep feedback concise.",
            "Give a cleaner rewritten version."
        ],
        config: {
            minCharacters: 80,
            maxCharacters: 1200,
            topicSuggestions: ["Write about your day.", "Describe your favorite food.", "Write a short message to a friend."]
        },
        display: true,
        sort: 110
    },
    {
        key: "essay_feedback",
        activityType: "writing",
        title: "Essay Feedback",
        description: "Nhận feedback bài luận về ý tưởng, mạch lạc, từ vựng và ngữ pháp.",
        skillFocus: ["writing", "grammar", "vocabulary"],
        suggestedLevel: ["intermediate", "advanced"],
        estimatedMinutes: 18,
        correctionDepth: "detailed",
        promptHints: [
            "Evaluate structure, coherence, vocabulary, and grammar.",
            "Give concrete fixes, not generic advice.",
            "Suggest one better outline or rewritten paragraph."
        ],
        config: {
            minCharacters: 200,
            maxCharacters: 4000,
            topicSuggestions: ["Should students use AI for homework?", "Is online learning better than classroom learning?", "How can people build healthy habits?"]
        },
        display: true,
        sort: 120
    },
    {
        key: "ielts_task_1",
        activityType: "writing",
        title: "IELTS Task 1",
        description: "Luyện mô tả biểu đồ/quy trình theo tiêu chí IELTS Writing Task 1.",
        skillFocus: ["writing", "vocabulary", "grammar"],
        suggestedLevel: ["intermediate", "advanced"],
        estimatedMinutes: 20,
        correctionDepth: "detailed",
        promptHints: [
            "Assess overview, data selection, comparisons, and grammar.",
            "Use IELTS-style feedback.",
            "Do not invent chart data beyond the learner's prompt."
        ],
        config: {
            minCharacters: 250,
            maxCharacters: 3500,
            topicSuggestions: ["The chart shows changes in transport use over 20 years.", "The diagram explains how coffee is produced.", "The table compares student numbers in three countries."]
        },
        display: true,
        sort: 130
    },
    {
        key: "ielts_task_2",
        activityType: "writing",
        title: "IELTS Task 2",
        description: "Luyện essay IELTS Task 2 với feedback theo band.",
        skillFocus: ["writing", "grammar", "vocabulary"],
        suggestedLevel: ["intermediate", "advanced"],
        estimatedMinutes: 25,
        correctionDepth: "detailed",
        promptHints: [
            "Assess task response, coherence, lexical resource, and grammar range.",
            "Estimate a cautious band score only from the submitted text.",
            "Give one prioritized improvement plan."
        ],
        config: {
            minCharacters: 300,
            maxCharacters: 5000,
            topicSuggestions: ["Some people believe technology makes learning easier. To what extent do you agree?", "Many young people move to cities for work. Discuss advantages and disadvantages.", "Should governments invest more in public transport?"]
        },
        display: true,
        sort: 140
    },
    {
        key: "work_email",
        activityType: "writing",
        title: "Work Email",
        description: "Luyện viết email công việc lịch sự, rõ ý và tự nhiên.",
        skillFocus: ["writing", "vocabulary"],
        suggestedLevel: ["beginner", "intermediate", "advanced"],
        estimatedMinutes: 12,
        correctionDepth: "medium",
        promptHints: [
            "Focus on tone, clarity, and professional phrasing.",
            "Suggest a polished email version.",
            "Explain any phrase that sounds too casual or too direct."
        ],
        config: {
            minCharacters: 100,
            maxCharacters: 2500,
            topicSuggestions: ["Ask your manager for a day off.", "Reply to a customer complaint.", "Schedule a meeting with a teammate."]
        },
        display: true,
        sort: 150
    },
    {
        key: "sentence_upgrade",
        activityType: "writing",
        title: "Sentence Upgrade",
        description: "Nâng cấp câu đơn giản thành câu tự nhiên và giàu ý hơn.",
        skillFocus: ["writing", "vocabulary", "grammar"],
        suggestedLevel: ["beginner", "intermediate"],
        estimatedMinutes: 7,
        correctionDepth: "medium",
        promptHints: [
            "Rewrite simple sentences into natural English.",
            "Give 2-3 stronger alternatives.",
            "Keep explanations short and practical."
        ],
        config: {
            minCharacters: 40,
            maxCharacters: 900,
            topicSuggestions: ["I like learning English.", "My job is very busy.", "I want to travel abroad."]
        },
        display: true,
        sort: 160
    }
];

module.exports = DEFAULT_AGENT_MODES;
