import { useState, useEffect } from "react";
import { Smile, Meh, Frown, Heart, MessageSquare, Send } from "lucide-react";
import { getPosts, createPost, toggleSupport, initializeSampleData, Post } from "../services/storage";

export function CommunityFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [selectedMood, setSelectedMood] = useState<"Positive" | "Neutral" | "Negative">("Neutral");

  // Load posts from storage on mount
  useEffect(() => {
    initializeSampleData();
    loadPosts();
  }, []);

  const loadPosts = () => {
    const loadedPosts = getPosts();
    setPosts(loadedPosts);
  };

  const handleCreatePost = () => {
    if (newPost.trim()) {
      // Backend equivalent: POST /api/posts
      const post = createPost(newPost, selectedMood);
      setPosts([post, ...posts]);
      setNewPost("");
      setSelectedMood("Neutral");
    }
  };

  const handleSupport = (postId: string) => {
    // Backend equivalent: POST /api/posts/:id/support
    const updatedPost = toggleSupport(postId);
    if (updatedPost) {
      setPosts(posts.map(p => p.id === postId ? updatedPost : p));
    }
  };

  const getMoodIcon = (mood: "Positive" | "Neutral" | "Negative") => {
    switch (mood) {
      case "Positive":
        return <Smile className="w-5 h-5 text-emerald-600" />;
      case "Neutral":
        return <Meh className="w-5 h-5 text-amber-600" />;
      case "Negative":
        return <Frown className="w-5 h-5 text-rose-600" />;
    }
  };

  const getMoodColor = (mood: "Positive" | "Neutral" | "Negative") => {
    switch (mood) {
      case "Positive":
        return "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200";
      case "Neutral":
        return "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200";
      case "Negative":
        return "bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200";
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full overflow-x-hidden">
      <div className="bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl p-4 sm:p-6 shadow-md">
        <h2 className="text-base sm:text-lg font-semibold text-purple-900 mb-3 sm:mb-4">Share How You're Feeling</h2>
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedMood("Positive")}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl border-2 transition-all text-sm ${
                selectedMood === "Positive"
                  ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm"
                  : "border-purple-200 hover:border-emerald-300 bg-white"
              }`}
            >
              <Smile className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm">Positive</span>
            </button>
            <button
              onClick={() => setSelectedMood("Neutral")}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl border-2 transition-all text-sm ${
                selectedMood === "Neutral"
                  ? "border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm"
                  : "border-purple-200 hover:border-amber-300 bg-white"
              }`}
            >
              <Meh className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm">Neutral</span>
            </button>
            <button
              onClick={() => setSelectedMood("Negative")}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl border-2 transition-all text-sm ${
                selectedMood === "Negative"
                  ? "border-rose-400 bg-gradient-to-br from-rose-50 to-pink-50 shadow-sm"
                  : "border-purple-200 hover:border-rose-300 bg-white"
              }`}
            >
              <Frown className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm">Struggling</span>
            </button>
          </div>

          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share your thoughts with the community..."
            className="w-full min-h-[120px] p-3 sm:p-4 border border-purple-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white text-sm sm:text-base"
          />

          <button
            onClick={handleCreatePost}
            disabled={!newPost.trim()}
            className="self-end flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 sm:px-6 py-2 rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-sm"
          >
            <Send className="w-4 h-4" />
            Post
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:gap-4">
        <h2 className="text-base sm:text-lg font-semibold text-purple-900">Community Posts</h2>
        {posts.map((post) => (
          <div
            key={post.id}
            className={`border rounded-xl p-4 sm:p-6 shadow-md backdrop-blur-sm ${getMoodColor(post.mood)}`}
          >
            <div className="flex items-start gap-2 sm:gap-3 mb-3">
              {getMoodIcon(post.mood)}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-medium text-gray-900 text-sm sm:text-base">{post.author}</span>
                <span className="text-xs sm:text-sm text-gray-600">{post.timestamp}</span>
              </div>
            </div>
            <p className="text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base break-words">{post.content}</p>
            <div className="flex items-center gap-3 sm:gap-4 pt-3 border-t border-white/50 flex-wrap">
              <button
                onClick={() => handleSupport(post.id)}
                className="flex items-center gap-1 sm:gap-2 text-gray-700 hover:text-rose-600 transition-colors"
              >
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm whitespace-nowrap">{post.supportCount} Support</span>
              </button>
              <button className="flex items-center gap-1 sm:gap-2 text-gray-700 hover:text-purple-600 transition-colors">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm whitespace-nowrap">{post.commentCount} Comments</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}