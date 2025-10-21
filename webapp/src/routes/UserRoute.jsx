import Home from "@/views/user/Home.jsx";
import About from "@/views/user/About.jsx";
import Journey from "@/views/user/Journey.jsx";
import Gate from "@/views/user/Gate.jsx";
import Stage from "@/views/user/Stage.jsx";
import Login from "@/views/Login.jsx";
import Register from "@/views/Register.jsx";
import ChangePassword from "@/views/user/ChangePassword.jsx";
import ForgotPassword from "@/views/user/ForgotPassword.jsx";
import Story from "@/views/user/Story.jsx";
import StoryDetail from "@/views/user/StoryDetail.jsx";
import Grammar from "@/views/user/Grammar.jsx";
import GrammarDetail from "@/views/user/GrammarDetail.jsx";
import Pronunciation from "@/views/user/Pronunciation.jsx";
import PronunciationDetail from "@/views/user/PronunciationDetail.jsx";
import FlashCardList from "@/views/user/FlashCardList.jsx";
import FlashCard from "@/views/user/FlashCard.jsx";
import FlashCardReview from "@/views/user/FlashCardReview.jsx";
import GrammarExercise from "@/views/user/GrammarExercise.jsx";
import GrammarExerciseDetail from "@/views/user/GrammarExerciseDetail.jsx";
import VocabularyExercise from "@/views/user/VocabularyExercise.jsx";
import VocabularyExerciseDetail from "@/views/user/VocabularyExerciseDetail.jsx";
import PronunciationExercise from "@/views/user/PronunciationExercise.jsx";
import PronunciationExerciseDetail from "@/views/user/PronunciationExerciseDetail.jsx";
import DictationExercise from "@/views/user/DictationExercise.jsx";
import DictationExerciseDetail from "@/views/user/DictationExerciseDetail.jsx";
import ChatAI from "@/views/user/ChatAI.jsx";
import WritingAI from "@/views/user/WritingAI.jsx";
import UserStreak from "@/views/user/UserStreak.jsx";
import Reminder from "@/views/user/Reminder.jsx";
import NotFound from "@/views/user/NotFound.jsx";
import PrivateRoute from "@/components/user/auth/PrivateRoute.jsx";

const UserRoute = [
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
        path: "/reminder",
        element: (
        <PrivateRoute>
            <Reminder />
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
        path: "/change-password",
        element: (
        <PrivateRoute>
            <ChangePassword />
        </PrivateRoute>
        ),
    },
    {
        path: "/forgot-password",
        element: <ForgotPassword />,
    },
    {
        path: "*",
        element: <NotFound />,
    },
];

export default UserRoute;