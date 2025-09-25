import { useEffect } from "react";
import Banner from '@/components/user/home/Banner.jsx';
import AboutLearning from '@/components/user/AboutLearning.jsx';
import YourJourney from '@/components/user/YourJourney.jsx';
import SpecialCourse from '@/components/user/home/SpecialCourse.jsx';
import AdvancedCourse from '@/components/user/home/AdvancedCourse.jsx';
import OurBlog from '@/components/user/home/OurBlog.jsx';

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