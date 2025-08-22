import React from 'react';

function AdvancedCourse() {
  return (
    <section className="advance_feature">
        <div className="container">
            <div className="row">
                <div className="col-md-12 col-lg-12">
                    <div className="learning_member_text">
                        <h5>LUYỆN TẬP & CẢI THIỆN</h5>
                        <div className="section_tittle">
                            <h3>NÂNG CAO KỸ NĂNG CỦA BẠN VỚI HỆ THỐNG HỌC TẬP TƯƠNG TÁC CỦA CHÚNG TÔI</h3>
                        </div>
                        <p>
                            Cải thiện kỹ năng ngôn ngữ của bạn thông qua các buổi thực hành chuyên biệt về ngữ pháp, phát âm và từ vựng. Hệ thống của chúng tôi được thiết kế để tăng hiệu quả học tập của bạn mọi lúc, mọi nơi.
                        </p>
                        <div className="row">
                            <div className="col-sm-6 col-lg-4 col-xl-4">
                                <a href="/grammar-exercise" className="learning_member_text_link">
                                <div className="learning_member_text_iner">
                                    <span className="ti-book"></span>
                                    <h4>Luyện Tập Ngữ Pháp</h4>
                                    <p>
                                    Nắm vững các quy tắc ngữ pháp với các bài tập tương tác được thiết kế riêng theo trình độ của bạn, giúp bạn xây dựng nền tảng vững chắc.
                                    </p>
                                </div>
                                </a>
                            </div>
                            <div className="col-sm-6 col-lg-4 col-xl-4">
                                <a href="/pronunciation-exercise" className="learning_member_text_link">
                                <div className="learning_member_text_iner">
                                    <span className="ti-microphone"></span>
                                    <h4>Luyện Tập Phát Âm</h4>
                                    <p>
                                    Hoàn thiện cách phát âm của bạn thông qua các bài học có hướng dẫn, đảm bảo bạn nói tự nhiên và rõ ràng trong cuộc trò chuyện.
                                    </p>
                                </div>
                                </a>
                            </div>
                            <div className="col-sm-6 col-lg-4 col-xl-4">
                                <a href="/vocabulary-exercise" className="learning_member_text_link">
                                <div className="learning_member_text_iner">
                                    <span className="ti-light-bulb"></span>
                                    <h4>Luyện Tập Từ Vựng</h4>
                                    <p>
                                    Học từ mới hiệu quả bằng cách nghiên cứu từ vựng được nhóm theo chủ đề có liên quan, giúp bạn dễ nhớ và áp dụng chúng vào ngữ cảnh hơn.
                                    </p>
                                </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
}

export default AdvancedCourse;