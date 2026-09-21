import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Banner from '@/components/user/home/Banner.jsx';
import AboutLearning from '@/components/user/AboutLearning.jsx';
import YourJourney from '@/components/user/YourJourney.jsx';
import SpecialCourse from '@/components/user/home/SpecialCourse.jsx';
import AdvancedCourse from '@/components/user/home/AdvancedCourse.jsx';
import OurBlog from '@/components/user/home/OurBlog.jsx';
import { NotificationService } from '@/services/NotificationService.jsx';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Home() {
  const toastShownRef = useRef(false);
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t("home.title");
  }, [t]);

  useEffect(() => {
    const LoggedIn = sessionStorage.getItem("LoggedIn");
    if (!LoggedIn || toastShownRef.current) {
      return;
    }
    toastShownRef.current = true;
    NotificationService.fetchUserNotifications().then((notifications) => {
      const unreadCount = notifications.filter(n => !n.isRead).length;
      if (unreadCount > 0) {
        toast.info(t("home.unreadNotification", { count: unreadCount }), {
          autoClose: 3000,
          position: "top-center",
        });
      }
    }).finally(() => {
      sessionStorage.removeItem("LoggedIn");
    });
  }, [t]);

  return (
    <div>
      <ToastContainer />
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
