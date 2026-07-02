import { useState, useEffect } from "react";
import { adminAPI } from "@/lib/api";
import Button from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Gamepad2, Activity, Trash2, Shield, Ban } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview" | "users" | "quizzes">("overview");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashRes, userRes, quizRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.listUsers({ limit: 50 }),
        adminAPI.listQuizzes({ limit: 50 }),
      ]);
      setDashboard(dashRes.data);
      setUsers(userRes.data);
      setQuizzes(quizRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (userId: string) => {
    try {
      await adminAPI.toggleUserActive(userId);
      toast.success("User status toggled");
      loadData();
    } catch {
      toast.error("Failed");
    }
  };

  const changeRole = async (userId: string, role: string) => {
    try {
      await adminAPI.updateUserRole(userId, role);
      toast.success("Role updated");
      loadData();
    } catch {
      toast.error("Failed");
    }
  };

  const deleteQuiz = async (id: string) => {
    if (!confirm("Delete this quiz?")) return;
    try {
      await adminAPI.deleteQuiz(id);
      toast.success("Quiz deleted");
      loadData();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="flex gap-2 mb-6">
        {["overview", "users", "quizzes"].map((t) => (
          <Button key={t} variant={tab === t ? "primary" : "ghost"} size="sm" onClick={() => setTab(t as any)}>
            {t === "overview" ? "Overview" : t === "users" ? "Users" : "Quizzes"}
          </Button>
        ))}
      </div>

      {tab === "overview" && dashboard && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card><CardContent className="p-4 text-center">
              <Users className="w-5 h-5 text-primary-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{dashboard.total_users}</p>
              <p className="text-xs text-gray-500">Total Users</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <Shield className="w-5 h-5 text-secondary-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{dashboard.total_teachers}</p>
              <p className="text-xs text-gray-500">Teachers</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <Users className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{dashboard.total_students}</p>
              <p className="text-xs text-gray-500">Students</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <BookOpen className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{dashboard.total_quizzes}</p>
              <p className="text-xs text-gray-500">Quizzes</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <Gamepad2 className="w-5 h-5 text-accent-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{dashboard.total_games}</p>
              <p className="text-xs text-gray-500">Games</p>
            </CardContent></Card>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Recent Users</h3>
                {dashboard.recent_users?.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="font-medium">{u.username}</span>
                    <Badge variant="info">{u.role}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Recent Quizzes</h3>
                {dashboard.recent_quizzes?.map((q: any) => (
                  <div key={q.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="font-medium">{q.title}</span>
                    <span className="text-sm text-gray-500">{q.play_count} plays</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "users" && (
        <Card>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 font-medium">Username</th>
                    <th className="text-left py-2 px-3 font-medium">Email</th>
                    <th className="text-left py-2 px-3 font-medium">Role</th>
                    <th className="text-center py-2 px-3 font-medium">Active</th>
                    <th className="text-right py-2 px-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 px-3 font-medium">{u.username}</td>
                      <td className="py-2 px-3 text-sm text-gray-500">{u.email}</td>
                      <td className="py-2 px-3">
                        <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} className="text-sm px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none">
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${u.is_active ? "bg-green-500" : "bg-red-500"}`} />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button onClick={() => toggleActive(u.id)} className={`p-2 rounded-lg ${u.is_active ? "text-red-500 hover:bg-red-50" : "text-green-500 hover:bg-green-50"}`} title={u.is_active ? "Deactivate" : "Activate"}>
                          <Ban className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "quizzes" && (
        <Card>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 font-medium">Title</th>
                    <th className="text-left py-2 px-3 font-medium">Creator</th>
                    <th className="text-center py-2 px-3 font-medium">Questions</th>
                    <th className="text-center py-2 px-3 font-medium">Plays</th>
                    <th className="text-center py-2 px-3 font-medium">Public</th>
                    <th className="text-right py-2 px-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map((q: any) => (
                    <tr key={q.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 px-3 font-medium">{q.title}</td>
                      <td className="py-2 px-3 text-sm text-gray-500">{q.creator}</td>
                      <td className="py-2 px-3 text-center">{q.question_count}</td>
                      <td className="py-2 px-3 text-center">{q.play_count}</td>
                      <td className="py-2 px-3 text-center">
                        {q.is_public ? <Badge variant="success">Yes</Badge> : <Badge variant="warning">No</Badge>}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button onClick={() => deleteQuiz(q.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
