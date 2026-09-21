import React from 'react';
import { useTranslation } from "react-i18next";
import learningenglish from "@/assets/images/learningenglish.png"

function AboutLearning() {
  const { t } = useTranslation();

  return (
    <section className="learning_part">
        <div className="container">
            <div className="row">
                <div className="col-md-7 col-lg-7">
                    <div className="learning_img">
                        <img src={learningenglish} alt={t("home.aboutLearning.imageAlt")} />
                    </div>
                </div>
                <div className="col-md-5 col-lg-5">
                    <div className="learning_member_text">
                        <h5>{t("home.aboutLearning.eyebrow")}</h5>
                        <h4>{t("home.aboutLearning.title")}</h4>
                        <p>{t("home.aboutLearning.description")}</p>
                        <ul>
                            <li>
                                <span className="ti-pencil-alt"></span>
                                {t("home.aboutLearning.interactiveLessons")}
                            </li>
                            <li>
                                <span className="ti-ruler-pencil"></span>
                                {t("home.aboutLearning.realPractice")}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
}

export default AboutLearning;
