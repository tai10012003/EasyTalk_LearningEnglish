import React from 'react';

function OurBlog() {
  return (
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
  );
}

export default OurBlog;