var express = require("express");
var router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.get("/api/writing/random-topic", async (req, res) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Bạn là một giáo viên tiếng Anh. Hãy tạo ra 1 đề bài viết tiếng Anh với đa dạng chủ đề thường ngày phù hợp để người học để luyện viết tiếng Anh. Trả về chỉ 1 câu duy nhất, không giải thích thêm."
        }
      ],
      temperature: 0.8,
      max_tokens: 50,
    });

    const topic = response.choices[0].message.content.trim();
    res.json({ topic });
  } catch (error) {
    console.error("Error generating topic:", error);
    res.status(500).json({ error: "Không thể tạo đề bài." });
  }
});

router.post("/api/analyze", async function (req, res) {
  const userText = req.body.text;

  if (!userText || userText.trim() === "") {
    return res.status(400).json({ error: "Vui lòng nhập bài viết của bạn." });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Bạn là chuyên gia tiếng Anh và thông thạo tiếng Việt. 
          Nhiệm vụ của bạn:
          1. Đánh giá bài viết của người dùng về ngữ pháp, chính tả, cấu trúc câu, từ vựng.
          2. Cung cấp đề xuất cải thiện bài viết.
          3. Trả lại phiên bản bài viết đã được cải thiện (Improved version).
          4. Trả điểm từng phần và điểm tổng quan (THANG ĐIỂM 10).
          Phản hồi bằng tiếng Việt, rõ ràng và dễ hiểu.`
        },
        { role: "user", content: userText },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const aiFeedback = response.choices[0].message.content;
    const overallScoreMatch = aiFeedback.match(/Điểm tổng quan:\s*([\d\.]+|Không xác định)(\/10)?/i);
    const overallScore = overallScoreMatch ? (overallScoreMatch[1] + (overallScoreMatch[2] || "")) : "Không xác định";

    res.json({
      suggestions: aiFeedback,
      score: overallScore
    });
  } catch (error) {
    console.error("Error with OpenAI API:", error);
    res.status(500).json({ error: "Có lỗi xảy ra. Vui lòng thử lại sau." });
  }
});

module.exports = router;
