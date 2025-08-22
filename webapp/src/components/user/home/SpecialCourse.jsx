import React from 'react';

function SpecialCourse() {
  return (
    <section className="special_cource">
        <div className="container">
            <div className="section_tittle">
                <h3>CÁC BÀI HỌC PHỔ BIẾN</h3>
            </div>
            <div className="row">
                <div className="col-sm-6 col-lg-4">
                    <div className="single_special_cource">
                        <img src="/src/assets/images/special_cource_1.png" className="special_img" alt="Grammar Course" />
                        <div className="special_cource_text">
                            <a href="/grammar" className="btn_4">NGỮ PHÁP</a>
                            <a href="/grammar">
                                <h4>BÀI HỌC NGỮ PHÁP</h4>
                            </a>
                            <p>
                                Danh sách bài học ngữ pháp cung cấp các bài học rõ ràng, có cấu trúc để cải thiện kỹ năng ngữ pháp từ cơ bản đến nâng cao.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-4">
                    <div className="single_special_cource">
                        <img src="/src/assets/images/special_cource_2.png" className="special_img" alt="Vocabulary Course" />
                        <div className="special_cource_text">
                            <a href="/flashcards" className="btn_4">TỪ VỰNG</a>
                            <a href="/flashcards">
                                <h4>TỪ VỰNG FLASHCARD</h4>
                            </a>
                            <p>
                                Các bài học Flashcard giúp người học nắm vững vốn từ vựng thông qua các thẻ flashcard trực quan, tương tác để ghi nhớ hiệu quả.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-4">
                    <div className="single_special_cource">
                        <img src="/src/assets/images/special_cource_3.png" className="special_img" alt="Pronunciation Course" />
                        <div className="special_cource_text">
                            <a href="/pronunciation" className="btn_4">PHÁT ÂM</a>
                            <a href="/pronunciation">
                                <h4>BÀI HỌC PHÁT ÂM</h4>
                            </a>
                            <p>
                                Danh sách bài học phát âm giúp cải thiện khả năng nói rõ ràng với hướng dẫn từng bước về âm thanh, trọng âm và ngữ điệu.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
}

export default SpecialCourse;