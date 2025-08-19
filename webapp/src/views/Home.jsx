import React from 'react';
import Banner from '../components/Banner';
import Menu from '../components/Menu';
import Footer from '../components/Footer';

function Home() {
  return (
    <div>
      <Menu />
      <Banner />
      
      {/* About Us Section */}
      <section className="learning_part">
        <div className="container">
          <div className="row">
            <div className="col-md-7 col-lg-7">
              <div className="learning_img">
                <img src="/static/images/learningenglish.png" alt="Learning English Online" />
              </div>
            </div>
            <div className="col-md-5 col-lg-5">
              <div className="learning_member_text">
                <h5>Về chúng tôi</h5>
                <h3>Học tiếng Anh dễ dàng và thú vị</h3>
                <p>
                  Tại EasyTalk, chúng tôi tin rằng việc học tiếng Anh phải thú vị và dễ tiếp cận với tất cả mọi người. Nền tảng của chúng tôi cung cấp các bài học tương tác, thử thách thú vị và nội dung được cá nhân hóa giúp bạn cải thiện kỹ năng của mình từng bước.
                </p>
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

      {/* Features Section */}
      <section className="feature_part">
        <div className="container">
          <div className="row">
            <div className="col-sm-6 col-xl-3">
              <div className="single_feature_text">
                <h3>Hành trình của bạn</h3>
                <p>
                  Bắt đầu hành trình cá nhân hóa để thành thạo tiếng Anh, phù hợp với tiến trình và mục tiêu của bạn. Hãy tận dụng từng bước đi!
                </p>
                <a href="/journey" className="btn_1">BẮT ĐẦU NGAY</a>
              </div>
            </div>
            <div className="col-sm-6 col-xl-3">
              <div className="single_feature">
                <div className="single_feature_part">
                  <span className="single_feature_icon">
                    <i className="ti-layers"></i>
                  </span>
                  <h4>Bài học cá nhân hóa</h4>
                  <p>
                    Hành trình của bạn được thiết kế riêng cho trình độ kỹ năng và tốc độ học tập của bạn, đảm bảo bạn đạt được mục tiêu một cách hiệu quả.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-xl-3">
              <div className="single_feature">
                <div className="single_feature_part">
                  <span className="single_feature_icon">
                    <i className="ti-new-window"></i>
                  </span>
                  <h4>Những thử thách hấp dẫn</h4>
                  <p>
                    Từ các câu đố đến các bài học tương tác, hành trình của bạn bao gồm những thử thách thú vị để đảm bảo bạn vừa học vừa tận hưởng quá trình này.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-xl-3">
              <div className="single_feature">
                <div className="single_feature_part single_feature_part_2">
                  <span className="single_service_icon style_icon">
                    <i className="ti-light-bulb"></i>
                  </span>
                  <h4>Theo dõi tiến trình của bạn</h4>
                  <p>
                    Với mỗi bài học hoàn thành, bạn tiến gần hơn một bước đến sự trôi chảy. Hành trình giúp bạn duy trì động lực và tập trung vào mục tiêu của mình.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Courses Section */}
      <section className="special_cource">
        <div className="container">
          <div className="section_tittle">
            <h3>CÁC BÀI HỌC PHỔ BIẾN</h3>
          </div>
          <div className="row">
            <div className="col-sm-6 col-lg-4">
              <div className="single_special_cource">
                <img src="/static/images/special_cource_1.png" className="special_img" alt="Grammar Course" />
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
                <img src="/static/images/special_cource_2.png" className="special_img" alt="Vocabulary Course" />
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
                <img src="/static/images/special_cource_3.png" className="special_img" alt="Pronunciation Course" />
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

      {/* Advanced Features Section */}
      <section className="advance_feature learning_part">
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
                  <div className="col-sm-4 col-md-12 col-lg-4">
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
                  <div className="col-sm-4 col-md-12 col-lg-4">
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
                  <div className="col-sm-4 col-md-12 col-lg-4">
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

      {/* Blog Section */}
      <section className="blog_part">
        <div className="container">
          <div className="section_tittle">
            <h3>BÀI VIẾT CỦA CHÚNG TÔI</h3>
          </div>
          <div className="row">
            <div className="col-sm-6 col-lg-4 col-xl-4">
              <div className="single-home-blog">
                <div className="card">
                  <img src="/static/images/blog/single_blog_1.jpeg" className="card-img-top" alt="blog" />
                  <div className="card-body">
                    <a href="/single-blog">
                      <h5 className="section-tittle">Giao lưu văn hóa anh ngữ</h5>
                    </a>
                    <p>Mà lời nói bóng tối của nó là sự sống cho cá trong đó tất cả cá cùng được gọi là</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-lg-4 col-xl-4">
              <div className="single-home-blog">
                <div className="card">
                  <img src="/static/images/blog/single_blog_2.png" className="card-img-top" alt="blog" />
                  <div className="card-body">
                    <a href="/single-blog-1">
                      <h5 className="section-tittle">Top 10 thí sinh lọt top cuộc thi tìm kiếm tài năng Anh-Việt</h5>
                    </a>
                    <p>Mà lời nói bóng tối của nó là sự sống cho cá trong đó tất cả cá cùng được gọi là</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-lg-4 col-xl-4">
              <div className="single-home-blog">
                <div className="card">
                  <img src="/static/images/blog/single_blog_3.webp" className="card-img-top" alt="blog" />
                  <div className="card-body">
                    <a href="/single-blog-1">
                      <h5 className="section-tittle">Ngành Ngôn ngữ Anh – con đường của sự đam mê ngoại ngữ Anh</h5>
                    </a>
                    <p>Mà lời nói bóng tối của nó là sự sống cho cá trong đó tất cả cá cùng được gọi là</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;