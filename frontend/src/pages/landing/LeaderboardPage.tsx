import { useState, useEffect } from "react";
import { usersAPI } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Target, TrendingUp } from "lucide-react";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersAPI.getLeaderboard(100)
      .then((res) => setLeaderboard(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold">Global Leaderboard</h1>
        <p className="text-gray-500">Top players ranked by XP</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="animate-pulse h-16 rounded-xl bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, i) => (
            <Card key={entry.user_id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 text-center">
                    {i === 0 ? <Trophy className="w-6 h-6 text-yellow-500 mx-auto" />
                      : i === 1 ? <Medal className="w-5 h-5 text-gray-400 mx-auto" />
                      : i === 2 ? <Medal className="w-5 h-5 text-orange-500 mx-auto" />
                      : <span className="font-bold text-gray-400">#{i + 1}</span>}
                  </div>
                  <Avatar name={entry.display_name || entry.username} src={entry.avatar_url} />
                  <div>
                    <p className="font-semibold">{entry.display_name || entry.username}</p>
                    <p className="text-sm text-gray-500">@{entry.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-bold text-primary-500">{entry.xp.toLocaleString()} XP</p>
                    <p className="text-xs text-gray-500">Level {entry.level}</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Target className="w-3 h-3" />
                      {entry.accuracy}%
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <TrendingUp className="w-3 h-3" />
                      {entry.games_played} games
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
