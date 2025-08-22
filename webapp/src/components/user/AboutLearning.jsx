import React from 'react';

function AboutLearning() {
  return (
    <section className="learning_part">
        <div className="container">
        <div className="row">
            <div className="col-md-7 col-lg-7">
                <div className="learning_img">
                    <img src="/src/assets/images/learningenglish.png" alt="Learning English Online" />
                </div>
            </div>
            <div className="col-md-5 col-lg-5">
                <div className="learning_member_text">
                    <h5>Về chúng tôi</h5>
                    <h4>HỌC TIẾNG ANH DỄ DÀNG VÀ THÚ VỊ</h4>
                    <p>Tại EasyTalk, chúng tôi tin rằng việc học tiếng Anh phải thú vị và dễ tiếp cận với tất cả mọi người. Nền tảng của chúng tôi cung cấp các bài học tương tác, thử thách thú vị và nội dung được cá nhân hóa giúp bạn cải thiện kỹ năng của mình từng bước.</p>
                    <ul>
                        <li>
                            <span className="ti-pencil-alt"></span>
                            Các bài học tương tác phù hợp với phong cách và tốc độ học tập của bạn
                        </li>
                        <li>
                            <span className="ti-ruler-pencil"></span>
                            Các ví dụ và bài tập thực tế giúp xây dựng sự tự tin trong giao tiếp
                        </li>
                    </ul>
                    <a href="/about" className="btn_1">HỌC HỎI THÊM</a>
                </div>
            </div>
            </div>
        </div>
    </section>
  );
}

export default AboutLearning;