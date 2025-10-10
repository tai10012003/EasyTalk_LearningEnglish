import Dashboard from "@/views/admin/Dashboard";
import Journey from "@/views/admin/Journey";
import Gate from "@/views/admin/Gate";
import Stage from "@/views/admin/stage/Stage";
import AddStage from "@/views/admin/stage/AddStagePage";
import UpdateStage from "@/views/admin/stage/UpdateStagePage"
import Grammar from "@/views/admin/grammar/Grammar";
import AddGrammar from "@/views/admin/grammar/AddGrammar";
import UpdateGrammar from "@/views/admin/grammar/UpdateGrammar"
import Pronunciation from "@/views/admin/pronunciation/Pronunciation";
import AddPronunciation from "@/views/admin/pronunciation/AddPronunciation";
import UpdatePronunciation from "@/views/admin/pronunciation/UpdatePronunciation"
import Story from "@/views/admin/story/Story";
import AddStory from "@/views/admin/story/AddStoryPage";
import UpdateStory from "@/views/admin/story/UpdateStoryPage"
import GrammarExercise from "@/views/admin/grammarexercise/GrammarExercise";
import AddGrammarExercise from "@/views/admin/grammarexercise/AddGrammarExercise";
import UpdateGrammarExercise from "@/views/admin/grammarexercise/UpdateGrammarExercise";
import VocabularyExercise from "@/views/admin/vocabularyexercise/VocabularyExercise";
import AddVocabularyExercise from "@/views/admin/vocabularyexercise/AddVocabularyExercise";
import UpdateVocabularyExercise from "@/views/admin/vocabularyexercise/UpdateVocabularyExercise";
import PronunciationExercise from "@/views/admin/pronunciationexercise/PronunciationExercise";
import AddPronunciationExercise from "@/views/admin/pronunciationexercise/AddPronunciationExercise";
import UpdatePronunciationExercise from "@/views/admin/pronunciationexercise/UpdatePronunciationExercise";
import DictationExercise from "@/views/admin/dictation/DictationExercise";
import AddDictationExercise from "@/views/admin/dictation/AddDictationExercise";
import UpdateDictationExercise from "@/views/admin/dictation/UpdateDictationExercise";
import User from "@/views/admin/user/User";
import AddUser from "@/views/admin/user/AddUserPage";
import UpdateUser from "@/views/admin/user/UpdateUserPage";
import NotFound from "@/views/admin/NotFound.jsx";
import PrivateRoute from "@/components/user/auth/PrivateRoute.jsx";

