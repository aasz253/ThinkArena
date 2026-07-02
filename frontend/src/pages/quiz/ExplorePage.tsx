import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { quizzesAPI } from "@/lib/api";
import Button from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, User, Play, Brain, Key } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function ExplorePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");

  useEffect(() => {
    loadQuizzes();
  }, [difficulty]);

  const loadQuizzes = async () => {
    try {
      const params: any = { limit: 50 };
      if (difficulty) params.difficulty = difficulty;
      if (search) params.search = search;
      const res = await quizzesAPI.list(params);
      setQuizzes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadQuizzes();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {(!user || user.role === "student") && (
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 p-0.5">
            <div className="rounded-2xl bg-gray-900 p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Join a Live Quiz</h2>
              <p className="text-gray-300 mb-6">Enter the 6-digit PIN from your teacher to join the game!</p>
              <button
                onClick={() => navigate("/join")}
                className="animate-blink-bg px-10 py-4 rounded-xl text-lg font-bold text-white shadow-2xl transition-all hover:scale-105"
              >
                <Key className="w-5 h-5 inline mr-2" />
                Join with Passcode
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Explore Quizzes</h1>
          <p className="text-gray-500">Discover quizzes created by the community</p>
        </div>
        {user && (user.role === "teacher" || user.role === "administrator") && (
          <Link to="/create">
            <Button>Create Quiz</Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quizzes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary-500 outline-none"
            />
          </div>
        </form>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary-500 outline-none"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-4 bg-gray-200 rounded mb-3" /><div className="h-3 bg-gray-200 rounded w-2/3" /></CardContent>
            </Card>
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-20">
          <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500">No quizzes found</h3>
          <p className="text-gray-400 mt-2">Try a different search or create your own!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Link key={quiz.id} to={`/quiz/${quiz.id}`}>
              <Card hover className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={quiz.difficulty === "easy" ? "success" : quiz.difficulty === "hard" ? "danger" : "warning"}>
                      {quiz.difficulty}
                    </Badge>
                    <span className="text-sm text-gray-400">{quiz.question_count} questions</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{quiz.title}</h3>
                  {quiz.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">{quiz.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {quiz.creator_name}</span>
                    <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {quiz.play_count}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
