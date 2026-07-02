import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { quizzesAPI, usersAPI } from "@/lib/api";
import Button from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Edit, Trash2, Copy, Play, BarChart3, BookOpen, Users, TrendingUp, Download } from "lucide-react";
import toast from "react-hot-toast";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [quizRes, profileRes] = await Promise.all([
        quizzesAPI.list({ mine: true }),
        usersAPI.getProfile(),
      ]);
      setQuizzes(quizRes.data);
      setProfile(profileRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this quiz?")) return;
    try {
      await quizzesAPI.delete(id);
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
      toast.success("Quiz deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await quizzesAPI.duplicate(id);
      toast.success("Quiz duplicated");
      loadData();
    } catch {
      toast.error("Failed to duplicate");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Title", "Difficulty", "Questions", "Plays"];
    const rows = quizzes.map((q) => [q.title, q.difficulty, q.question_count, q.play_count]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my_quizzes.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-gray-500">Manage your quizzes and view performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Link to="/create">
            <Button><Plus className="w-4 h-4 mr-2" /> Create Quiz</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{profile?.quizzes_created || 0}</p>
              <p className="text-sm text-gray-500">Quizzes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Play className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{profile?.games_hosted || 0}</p>
              <p className="text-sm text-gray-500">Games Hosted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{profile?.xp || 0}</p>
              <p className="text-sm text-gray-500">Total XP</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-secondary-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">Level {profile?.level || 1}</p>
              <p className="text-sm text-gray-500">Current Level</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">My Quizzes</h2>
        </CardHeader>
        <CardContent>
          {quizzes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">You haven't created any quizzes yet</p>
              <Link to="/create"><Button>Create Your First Quiz</Button></Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Difficulty</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">Questions</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">Plays</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map((quiz) => (
                    <tr key={quiz.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <span className="font-medium">{quiz.title}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={quiz.difficulty === "easy" ? "success" : quiz.difficulty === "hard" ? "danger" : "warning"}>
                          {quiz.difficulty}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">{quiz.question_count}</td>
                      <td className="py-3 px-4 text-center">{quiz.play_count}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => navigate(`/quiz/${quiz.id}`)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="View">
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/edit/${quiz.id}`)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDuplicate(quiz.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Duplicate">
                            <Copy className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/host/${quiz.id}`)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-green-500" title="Host Game">
                            <Play className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(quiz.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
