import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Button from "@/components/ui/button";
import { Brain, Zap, Users, Trophy, Sparkles, Shield, BarChart3, Globe } from "lucide-react";

const features = [
  { icon: Zap, title: "Real-Time Games", desc: "Host live quiz games with WebSocket-powered real-time responses" },
  { icon: Sparkles, title: "AI-Powered", desc: "Generate quizzes, questions, and explanations with Gemini AI" },
  { icon: Users, title: "Multiplayer", desc: "Play with friends, classmates, or colleagues in real-time" },
  { icon: Trophy, title: "Competitive Scoring", desc: "Time bonuses, streak rewards, and combo multipliers" },
  { icon: Shield, title: "Secure & Safe", desc: "Enterprise-grade security with JWT, rate limiting, and XSS protection" },
  { icon: BarChart3, title: "Deep Analytics", desc: "Track performance, view reports, and export data as CSV/PDF" },
  { icon: Globe, title: "Cross-Platform", desc: "Works on desktop, tablet, and mobile devices" },
  { icon: Brain, title: "Smart Learning", desc: "AI tutor and study assistant for personalized learning" },
];

const testimonials = [
  { name: "Sarah J.", role: "High School Teacher", text: "ThinkArena transformed my classroom. Students are more engaged than ever!" },
  { name: "Mark T.", role: "University Student", text: "The AI study assistant helped me prepare for finals. Got an A!" },
  { name: "Lisa R.", role: "Corporate Trainer", text: "Perfect for team building and training sessions. Highly recommend." },
];

const faqs = [
  { q: "Is ThinkArena free?", a: "Yes! ThinkArena offers a generous free tier with access to all core features." },
  { q: "Can I create my own quizzes?", a: "Teachers can create custom quizzes with multiple question types and AI assistance." },
  { q: "How does the live game work?", a: "Host starts a game, players join with a 6-digit PIN, and everyone plays in real-time." },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-secondary-500/5 to-accent-500/10 dark:from-primary-500/20 dark:via-secondary-500/10 dark:to-accent-500/20" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM0RjQ2RTUiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzem0wIDMwYzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzem0tMTggMEMxOS42NTcgNDggMjEgNDYuNjU3IDIxIDQ1cy0xLjM0My0zLTMtMy0zIDEuMzQzLTMgMyAxLjM0MyAzIDMgM3oiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-500 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Quiz Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
                Learn. Play.
              </span>
              <br />
              <span>Compete.</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
              Create, host, and play AI-powered quizzes in real-time. 
              Challenge friends, track your progress, and level up your knowledge.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/register")}>
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/join")}>
                Join with Passcode
              </Button>
              <Button size="lg" variant="ghost" onClick={() => navigate("/explore")}>
                Explore Quizzes
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {[
              { label: "Active Users", value: "10K+" },
              { label: "Quizzes Created", value: "50K+" },
              { label: "Games Played", value: "1M+" },
              { label: "Countries", value: "100+" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="text-2xl font-bold text-primary-500">{stat.value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need for
            <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent"> awesome learning</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Loved by
            <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent"> thousands</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                <p className="text-gray-600 dark:text-gray-300 mb-4 italic">"{t.text}"</p>
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group">
                <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-primary-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-gray-600 dark:text-gray-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of learners and educators on ThinkArena.
          </p>
          <Button size="lg" onClick={() => navigate("/register")}>
            Create Free Account
          </Button>
        </div>
      </section>
    </div>
  );
}
