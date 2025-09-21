import {React, useEffect } from "react";
import AboutLearning from '../../components/user/AboutLearning';
import YourJourney from '../../components/user/YourJourney';
import Testimonial from "../../components/user/about/Testimonial";

function About() {
  useEffect(() => {
      document.title = "Giới thiệu - EasyTalk";
  }, []);

  return (
    <div>
      <AboutLearning />
      <YourJourney />
      <Testimonial />
    </div>
  );
}

export default About;
