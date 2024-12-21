var express = require("express");
var router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.get("/", function(req, res) {
    res.render("writing");
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
          content: `Bạn là một chuyên gia tiếng Anh và thông thạo tiếng Việt. 
            Nhiệm vụ của bạn là đánh giá bài viết của người dùng dựa trên các tiêu chí sau:
            1. Ngữ pháp (Grammar): Kiểm tra các lỗi về cấu trúc ngữ pháp. Nếu có lỗi, giải thích lỗi và cách sửa bằng tiếng Việt.
            2. Chính tả (Spelling): Tìm các lỗi chính tả, giải thích lý do sai và cung cấp cách viết đúng.
            3. Cấu trúc câu (Sentence structure): Đánh giá cách sắp xếp câu, độ rõ ràng và mạch lạc. Gợi ý cách cải thiện cấu trúc nếu cần.
            4. Từ vựng (Vocabulary): Phân tích cách sử dụng từ vựng, đánh giá sự phù hợp của từ và gợi ý các từ thay thế nếu cần.

            Hãy trả về phản hồi chi tiết bằng tiếng Việt, bao gồm:
            - Lỗi sai và cách sửa tương ứng.
            - Gợi ý cải thiện bài viết để người dùng hiểu rõ hơn.
            - Điểm cụ thể cho từng tiêu chí (1-10).
            - Điểm tổng quan (Overall score: X/10) cùng với lời nhận xét chung.

            Ví dụ:
            - Ngữ pháp: Bạn đã sử dụng ngữ pháp tốt, nhưng có lỗi trong câu "She go to school every day." Lỗi: Sai chia động từ 'go'. Sửa: 'She goes to school every day.' Điểm: 9/10.
            - Chính tả: Không phát hiện lỗi chính tả. Điểm: 10/10.
            - Cấu trúc câu: Câu văn rõ ràng, nhưng cần cải thiện sự liên kết giữa các ý. Gợi ý: Sử dụng từ nối như 'However', 'Furthermore'. Điểm: 8/10.
            - Từ vựng: Sử dụng từ ngữ phong phú. Có thể thay từ 'big problem' bằng 'significant issue' để phù hợp hơn. Điểm: 9/10.
            - Điểm tổng quan: 9/10. Nhận xét: Bài viết tốt, cần cải thiện sự liên kết giữa các ý để mạch lạc hơn.

            Phản hồi cần rõ ràng và dễ hiểu cho người dùng Việt Nam.`
        },
        {
          role: "user",
          content: userText,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiFeedback = response.choices[0].message.content;
    const overallScoreMatch = aiFeedback.match(/Điểm tổng quan:\s*(\d+(\.\d+)?)/i);
    const overallScore = overallScoreMatch ? overallScoreMatch[1] : "Không xác định";

    res.json({
      suggestions: aiFeedback,
      score: overallScore,
    });
  } catch (error) {
    console.error("Error with OpenAI API:", error);
    res.status(500).json({ error: "Có lỗi xảy ra. Vui lòng thử lại sau." });
  }
});

module.exports = router;
