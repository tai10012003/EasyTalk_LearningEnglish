import React from 'react';

function YourJourney() {
  return (
    <section className="feature_part py-12 bg-gray-100">
        <div className="container mx-auto">
            <div className="row flex flex-wrap justify-center gap-6">
                <div className="col-sm-6 col-md-4 col-xl-3 flex justify-center">
                    <div className="single_feature_text text-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <h4 className="text-xl font-semibold mb-2">HÀNH TRÌNH CỦA BẠN</h4>
                        <p className="text-gray-600 mb-4">
                            Bắt đầu hành trình cá nhân hóa để thành thạo tiếng Anh, phù hợp với tiến trình và mục tiêu của bạn. Hãy tận dụng từng bước đi!
                        </p>
                        <a href="/journey" className="btn_1 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            {/* <i className="fas fa-play me-2"></i> */}
                            BẮT ĐẦU NGAY
                        </a>
                    </div>
                </div>
                <div className="col-sm-6 col-md-4 col-xl-3 flex justify-center">
                    <div className="single_feature text-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <div className="single_feature_part">
                            <span className="single_feature_icon inline-block mb-3">
                                <i className="ti-layers text-3xl text-blue-600"></i>
                            </span>
                            <h4 className="text-xl font-semibold mb-2">Bài học cá nhân hóa</h4>
                            <p className="text-gray-600 mb-4">
                                Hành trình của bạn được thiết kế riêng cho trình độ kỹ năng và tốc độ học tập của bạn, đảm bảo bạn đạt được mục tiêu một cách hiệu quả.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-md-4 col-xl-3 flex justify-center">
                    <div className="single_feature text-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <div className="single_feature_part">
                            <span className="single_feature_icon inline-block mb-3">
                            <i className="ti-new-window text-3xl text-blue-600"></i>
                            </span>
                            <h4 className="text-xl font-semibold mb-2">Những thử thách hấp dẫn</h4>
                            <p className="text-gray-600 mb-4">
                            Từ các câu đố đến các bài học tương tác, hành trình của bạn bao gồm những thử thách thú vị để đảm bảo bạn vừa học vừa tận hưởng quá trình này.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-md-4 col-xl-3 flex justify-center">
                    <div className="single_feature text-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <div className="single_feature_part single_feature_part_2">
                            <span className="single_service_icon style_icon inline-block mb-3">
                            <i className="ti-light-bulb text-3xl text-blue-600"></i>
                            </span>
                            <h4 className="text-xl font-semibold mb-2">Theo dõi tiến trình của bạn</h4>
                            <p className="text-gray-600 mb-4">
                            Với mỗi bài học hoàn thành, bạn tiến gần hơn một bước đến sự trôi chảy. Hành trình giúp bạn duy trì động lực và tập trung vào mục tiêu của mình.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
}

export default YourJourney;