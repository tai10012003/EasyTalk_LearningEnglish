import React from 'react';
import { useTranslation } from "react-i18next";

function AdvancedCourse() {
  const { t } = useTranslation();

  return (
    <section className="advance_feature">
        <div className="container">
            <div className="row">
                <div className="col-md-12 col-lg-12">
                    <div className="learning_member_text">
                        <h5>{t("home.advancedCourse.eyebrow")}</h5>
                        <div className="section_tittle">
                            <h3>{t("home.advancedCourse.title")}</h3>
                        </div>
                        <p>
                            {t("home.advancedCourse.description")}
                        </p>
                        <div className="row">
                            <div className="col-sm-6 col-lg-4 col-xl-4">
                                <a href="/grammar-exercise" className="learning_member_text_link">
                                <div className="learning_member_text_iner">
                                    <span className="ti-book"></span>
                                    <h4>{t("home.advancedCourse.grammarTitle")}</h4>
                                    <p>
                                    {t("home.advancedCourse.grammarDescription")}
                                    </p>
                                </div>
                                </a>
                            </div>
                            <div className="col-sm-6 col-lg-4 col-xl-4">
                                <a href="/pronunciation-exercise" className="learning_member_text_link">
                                <div className="learning_member_text_iner">
                                    <span className="ti-microphone"></span>
                                    <h4>{t("home.advancedCourse.pronunciationTitle")}</h4>
                                    <p>
                                    {t("home.advancedCourse.pronunciationDescription")}
                                    </p>
                                </div>
                                </a>
                            </div>
                            <div className="col-sm-6 col-lg-4 col-xl-4">
                                <a href="/vocabulary-exercise" className="learning_member_text_link">
                                <div className="learning_member_text_iner">
                                    <span className="ti-light-bulb"></span>
                                    <h4>{t("home.advancedCourse.vocabularyTitle")}</h4>
                                    <p>
                                    {t("home.advancedCourse.vocabularyDescription")}
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
