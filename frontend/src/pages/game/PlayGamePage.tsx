import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { usePlayerWebSocket } from "@/hooks/useWebSocket";
import { Timer, Zap, Trophy, Crown, Star } from "lucide-react";

const colorClasses = [
  "bg-red-500 hover:bg-red-600",
  "bg-blue-500 hover:bg-blue-600",
  "bg-yellow-500 hover:bg-yellow-600",
  "bg-green-500 hover:bg-green-600",
  "bg-purple-500 hover:bg-purple-600",
  "bg-pink-500 hover:bg-pink-600",
  "bg-indigo-500 hover:bg-indigo-600",
  "bg-orange-500 hover:bg-orange-600",
];

export default function PlayGamePage() {
  const { gameId, playerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const nickname = (location.state as any)?.nickname || "Player";
  const [gameStatus, setGameStatus] = useState("waiting");
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<any>(null);
  const [countdown, setCountdown] = useState(20);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [answered, setAnswered] = useState(false);
  const [paused, setPaused] = useState(false);

  const ws = usePlayerWebSocket(gameId || null, playerId || null);

  useEffect(() => {
    if (!ws) return;

    ws.on("game_started", (data: any) => {
      setGameStatus("live");
      setTotalQuestions(data.total_questions);
    });

    ws.on("question", (data: any) => {
      setCurrentQuestion(data.question);
      setQuestionIndex(data.question_index);
      setTotalQuestions(data.total_questions);
      setCountdown(data.question.time_limit || 20);
      setSelectedChoice(null);
      setAnswerResult(null);
      setAnswered(false);
    });

    ws.on("answer_result", (data: any) => {
      setAnswerResult(data);
      setScore(data.total_score);
      if (data.is_correct) {
        setStreak((s) => s + 1);
      } else {
        setStreak(0);
      }
    });

    ws.on("game_finished", () => {
      setGameStatus("finished");
    });

    ws.on("final_results", (data: any) => {
      setResults(data.results);
    });

    ws.on("kicked", (data: any) => {
      alert(data.message);
      navigate("/");
    });

    ws.on("paused", () => setPaused(true));
    ws.on("resumed", () => setPaused(false));
  }, [ws]);

  useEffect(() => {
    if (countdown <= 0 || answered || gameStatus !== "live" || paused) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown, answered, gameStatus, paused]);

  const handleAnswer = (choiceId: string) => {
    if (answered) return;
    setSelectedChoice(choiceId);
    setAnswered(true);
    ws.send({
      action: "submit_answer",
      question_id: currentQuestion.id,
      selected_choice_id: choiceId,
      time_taken: (currentQuestion.time_limit || 20) - countdown,
    });
  };

  if (gameStatus === "waiting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Waiting for game to start...</h2>
          <p className="text-gray-400 mt-2">You're in as {nickname}</p>
        </div>
      </div>
    );
  }

  if (gameStatus === "finished") {
    const myResult = results.find((r: any) => r.nickname === nickname);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <Crown className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Game Over!</h1>
          <p className="text-xl mb-2">Your Score: <span className="text-primary-400 font-bold">{score}</span></p>
          <p className="text-gray-400 mb-6">Nickname: {nickname}</p>
          
          <div className="space-y-2 mb-8">
            {results.map((r: any, i: number) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-xl backdrop-blur-lg ${r.nickname === nickname ? "bg-primary-500/20 border border-primary-500/50" : "bg-white/10"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">{r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}</span>
                  <span>{r.nickname} {r.nickname === nickname ? "(You)" : ""}</span>
                </div>
                <span className="font-bold">{r.score} pts</span>
              </div>
            ))}
          </div>

          <button onClick={() => navigate("/")} className="px-8 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-gray-400 text-sm">Question {questionIndex + 1} of {totalQuestions}</span>
            <div className="flex items-center gap-2 mt-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="font-bold">{score} pts</span>
              {streak > 1 && (
                <span className="text-sm text-orange-400 font-medium">
                  🔥 {streak}x streak!
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-yellow-400" />
            <span className="text-2xl font-bold">{countdown}</span>
          </div>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-2 mb-8">
          <div className="bg-primary-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${(countdown / (currentQuestion.time_limit || 20)) * 100}%` }} />
        </div>

        <h2 className="text-2xl font-bold mb-8">{currentQuestion.question_text}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentQuestion.choices?.map((c: any, i: number) => {
            let bgClass = colorClasses[i % colorClasses.length];
            if (answered && selectedChoice === c.id) {
              bgClass = answerResult?.is_correct ? "bg-green-500" : "bg-red-500";
            }
            return (
              <button
                key={c.id}
                onClick={() => handleAnswer(c.id)}
                disabled={answered}
                className={`${bgClass} p-6 rounded-2xl text-white font-semibold text-lg transition-all duration-200 ${
                  answered ? "opacity-80 cursor-not-allowed" : "hover:scale-[1.02] active:scale-95 shadow-lg"
                }`}
              >
                {c.choice_text}
              </button>
            );
          })}
        </div>

        {answerResult && (
          <div className={`mt-6 p-4 rounded-xl ${answerResult.is_correct ? "bg-green-500/20 border border-green-500/50" : "bg-red-500/20 border border-red-500/50"}`}>
            <p className="font-bold text-lg">
              {answerResult.is_correct ? "✅ Correct!" : "❌ Wrong!"}
            </p>
            <p className="text-sm text-gray-300">
              +{answerResult.points_earned} points {answerResult.streak_bonus > 0 && `(including ${answerResult.streak_bonus} streak bonus)`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
