import { Link } from "react-router-dom";
import { Brain, Github, Twitter, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-400 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-6 h-6 text-primary-500" />
              <span className="text-lg font-bold text-white">ThinkArena</span>
            </div>
            <p className="text-sm">Learn. Play. Compete. The ultimate AI-powered quiz platform.</p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Platform</h3>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/explore" className="hover:text-white transition-colors">Explore Quizzes</Link>
              <Link to="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
              <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            </div>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Company</h3>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
              <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
            </div>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Legal</h3>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
            <div className="flex gap-4 mt-4">
              <a href="#" className="hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><MessageCircle className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          &copy; {new Date().getFullYear()} ThinkArena. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
