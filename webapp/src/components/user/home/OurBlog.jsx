import React from 'react';
import { useTranslation } from "react-i18next";
import blog1 from "@/assets/images/blog/single_blog_1.jpeg";
import blog2 from "@/assets/images/blog/single_blog_2.png";
import blog3 from "@/assets/images/blog/single_blog_3.png";

function OurBlog() {
  const { t } = useTranslation();

  return (
    <section className="blog_part">
        <div className="container">
            <div className="section_tittle">
                <h3>{t("home.blog.title")}</h3>
            </div>
            <div className="row">
                <div className="col-sm-6 col-lg-4 col-xl-4">
                    <div className="single-home-blog">
                        <div className="card">
                            <img src={blog1} className="card-img-top" alt={t("home.blog.imageAlt")} />
                            <div className="card-body">
                                <a href="/single-blog">
                                <h5 className="section-tittle">{t("home.blog.firstTitle")}</h5>
                                </a>
                                <p>{t("home.blog.firstDescription")}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-4 col-xl-4">
                    <div className="single-home-blog">
                        <div className="card">
                            <img src={blog2} className="card-img-top" alt={t("home.blog.imageAlt")} />
                            <div className="card-body">
                                <a href="/single-blog-1">
                                <h5 className="section-tittle">{t("home.blog.secondTitle")}</h5>
                                </a>
                                <p>{t("home.blog.secondDescription")}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-4 col-xl-4">
                    <div className="single-home-blog">
                        <div className="card">
                            <img src={blog3} className="card-img-top" alt={t("home.blog.imageAlt")} />
                            <div className="card-body">
                                <a href="/single-blog-1">
                                <h5 className="section-tittle">{t("home.blog.thirdTitle")}</h5>
                                </a>
                                <p>{t("home.blog.thirdDescription")}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="text-center mt-4">
                <a href="/blog" className="btn_1">{t("home.blog.viewAll")}</a>
            </div>
        </div>
    </section>
  );
}

export default OurBlog;
