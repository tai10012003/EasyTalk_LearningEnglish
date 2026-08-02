import React from 'react';
import { useTranslation } from "react-i18next";
import special_cource_1 from "@/assets/images/special_cource/special_cource_1.png";
import special_cource_2 from "@/assets/images/special_cource/special_cource_2.png";
import special_cource_3 from "@/assets/images/special_cource/special_cource_3.png";

function SpecialCourse() {
  const { t } = useTranslation();

  return (
    <section className="special_cource">
        <div className="container">
            <div className="section_tittle">
                <h3>{t("home.specialCourse.title")}</h3>
            </div>
            <div className="row">
                <div className="col-sm-6 col-lg-4">
                    <div className="single_special_cource">
                        <img src={special_cource_1} className="special_img" alt={t("home.specialCourse.grammarImageAlt")} />
                        <div className="special_cource_text">
                            <a href="/grammar" className="btn_4">{t("home.specialCourse.grammarCategory")}</a>
                            <a href="/grammar">
                                <h4>{t("home.specialCourse.grammarTitle")}</h4>
                            </a>
                            <p>
                                {t("home.specialCourse.grammarDescription")}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-4">
                    <div className="single_special_cource">
                        <img src={special_cource_2} className="special_img" alt={t("home.specialCourse.vocabularyImageAlt")} />
                        <div className="special_cource_text">
                            <a href="/flashcards" className="btn_4">{t("home.specialCourse.vocabularyCategory")}</a>
                            <a href="/flashcards">
                                <h4>{t("home.specialCourse.vocabularyTitle")}</h4>
                            </a>
                            <p>
                                {t("home.specialCourse.vocabularyDescription")}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-4">
                    <div className="single_special_cource">
                        <img src={special_cource_3} className="special_img" alt={t("home.specialCourse.pronunciationImageAlt")} />
                        <div className="special_cource_text">
                            <a href="/pronunciation" className="btn_4">{t("home.specialCourse.pronunciationCategory")}</a>
                            <a href="/pronunciation">
                                <h4>{t("home.specialCourse.pronunciationTitle")}</h4>
                            </a>
                            <p>
                                {t("home.specialCourse.pronunciationDescription")}
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
