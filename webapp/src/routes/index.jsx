import Home from "../views/user/Home";
import About from "../views/user/About";
import Journey from "../views/user/Journey";
import Gate from "../views/user/Gate";
import Login from "../views/user/Login";
import Register from "../views/user/Register";
import Story from "../views/user/Story";
import StoryDetail from "../views/user/StoryDetail";
import Grammar from "../views/user/Grammar";
import GrammarDetail from "../views/user/GrammarDetail";
import FlashcardList from "../views/user/FlashcardList";
import NotFound from "../views/user/NotFound";

const routes = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/journey",
    element: <Journey />,
  },
  {
    path: "/gate",
    element: <Gate />,
  },
  {
    path: "/story",
    element: <Story />,
  },
  {
    path: "/story/:id",
    element: <StoryDetail />,
  },
  {
    path: "/grammar",
    element: <Grammar />,
  },
  {
    path: "/grammar/:id",
    element: <GrammarDetail />,
  },
  {
    path: "/flashcards",
    element: <FlashcardList />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;