const AdminRoute = [
    {
        path: "dashboard",
        element: (
            <PrivateRoute roles={["admin"]}>
                <Dashboard />
            </PrivateRoute>
        ),
    },
    {
        path: "journey",
        element: (
            <PrivateRoute roles={["admin"]}>
                <Journey />
            </PrivateRoute>
        ),
    },
    {
        path: "gate",
        element: (
            <PrivateRoute roles={["admin"]}>
                <Gate />
            </PrivateRoute>
        ),
    },
    {
        path: "stage",
        element: (
            <PrivateRoute roles={["admin"]}>
                <Stage />
            </PrivateRoute>
        ),
    },
    {
        path: "stage/add",
        element: (
            <PrivateRoute roles={["admin"]}>
                <AddStage />
            </PrivateRoute>
        ),
    },
    {
        path: "stage/update/:id",
        element: (
            <PrivateRoute roles={["admin"]}>
                <UpdateStage />
            </PrivateRoute>
        ),
    },
    {
        path: "grammar",
        element: (
            <PrivateRoute roles={["admin"]}>
                <Grammar />
            </PrivateRoute>
        ),
    },
    {
        path: "grammar/add",
        element: (
            <PrivateRoute roles={["admin"]}>
                <AddGrammar />
            </PrivateRoute>
        ),
    },
    {
        path: "grammar/update/:id",
        element: (
            <PrivateRoute roles={["admin"]}>
                <UpdateGrammar />
            </PrivateRoute>
        ),
    },
    {
        path: "pronunciation",
        element: (
            <PrivateRoute roles={["admin"]}>
                <Pronunciation />
            </PrivateRoute>
        ),
    },
    {
        path: "pronunciation/add",
        element: (
            <PrivateRoute roles={["admin"]}>
                <AddPronunciation />
            </PrivateRoute>
        ),
    },
    {
        path: "pronunciation/update/:id",
        element: (
            <PrivateRoute roles={["admin"]}>
                <UpdatePronunciation />
            </PrivateRoute>
        ),
    },
    {
        path: "story",
        element: (
            <PrivateRoute roles={["admin"]}>
                <Story />
            </PrivateRoute>
        ),
    },
    {
        path: "story/add",
        element: (
            <PrivateRoute roles={["admin"]}>
                <AddStory />
            </PrivateRoute>
        ),
    },
    {
        path: "story/update/:id",
        element: (
            <PrivateRoute roles={["admin"]}>
                <UpdateStory />
            </PrivateRoute>
        ),
    },
    {
        path: "grammar-exercise",
        element: (
            <PrivateRoute roles={["admin"]}>
                <GrammarExercise />
            </PrivateRoute>
        ),
    },
    {
        path: "grammar-exercise/add",
        element: (
            <PrivateRoute roles={["admin"]}>
                <AddGrammarExercise />
            </PrivateRoute>
        ),
    },
    {
        path: "grammar-exercise/update/:id",
        element: (
            <PrivateRoute roles={["admin"]}>
                <UpdateGrammarExercise />
            </PrivateRoute>
        ),
    },
    {
        path: "vocabulary-exercise",
        element: (
            <PrivateRoute roles={["admin"]}>
                <VocabularyExercise />
            </PrivateRoute>
        ),
    },
    {
        path: "vocabulary-exercise/add",
        element: (
            <PrivateRoute roles={["admin"]}>
                <AddVocabularyExercise />
            </PrivateRoute>
        ),
    },
    {
        path: "vocabulary-exercise/update/:id",
        element: (
            <PrivateRoute roles={["admin"]}>
                <UpdateVocabularyExercise />
            </PrivateRoute>
        ),
    },
    {
        path: "pronunciation-exercise",
        element: (
            <PrivateRoute roles={["admin"]}>
                <PronunciationExercise />
            </PrivateRoute>
        ),
    },
    {
        path: "pronunciation-exercise/add",
        element: (
            <PrivateRoute roles={["admin"]}>
                <AddPronunciationExercise />
            </PrivateRoute>
        ),
    },
    {
        path: "pronunciation-exercise/update/:id",
        element: (
            <PrivateRoute roles={["admin"]}>
                <UpdatePronunciationExercise />
            </PrivateRoute>
        ),
    },
    {
        path: "dictation-exercise",
        element: (
            <PrivateRoute roles={["admin"]}>
                <DictationExercise />
            </PrivateRoute>
        ),
    },
    {
        path: "dictation-exercise/add",
        element: (
            <PrivateRoute roles={["admin"]}>
                <AddDictationExercise />
            </PrivateRoute>
        ),
    },
    {
        path: "dictation-exercise/update/:id",
        element: (
            <PrivateRoute roles={["admin"]}>
                <UpdateDictationExercise />
            </PrivateRoute>
        ),
    },
    {
        path: "user",
        element: (
            <PrivateRoute roles={["admin"]}>
                <User />
            </PrivateRoute>
        ),
    },
    {
        path: "user/add",
        element: (
            <PrivateRoute roles={["admin"]}>
                <AddUser />
            </PrivateRoute>
        ),
    },
    {
        path: "user/update/:id",
        element: (
            <PrivateRoute roles={["admin"]}>
                <UpdateUser />
            </PrivateRoute>
        ),
    },
    {
        path: "*",
        element: <NotFound />,
    },
];


export default AdminRoute;