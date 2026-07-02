import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { gamesAPI } from "@/lib/api";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Brain, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function JoinGamePage() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length !== 6) { toast.error("Enter a 6-digit PIN"); return; }
    if (!nickname.trim()) { toast.error("Enter a nickname"); return; }
    setLoading(true);
    try {
      const res = await gamesAPI.join({ game_pin: pin, nickname: nickname.trim() });
      navigate(`/play/${res.data.game_id}/${res.data.player_id}`, {
        state: { nickname: res.data.nickname },
      });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to join game");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-primary-500/5 via-secondary-500/5 to-accent-500/5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Brain className="w-16 h-16 text-primary-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold">Join Game</h1>
          <p className="text-gray-500 mt-2">Enter the PIN shared by the host</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
              Game PIN
            </label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full text-center text-4xl md:text-5xl font-bold tracking-[0.3em] px-6 py-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary-500 outline-none"
              maxLength={6}
              inputMode="numeric"
              autoFocus
            />
          </div>

          <Input
            label="Your Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Enter your display name"
            maxLength={20}
          />

          <Button type="submit" loading={loading} className="w-full text-lg py-4">
            Join <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Want to host your own game?{" "}
            <button onClick={() => navigate("/register")} className="text-primary-500 hover:underline font-medium">
              Sign up as teacher
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
