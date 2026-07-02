import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import LandingPage from "@/pages/landing/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ExplorePage from "@/pages/quiz/ExplorePage";
import TeacherDashboard from "@/pages/dashboard/TeacherDashboard";
import CreateQuizPage from "@/pages/quiz/CreateQuizPage";
import HostGamePage from "@/pages/game/HostGamePage";
import JoinGamePage from "@/pages/game/JoinGamePage";
import PlayGamePage from "@/pages/game/PlayGamePage";
import ProfilePage from "@/pages/profile/ProfilePage";
import LeaderboardPage from "@/pages/landing/LeaderboardPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";

function ProtectedRoute({ children, roles }: { children: JSX.Element; roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading ThinkArena...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout><LandingPage /></Layout>} />
      <Route path="/login" element={<Layout hideFooter><LoginPage /></Layout>} />
      <Route path="/register" element={<Layout hideFooter><RegisterPage /></Layout>} />
      <Route path="/explore" element={<Layout><ExplorePage /></Layout>} />
      <Route path="/leaderboard" element={
        <ProtectedRoute roles={["teacher", "administrator"]}>
          <Layout><LeaderboardPage /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute roles={["teacher", "administrator"]}>
          <Layout><TeacherDashboard /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/create" element={
        <ProtectedRoute roles={["teacher", "administrator"]}>
          <Layout><CreateQuizPage /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/edit/:id" element={
        <ProtectedRoute roles={["teacher", "administrator"]}>
          <Layout><CreateQuizPage /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/host/:quizId" element={
        <ProtectedRoute roles={["teacher", "administrator"]}>
          <Layout hideFooter><HostGamePage /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/join" element={<Layout hideFooter><JoinGamePage /></Layout>} />
      <Route path="/play/:gameId/:playerId" element={<Layout hideFooter><PlayGamePage /></Layout>} />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout><ProfilePage /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute roles={["administrator"]}>
          <Layout><AdminDashboard /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
            <p className="text-gray-500 mb-4">Page not found</p>
            <a href="/" className="text-primary-500 hover:underline">Go home</a>
          </div>
        </div>
      } />
    </Routes>
  );
}
