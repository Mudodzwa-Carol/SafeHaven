// Storage service for community posts
// This simulates backend storage using localStorage
// Replace with actual API calls when backend is ready

export interface Post {
  id: string;
  author: string;
  content: string;
  mood: "Positive" | "Neutral" | "Negative";
  timestamp: string;
  supportCount: number;
  commentCount: number;
  supportedBy: string[]; // Track which users supported this post
  createdAt: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  content: string;
  timestamp: string;
  createdAt: number;
}

const POSTS_KEY = "safehaven_posts";
const COMMENTS_KEY = "safehaven_comments";
const USER_ID_KEY = "safehaven_user_id";

// Generate a persistent anonymous user ID
export const getUserId = (): string => {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

// Get all posts from storage
export const getPosts = (): Post[] => {
  try {
    const postsJson = localStorage.getItem(POSTS_KEY);
    if (!postsJson) return [];
    const posts = JSON.parse(postsJson);
    return posts.sort((a: Post, b: Post) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error loading posts:", error);
    return [];
  }
};

// Save a new post
// Backend equivalent: POST /api/posts
export const createPost = (content: string, mood: Post["mood"]): Post => {
  const posts = getPosts();
  const newPost: Post = {
    id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    author: "Anonymous User",
    content,
    mood,
    timestamp: new Date().toLocaleString(),
    supportCount: 0,
    commentCount: 0,
    supportedBy: [],
    createdAt: Date.now(),
  };
  
  posts.unshift(newPost);
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  
  // In a real backend, this would trigger a database insert and return the created post
  return newPost;
};

// Toggle support on a post
// Backend equivalent: POST /api/posts/:id/support
export const toggleSupport = (postId: string): Post | null => {
  const posts = getPosts();
  const userId = getUserId();
  const postIndex = posts.findIndex(p => p.id === postId);
  
  if (postIndex === -1) return null;
  
  const post = posts[postIndex];
  const hasSupported = post.supportedBy.includes(userId);
  
  if (hasSupported) {
    post.supportedBy = post.supportedBy.filter(id => id !== userId);
    post.supportCount = Math.max(0, post.supportCount - 1);
  } else {
    post.supportedBy.push(userId);
    post.supportCount += 1;
  }
  
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  return post;
};

// Get comments for a post
export const getComments = (postId: string): Comment[] => {
  try {
    const commentsJson = localStorage.getItem(COMMENTS_KEY);
    if (!commentsJson) return [];
    const allComments: Comment[] = JSON.parse(commentsJson);
    return allComments
      .filter(c => c.postId === postId)
      .sort((a, b) => a.createdAt - b.createdAt);
  } catch (error) {
    console.error("Error loading comments:", error);
    return [];
  }
};

// Add a comment to a post
// Backend equivalent: POST /api/posts/:id/comments
export const addComment = (postId: string, content: string): Comment => {
  const posts = getPosts();
  const comments = getAllComments();
  
  const newComment: Comment = {
    id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    postId,
    author: "Anonymous User",
    content,
    timestamp: new Date().toLocaleString(),
    createdAt: Date.now(),
  };
  
  comments.push(newComment);
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  
  // Update comment count on the post
  const postIndex = posts.findIndex(p => p.id === postId);
  if (postIndex !== -1) {
    posts[postIndex].commentCount += 1;
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  }
  
  return newComment;
};

// Get all comments (helper function)
const getAllComments = (): Comment[] => {
  try {
    const commentsJson = localStorage.getItem(COMMENTS_KEY);
    return commentsJson ? JSON.parse(commentsJson) : [];
  } catch (error) {
    console.error("Error loading comments:", error);
    return [];
  }
};

// Initialize with some sample posts if empty
export const initializeSampleData = () => {
  const posts = getPosts();
  if (posts.length === 0) {
    const samplePosts: Post[] = [
      {
        id: "sample_1",
        author: "Anonymous User",
        content: "Today was really challenging. I'm trying to stay positive and take things one step at a time.",
        mood: "Neutral",
        timestamp: new Date(Date.now() - 3600000).toLocaleString(),
        supportCount: 12,
        commentCount: 3,
        supportedBy: [],
        createdAt: Date.now() - 3600000,
      },
      {
        id: "sample_2",
        author: "Anonymous User",
        content: "Just wanted to share that I've been practicing mindfulness for a week now and it's really helping with my anxiety.",
        mood: "Positive",
        timestamp: new Date(Date.now() - 7200000).toLocaleString(),
        supportCount: 24,
        commentCount: 5,
        supportedBy: [],
        createdAt: Date.now() - 7200000,
      },
      {
        id: "sample_3",
        author: "Anonymous User",
        content: "Feeling overwhelmed by everything. Sometimes it feels like too much to handle.",
        mood: "Negative",
        timestamp: new Date(Date.now() - 10800000).toLocaleString(),
        supportCount: 18,
        commentCount: 7,
        supportedBy: [],
        createdAt: Date.now() - 10800000,
      },
    ];
    
    localStorage.setItem(POSTS_KEY, JSON.stringify(samplePosts));
  }
};
