import { Outlet, Link, useLocation } from "react-router";
import { Users, MessageCircle, Shield, Lock, AlertCircle } from "lucide-react";

export function Layout() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 overflow-x-hidden">
      <nav className="w-full bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl sm:text-2xl font-semibold text-purple-900">Safehaven</h1>
              <p className="text-xs sm:text-sm text-purple-700">Your Mental Health Companion</p>
            </div>
            <div className="flex gap-1 sm:gap-2">
              <Link
                to="/"
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-colors ${
                  isActive("/")
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                    : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                }`}
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline text-sm">Community</span>
              </Link>
              <Link
                to="/chat"
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-colors ${
                  isActive("/chat")
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                    : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                }`}
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline text-sm">AI Chat</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm text-purple-800">
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
              <span>Anonymous</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
              <span>No personal data stored</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
              <span>Not medical advice</span>
            </div>
          </div>
        </div>

        <Outlet />
      </div>
    </div>
  );
}