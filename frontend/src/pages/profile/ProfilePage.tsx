import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usersAPI, gamesAPI } from "@/lib/api";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Trophy, Star, Award, Target, BookOpen, TrendingUp, Gamepad2, Shield } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, historyRes, achRes, badgeRes] = await Promise.all([
        usersAPI.getProfile(),
        gamesAPI.getHistory(),
        usersAPI.getAchievements(),
        usersAPI.getBadges(),
      ]);
      setProfile(profileRes.data);
      setDisplayName(profileRes.data.display_name || "");
      setBio(profileRes.data.bio || "");
      setHistory(historyRes.data);
      setAchievements(achRes.data);
      setBadges(badgeRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await usersAPI.updateProfile({ display_name: displayName, bio });
      setProfile(res.data);
      setEditing(false);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update");
    }
  };

  if (!profile) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6 text-center">
              <Avatar name={user?.username || ""} src={profile.avatar_url} size="xl" className="mx-auto mb-4" />
              <h2 className="text-2xl font-bold">{profile.display_name || user?.username}</h2>
              <p className="text-gray-500">@{user?.username}</p>
              <Badge variant="info" className="mt-2 capitalize">{user?.role || "student"}</Badge>
              
              <div className="mt-4 flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4 text-primary-500" />
                <span className="font-bold text-lg">Level {profile.level}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full" style={{ width: `${(profile.xp % 1000) / 10}%` }} />
              </div>
              <p className="text-sm text-gray-500 mt-1">{profile.xp} / {(profile.level * 1000)} XP</p>

              {editing ? (
                <div className="mt-4 space-y-3 text-left">
                  <Input label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                  <div>
                    <label className="block text-sm font-medium mb-1">Bio</label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none resize-none" rows={3} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveProfile}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" className="mt-4" onClick={() => setEditing(true)}>
                  Edit Profile
                </Button>
              )}

              {profile.bio && <p className="text-sm text-gray-500 mt-4">{profile.bio}</p>}
            </CardContent>
          </Card>

          {user?.role !== "administrator" && (
            <Card className="mt-4">
              <CardHeader><h3 className="font-semibold flex items-center gap-2"><Award className="w-4 h-4 text-yellow-500" /> Badges</h3></CardHeader>
              <CardContent>
                {badges.length === 0 ? (
                  <p className="text-sm text-gray-500">No badges yet. Keep playing!</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {badges.map((b: any) => (
                      <div key={b.id} className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center" title={b.description}>
                        <span className="text-2xl">{b.icon || "🏆"}</span>
                        <p className="text-xs mt-1">{b.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          {user?.role === "administrator" ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold">Admin Account</h3>
                <p className="text-gray-500 mt-2">You manage the platform. No game stats to track.</p>
                <Link to="/admin">
                  <Button className="mt-4">Go to Admin Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card><CardContent className="p-4 text-center">
                  <Gamepad2 className="w-5 h-5 text-primary-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{profile.games_played}</p>
                  <p className="text-xs text-gray-500">Games Played</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <Target className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{profile.accuracy}%</p>
                  <p className="text-xs text-gray-500">Accuracy</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{profile.highest_score}</p>
                  <p className="text-xs text-gray-500">Best Score</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <BookOpen className="w-5 h-5 text-secondary-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{profile.quizzes_created}</p>
                  <p className="text-xs text-gray-500">Created</p>
                </CardContent></Card>
              </div>

              <Card>
                <CardHeader><h3 className="font-semibold flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" /> Achievements</h3></CardHeader>
                <CardContent>
                  {achievements.length === 0 ? (
                    <p className="text-sm text-gray-500">No achievements unlocked yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {achievements.map((a: any) => (
                        <div key={a.id} className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                          <span className="text-2xl">{a.icon || "⭐"}</span>
                          <p className="font-semibold text-sm mt-1">{a.name}</p>
                          <p className="text-xs text-gray-500">{a.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader><h3 className="font-semibold">Game History</h3></CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <p className="text-sm text-gray-500">No games played yet. Join a game!</p>
                  ) : (
                    <div className="space-y-2">
                      {history.slice(0, 10).map((h: any) => (
                        <div key={h.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                          <div>
                            <p className="font-medium">{h.quiz_title}</p>
                            <p className="text-xs text-gray-500">{new Date(h.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{h.score} pts</p>
                            {h.rank && <p className="text-xs text-gray-500">#{h.rank}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
