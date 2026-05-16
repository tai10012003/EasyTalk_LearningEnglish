const axios = require('axios');
const FormData = require('form-data');

class SpeechAnalysisService {
    constructor(apiKey = null) {
        this.apiKey = apiKey || process.env.OPENAI_API_KEY;
        this.apiEndpoint = 'https://api.openai.com/v1/audio/transcriptions';
        this.model = 'whisper-1';
    }
    async transcribeAudio(audioBuffer, filename = 'recording.wav') {
        if(!this.apiKey) {
            throw new Error('OpenAI API key is not configured');
        }
        const formData = new FormData();
        formData.append('file', audioBuffer, filename);
        formData.append('model', this.model);
        try {
            const response = await axios.post(
                this.apiEndpoint,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    timeout: 30000
                }
            );
            return {
                success: true,
                transcription: response.data.text
            };
        } catch (error) {
            console.error('OpenAI Whisper API error:', error.message);
            if(error.response) {
                return {
                    success: false,
                    error: `API error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`
                };
            }
            return {
                success: false,
                error: error.message
            };
        }
    }

    async analyzeWithExercise(audioBuffer, exercise, questionIndex) {
        if(!exercise || !exercise.questions || !exercise.questions[questionIndex]) {
            return {
                success: false,
                error: 'Không tìm thấy bài tập hoặc câu hỏi không tồn tại.'
            };
        }
        const transcriptionResult = await this.transcribeAudio(audioBuffer);
        if(!transcriptionResult.success) {
            return transcriptionResult;
        }
        const correctAnswer = exercise.questions[questionIndex].correctAnswer;
        return {
            success: true,
            transcription: transcriptionResult.transcription,
            correctAnswer: correctAnswer,
            questionIndex: questionIndex
        };
    }
}

module.exports = SpeechAnalysisService;