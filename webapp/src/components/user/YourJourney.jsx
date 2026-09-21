import React from 'react';
import { useTranslation } from "react-i18next";

function YourJourney() {
  const { t } = useTranslation();

  return (
    <section className="feature_part py-12 bg-gray-100">
        <div className="container mx-auto">
            <div className="row flex flex-wrap justify-center gap-6">
                <div className="col-sm-6 col-md-4 col-xl-3 flex justify-center">
                    <div className="single_feature_text text-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <h4 className="text-xl font-semibold mb-2">{t("home.journey.title")}</h4>
                        <p className="text-gray-600 mb-4">
                            {t("home.journey.description")}
                        </p>
                        <a href="/journey" className="btn_1 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            {/* <i className="fas fa-play me-2"></i> */}
                            {t("home.journey.start")}
                        </a>
                    </div>
                </div>
                <div className="col-sm-6 col-md-4 col-xl-3 flex justify-center">
                    <div className="single_feature text-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <div className="single_feature_part">
                            <span className="single_feature_icon inline-block mb-3">
                                <i className="ti-layers text-3xl text-blue-600"></i>
                            </span>
                            <h4 className="text-xl font-semibold mb-2">{t("home.journey.personalizedTitle")}</h4>
                            <p className="text-gray-600 mb-4">
                                {t("home.journey.personalizedDescription")}
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
                            <h4 className="text-xl font-semibold mb-2">{t("home.journey.challengeTitle")}</h4>
                            <p className="text-gray-600 mb-4">
                            {t("home.journey.challengeDescription")}
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
                            <h4 className="text-xl font-semibold mb-2">{t("home.journey.progressTitle")}</h4>
                            <p className="text-gray-600 mb-4">
                            {t("home.journey.progressDescription")}
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
