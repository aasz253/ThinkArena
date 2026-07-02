import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import Button from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Brain, Moon, Sun, LogOut, User, Menu, X, Trophy, Grid3X3 } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-primary-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              ThinkArena
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/explore" className="text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors font-medium">
              Explore
            </Link>
            <Link to="/leaderboard" className="text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors font-medium">
              <Trophy className="w-4 h-4 inline mr-1" />
              Leaderboard
            </Link>
            {user?.role === "teacher" && (
              <Link to="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors font-medium">
                <Grid3X3 className="w-4 h-4 inline mr-1" />
                Dashboard
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/profile">
                  <Avatar name={user.username} src={user.profile?.avatar_url} size="sm" />
                </Link>
                <button onClick={logout} className="hidden md:block">
                  <LogOut className="w-5 h-5 text-gray-500 hover:text-red-500 transition-colors" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                  Log In
                </Button>
                <Button size="sm" onClick={() => navigate("/register")}>
                  Sign Up Free
                </Button>
              </div>
            )}

            <button
              className="md:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex flex-col gap-3">
            <Link to="/explore" className="text-gray-600 dark:text-gray-300 font-medium" onClick={() => setMobileOpen(false)}>
              Explore
            </Link>
            <Link to="/leaderboard" className="text-gray-600 dark:text-gray-300 font-medium" onClick={() => setMobileOpen(false)}>
              Leaderboard
            </Link>
            {user ? (
              <>
                <Link to="/profile" className="text-gray-600 dark:text-gray-300 font-medium" onClick={() => setMobileOpen(false)}>
                  Profile
                </Link>
                {user.role === "teacher" && (
                  <Link to="/dashboard" className="text-gray-600 dark:text-gray-300 font-medium" onClick={() => setMobileOpen(false)}>
                    Dashboard
                  </Link>
                )}
                <button onClick={() => { logout(); setMobileOpen(false); }} className="text-left text-red-500 font-medium">
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full">Log In</Button></Link>
                <Link to="/register" onClick={() => setMobileOpen(false)}><Button className="w-full">Sign Up Free</Button></Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
