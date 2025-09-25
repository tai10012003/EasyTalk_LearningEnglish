import Home from "../views/user/Home";
import About from "../views/user/About";
import Journey from "../views/user/Journey";
import Gate from "../views/user/Gate";
import Stage from "../views/user/Stage";
import Login from "../views/user/Login";
import Register from "../views/user/Register";
import Story from "../views/user/Story";
import StoryDetail from "../views/user/StoryDetail";
import Grammar from "../views/user/Grammar";
import GrammarDetail from "../views/user/GrammarDetail";
import Pronunciation from "../views/user/Pronunciation";
import PronunciationDetail from "../views/user/PronunciationDetail";
import FlashCardList from "../views/user/FlashCardList";
import FlashCard from "../views/user/FlashCard";
import FlashCardReview from "../views/user/FlashCardReview";
import GrammarExercise from "../views/user/GrammarExercise";
import GrammarExerciseDetail from "../views/user/GrammarExerciseDetail";
import VocabularyExercise from "../views/user/VocabularyExercise";
import VocabularyExerciseDetail from "../views/user/VocabularyExerciseDetail";
import PronunciationExercise from "../views/user/PronunciationExercise";
import PronunciationExerciseDetail from "../views/user/PronunciationExerciseDetail";
import DictationExercise from "../views/user/DictationExercise";
import DictationExerciseDetail from "../views/user/DictationExerciseDetail";
import ChatAI from "../views/user/ChatAI";
import WritingAI from "../views/user/WritingAI";
import UserStreak from "../views/user/UserStreak";
import NotFound from "../views/user/NotFound";
import PrivateRoute from "../components/user/auth/PrivateRoute";

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
    element: (
      <PrivateRoute>
        <Journey />
      </PrivateRoute>
    ),
  },
  {
    path: "/journey/detail/:id",
    element: (
      <PrivateRoute>
        <Gate />
      </PrivateRoute>
    ),
  },
  {
    path: "/stage/:id",
    element: (
      <PrivateRoute>
        <Stage />
      </PrivateRoute>
    ),
  },
  {
    path: "/story",
    element: (
      <PrivateRoute>
        <Story />
      </PrivateRoute>
    ),
  },
  {
    path: "/story/:id",
    element: (
      <PrivateRoute>
        <StoryDetail />
      </PrivateRoute>
    ),
  },
  {
    path: "/grammar",
    element: (
      <PrivateRoute>
        <Grammar />
      </PrivateRoute>
    ),
  },
  {
    path: "/grammar/:id",
    element: (
      <PrivateRoute>
        <GrammarDetail />
      </PrivateRoute>
    ),
  },
  {
    path: "/pronunciation",
    element: (
      <PrivateRoute>
        <Pronunciation />
      </PrivateRoute>
    ),
  },
  {
    path: "/pronunciation/:id",
    element: (
      <PrivateRoute>
        <PronunciationDetail />
      </PrivateRoute>
    ),
  },
  {
    path: "/flashcards",
    element: (
      <PrivateRoute>
        <FlashCardList />
      </PrivateRoute>
    ),
  },
  {
    path: "/flashcards/flashcardlist/:id",
    element: (
      <PrivateRoute>
        <FlashCard />
      </PrivateRoute>
    ),
  },
  {
    path: "/flashcards/flashcardlist/:id/review",
    element: (
      <PrivateRoute>
        <FlashCardReview />
      </PrivateRoute>
    ),
  },
  {
    path: "/grammar-exercise",
    element: (
      <GrammarExercise />
    ),
  },
  {
    path: "/grammar-exercise/:id",
    element: (
      <GrammarExerciseDetail />
    ),
  },
  {
    path: "/vocabulary-exercise",
    element: (
      <VocabularyExercise />
    ),
  },
  {
    path: "/vocabulary-exercise/:id",
    element: (
      <VocabularyExerciseDetail />
    ),
  },
  {
    path: "/pronunciation-exercise",
    element: (
      <PronunciationExercise />
    ),
  },
  {
    path: "/pronunciation-exercise/:id",
    element: (
      <PronunciationExerciseDetail />
    ),
  },
  {
    path: "/dictation-exercise",
    element: (
      <DictationExercise />
    ),
  },
  {
    path: "/dictation-exercise/:id",
    element: (
      <DictationExerciseDetail />
    ),
  },
  {
    path: "/chat",
    element: (
      <PrivateRoute>
        <ChatAI />
      </PrivateRoute>
    ),
  },
  {
    path: "/writing",
    element: (
      <PrivateRoute>
        <WritingAI />
      </PrivateRoute>
    ),
  },
  {
    path: "/streak",
    element: (
      <PrivateRoute>
        <UserStreak />
      </PrivateRoute>
    ),
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