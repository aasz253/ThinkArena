import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gamesAPI, quizzesAPI } from "@/lib/api";
import { useHostWebSocket } from "@/hooks/useWebSocket";
import Button from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Copy, Play, SkipForward, Users, Trophy, Crown, Timer } from "lucide-react";
import toast from "react-hot-toast";

export default function HostGamePage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [gameStatus, setGameStatus] = useState<string>("waiting");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [countdown, setCountdown] = useState<number>(0);

  const ws = useHostWebSocket(game?.id || null);

  useEffect(() => {
    if (!quizId) return;
    quizzesAPI.get(quizId).then((res) => {
      setQuiz(res.data);
      return gamesAPI.create({ quiz_id: quizId });
    }).then((res) => {
      setGame(res.data);
    }).catch((err) => {
      toast.error("Failed to create game");
      navigate("/dashboard");
    });
  }, [quizId]);

  useEffect(() => {
    if (!ws) return;
    ws.on("player_count", (data: any) => {
      setPlayerCount(data.count);
      setPlayers(data.players || []);
    });
    ws.on("game_started", () => setGameStatus("live"));
    ws.on("question", (data: any) => {
      setCurrentQuestion(data.question);
      setQuestionIndex(data.question_index);
      setCountdown(data.question.time_limit || 20);
    });
    ws.on("leaderboard_update", (data: any) => {
      setLeaderboard(data.leaderboard);
    });
    ws.on("game_finished", () => setGameStatus("finished"));
    ws.on("final_results", (data: any) => setResults(data.results));
  }, [ws]);

  useEffect(() => {
    if (countdown <= 0 || gameStatus !== "live") return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown, gameStatus]);

  const handleStart = () => {
    ws.send({ action: "start_game" });
  };

  const handleNext = () => {
    ws.send({ action: "next_question" });
  };

  const handleShowResults = () => {
    ws.send({ action: "show_results" });
  };

  const copyPin = () => {
    if (game?.pin) {
      navigator.clipboard.writeText(game.pin);
      toast.success("PIN copied!");
    }
  };

  if (!game) return <div className="flex items-center justify-center min-h-screen"><div className="text-xl">Setting up game...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {gameStatus === "waiting" && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Waiting for players
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{quiz?.title || "Quiz"}</h1>
            
            <div className="inline-block p-8 rounded-3xl bg-white/10 backdrop-blur-lg mb-8">
              <p className="text-sm text-gray-400 mb-2">Game PIN</p>
              <p className="text-6xl md:text-8xl font-bold tracking-[0.2em] text-primary-400">{game.pin}</p>
              <button onClick={copyPin} className="mt-4 text-sm text-gray-400 hover:text-white flex items-center justify-center gap-1 mx-auto">
                <Copy className="w-4 h-4" /> Copy PIN
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 mb-8">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="text-xl">{playerCount} players joined</span>
            </div>

            {players.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 mb-8 max-w-md mx-auto">
                {players.map((name, i) => (
                  <div key={i} className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm flex items-center gap-2">
                    <Avatar name={name} size="sm" />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            )}

            <Button size="lg" onClick={handleStart} disabled={playerCount === 0} className="text-lg px-12">
              <Play className="w-5 h-5 mr-2" /> Start Game
            </Button>
          </div>
        )}

        {gameStatus === "live" && currentQuestion && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-gray-400">Question {questionIndex + 1} of {game.total_questions}</span>
                <h2 className="text-2xl font-bold mt-1">{currentQuestion.question_text}</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xl font-bold">
                  <Timer className="w-5 h-5 text-yellow-400" />
                  {countdown}s
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {currentQuestion.choices?.map((c: any, i: number) => (
                <div key={c.id}
                  className="p-6 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/10 text-center text-lg font-medium"
                >
                  {c.choice_text}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-4 h-4" />
                {leaderboard.length} answered
              </div>
              <Button onClick={handleNext} variant="secondary">
                <SkipForward className="w-4 h-4 mr-2" /> Next Question
              </Button>
            </div>

            {leaderboard.length > 0 && (
              <Card className="mt-6 bg-white/10 backdrop-blur-lg border-white/10">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" /> Live Leaderboard
                  </h3>
                  <div className="space-y-2">
                    {leaderboard.slice(0, 5).map((p: any, i: number) => (
                      <div key={p.player_id} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center font-bold text-gray-400">#{i + 1}</span>
                          <Avatar name={p.nickname} size="sm" />
                          <span>{p.nickname}</span>
                        </div>
                        <span className="font-bold">{p.score} pts</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {gameStatus === "finished" && (
          <div className="text-center py-12">
            <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2">Game Over!</h1>
            <p className="text-gray-400 mb-8">{quiz?.title}</p>

            {results.map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 mb-2 rounded-xl bg-white/10 backdrop-blur-lg max-w-md mx-auto">
                <div className="flex items-center gap-4">
                  <span className={`text-2xl font-bold ${i === 0 ? "text-yellow-400" : "text-gray-400"}`}>#{r.rank}</span>
                  <Avatar name={r.nickname} size="sm" />
                  <span className="font-medium">{r.nickname}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold">{r.score} pts</p>
                  <p className="text-sm text-gray-400">{r.correct_count}/{r.total} correct</p>
                </div>
              </div>
            ))}

            <div className="mt-8 flex gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
              <Button onClick={() => navigate(`/host/${quizId}`)}>
                <Play className="w-4 h-4 mr-2" /> Play Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
