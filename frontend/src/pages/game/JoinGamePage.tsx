import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gamesAPI } from "@/lib/api";
import Button from "@/components/ui/button";
import { Brain, ArrowRight, Key } from "lucide-react";
import toast from "react-hot-toast";

export default function JoinGamePage() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [nickname, setNickname] = useState("");
  const [step, setStep] = useState<"pin" | "nickname">("pin");
  const [loading, setLoading] = useState(false);
  const nickRef = useRef<HTMLInputElement>(null);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) { toast.error("Enter a valid 6-digit PIN"); return; }
    setStep("nickname");
    setTimeout(() => nickRef.current?.focus(), 100);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
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
          <p className="text-gray-500 mt-2">
            {step === "pin" ? "Enter the PIN shown on the host's screen" : "Choose your display name"}
          </p>
        </div>

        {step === "pin" ? (
          <form onSubmit={handlePinSubmit}>
            <input
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setPin(val);
                if (val.length === 6) {
                  setTimeout(() => setStep("nickname"), 200);
                  setTimeout(() => nickRef.current?.focus(), 300);
                }
              }}
              placeholder="Game PIN"
              className="w-full text-center text-5xl md:text-7xl font-bold tracking-[0.3em] px-6 py-8 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary-500 outline-none transition-all"
              maxLength={6}
              inputMode="numeric"
              autoFocus
            />
            <p className="text-center text-sm text-gray-400 mt-4">Enter the 6-digit PIN</p>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-500 font-mono text-lg tracking-widest mb-6">
                <Key className="w-4 h-4" />
                {pin}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                Choose a nickname
              </label>
              <input
                ref={nickRef}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your display name"
                maxLength={20}
                autoFocus
                className="w-full text-center text-xl px-6 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary-500 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("pin")}
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Back
              </button>
              <Button type="submit" loading={loading} className="flex-1 text-lg py-4">
                Join <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </form>
        )}

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
