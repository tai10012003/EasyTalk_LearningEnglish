import {React, useEffect } from "react";
import AboutLearning from '@/components/user/AboutLearning.jsx';
import YourJourney from '@/components/user/YourJourney.jsx';
import Testimonial from "@/components/user/about/Testimonial.jsx";

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
