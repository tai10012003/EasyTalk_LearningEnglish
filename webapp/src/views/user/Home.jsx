import { useEffect } from "react";
import Banner from '../../components/user/home/Banner';
import AboutLearning from '../../components/user/AboutLearning';
import YourJourney from '../../components/user/YourJourney';
import SpecialCourse from '../../components/user/home/SpecialCourse';
import AdvancedCourse from '../../components/user/home/AdvancedCourse';
import OurBlog from '../../components/user/home/OurBlog';

function Home() {
  useEffect(() => {
    document.title = "Trang chủ - EasyTalk";
  }, []);
  return (
    <div>
      <Banner />
      <AboutLearning />
      <YourJourney />
      <SpecialCourse />
      <AdvancedCourse />
      <OurBlog />
    </div>
  );
}

export default Home;