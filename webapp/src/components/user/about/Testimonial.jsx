import React from 'react';

function Testimonial() {
    const founders = [
        { name: "Phạm Đức Tài", role: "Leader", img: "phamductai.jpeg", content:"Một sản phẩm rất tuyệt vời của chúng tôi"},
        { name: "Đinh Cao Toàn", role: "BA/BM", img: "toandinh.jpeg", content:"Hy vọng dự án sẽ giúp mọi người học tiếng Anh tốt hơn"},
        { name: "Lê Dương Chí Bảo", role: "Developer", img: "lebao.jpeg", content:"Quá chất lượng"},
        { name: "Tô Hoàng Tuấn", role: "UI/UX", img: "tohoangtuan.jpeg", content:"Chúng tôi không ngừng nâng cấp và cải thiện sản phẩm"},
        { name: "Phạm Tuấn Kiệt", role: "Tester", img: "kiet.jpeg", content:"Dự án này sẽ giúp ích rất nhiều cho việc học tập của mọi người"},
    ];

    return (
        <section className="testimonial_part py-5">
        <div className="container">
            <div className="row">
                <div className="col-md-12 col-lg-12">
                    <h5>NHÀ SÁNG LẬP</h5>
                    <div className="section_tittle">
                        <h3>CÁC NHÀ SÁNG LẬP</h3>
                    </div>
                </div>
            </div>
            <div className="row">
            {founders.map((f, idx) => (
                <div key={idx} className="col-md-4 col-sm-6 text-center mb-4">
                    <div className="testimonial_slider_text">
                        <div className="testimonial_slider_img">
                            <img 
                                src={`/src/assets/images/testimonial/${f.img}`} 
                                alt={f.name} 
                                style={{ 
                                    width: "150px", 
                                    borderRadius: "10px", 
                                    transition: "transform 0.3s ease" 
                                }}
                                onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"}
                                onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                            />
                        </div>
                        <p>{f.content}</p>
                        <h4>{f.name}</h4>
                        <h5>{f.role}</h5>
                    </div>
                </div>
            ))}
            </div>
        </div>
        </section>
    );
}

export default Testimonial;