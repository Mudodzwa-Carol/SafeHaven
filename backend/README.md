# Safehaven Backend Integration Guide

This guide provides comprehensive instructions for implementing a production-ready backend for the Safehaven mental health support platform.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [AI Integration](#ai-integration)
5. [Authentication & Security](#authentication--security)
6. [Environment Variables](#environment-variables)
7. [Deployment Guide](#deployment-guide)

---

## Architecture Overview

### Technology Stack Recommendations

**Database:**

- PostgreSQL (via Supabase recommended)
- Row Level Security (RLS) for data protection
- Real-time subscriptions for live updates

**Backend Options:**

1. **Supabase** (Recommended for fastest setup)
   - Built-in PostgreSQL database
   - Auto-generated REST API
   - Real-time subscriptions
   - Edge Functions for AI calls
   - Built-in authentication

2. **Node.js/Express** (Custom backend)
   - More control over business logic
   - Use with Supabase database or separate PostgreSQL

3. **Next.js API Routes** (Full-stack framework)
   - Serverless functions
   - Easy deployment on Vercel

**AI Service:**

- OpenAI GPT-4 (recommended for mental health conversations)
- Anthropic Claude (alternative, excellent for empathetic responses)
- Google Gemini (cost-effective option)

---

## Database Schema

### Tables

#### 1. `users` (Optional - if not using anonymous-only)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_users_anonymous_id ON users(anonymous_id);
```

#### 2. `posts`

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author TEXT DEFAULT 'Anonymous User',
  content TEXT NOT NULL,
  mood TEXT NOT NULL CHECK (mood IN ('Positive', 'Neutral', 'Negative')),
  support_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_mood ON posts(mood);

-- Validation
ALTER TABLE posts ADD CONSTRAINT content_length_check 
  CHECK (char_length(content) >= 1 AND char_length(content) <= 2000);
```

#### 3. `post_supports`

```sql
CREATE TABLE post_supports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_anonymous_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_anonymous_id)
);

-- Indexes
CREATE INDEX idx_post_supports_post_id ON post_supports(post_id);
CREATE INDEX idx_post_supports_user ON post_supports(user_anonymous_id);
```

#### 4. `comments`

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author TEXT DEFAULT 'Anonymous User',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Validation
ALTER TABLE comments ADD CONSTRAINT comment_content_length_check 
  CHECK (char_length(content) >= 1 AND char_length(content) <= 1000);
```

#### 5. `chat_sessions`

```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_anonymous_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_anonymous_id);
```

#### 6. `chat_messages`

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
```

### Database Functions & Triggers

#### Auto-update support count

```sql
-- Function to update support count
CREATE OR REPLACE FUNCTION update_post_support_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET support_count = support_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET support_count = GREATEST(support_count - 1, 0) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_update_post_support_count
AFTER INSERT OR DELETE ON post_supports
FOR EACH ROW EXECUTE FUNCTION update_post_support_count();
```

#### Auto-update comment count

```sql
-- Function to update comment count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET comment_count = comment_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET comment_count = GREATEST(comment_count - 1, 0) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_update_post_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();
```

#### Updated timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## API Endpoints

### Community Posts

#### GET /api/posts

Get all community posts (paginated)

**Query Parameters:**

- `limit` (optional, default: 20) - Number of posts per page
- `offset` (optional, default: 0) - Pagination offset
- `mood` (optional) - Filter by mood: Positive, Neutral, Negative

**Response:**

```json
{
  "posts": [
    {
      "id": "uuid",
      "author": "Anonymous User",
      "content": "Post content here...",
      "mood": "Positive",
      "support_count": 12,
      "comment_count": 3,
      "created_at": "2026-03-20T10:30:00Z"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

**Example Implementation (Express.js):**

```javascript
app.get('/api/posts', async (req, res) => {
  const { limit = 20, offset = 0, mood } = req.query;
  
  try {
    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (mood) {
      query = query.eq('mood', mood);
    }
    
    const { data, count, error } = await query;
    
    if (error) throw error;
    
    res.json({
      posts: data,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### POST /api/posts

Create a new post

**Request Body:**

```json
{
  "content": "Post content here...",
  "mood": "Positive"
}
```

**Response:**

```json
{
  "post": {
    "id": "uuid",
    "author": "Anonymous User",
    "content": "Post content here...",
    "mood": "Positive",
    "support_count": 0,
    "comment_count": 0,
    "created_at": "2026-03-20T10:30:00Z"
  }
}
```

**Example Implementation:**

```javascript
app.post('/api/posts', async (req, res) => {
  const { content, mood } = req.body;
  
  // Validation
  if (!content || content.length < 1 || content.length > 2000) {
    return res.status(400).json({ error: 'Invalid content length' });
  }
  
  if (!['Positive', 'Neutral', 'Negative'].includes(mood)) {
    return res.status(400).json({ error: 'Invalid mood' });
  }
  
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert([{ content, mood }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ post: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### POST /api/posts/:id/support

Toggle support on a post

**Request Body:**

```json
{
  "user_anonymous_id": "user_12345"
}
```

**Response:**

```json
{
  "action": "added",
  "support_count": 13
}
```

**Example Implementation:**

```javascript
app.post('/api/posts/:id/support', async (req, res) => {
  const { id } = req.params;
  const { user_anonymous_id } = req.body;
  
  if (!user_anonymous_id) {
    return res.status(400).json({ error: 'Missing user_anonymous_id' });
  }
  
  try {
    // Check if already supported
    const { data: existing } = await supabase
      .from('post_supports')
      .select('id')
      .eq('post_id', id)
      .eq('user_anonymous_id', user_anonymous_id)
      .single();
    
    if (existing) {
      // Remove support
      await supabase
        .from('post_supports')
        .delete()
        .eq('id', existing.id);
      
      const { data: post } = await supabase
        .from('posts')
        .select('support_count')
        .eq('id', id)
        .single();
      
      return res.json({
        action: 'removed',
        support_count: post.support_count
      });
    } else {
      // Add support
      await supabase
        .from('post_supports')
        .insert([{ post_id: id, user_anonymous_id }]);
      
      const { data: post } = await supabase
        .from('posts')
        .select('support_count')
        .eq('id', id)
        .single();
      
      return res.json({
        action: 'added',
        support_count: post.support_count
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### GET /api/posts/:id/comments

Get comments for a post

**Response:**

```json
{
  "comments": [
    {
      "id": "uuid",
      "post_id": "uuid",
      "author": "Anonymous User",
      "content": "Comment content...",
      "created_at": "2026-03-20T10:30:00Z"
    }
  ]
}
```

#### POST /api/posts/:id/comments

Add a comment to a post

**Request Body:**

```json
{
  "content": "Comment content..."
}
```

---

### AI Chat

#### POST /api/chat

Send a message and get AI response

**Request Body:**

```json
{
  "message": "I'm feeling anxious today",
  "session_id": "uuid",
  "conversation_history": [
    {
      "role": "user",
      "content": "Previous message..."
    },
    {
      "role": "assistant",
      "content": "Previous response..."
    }
  ]
}
```

**Response:**

```json
{
  "response": "I hear that you're experiencing anxiety...",
  "session_id": "uuid"
}
```

**Example Implementation (OpenAI):**

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/api/chat', async (req, res) => {
  const { message, session_id, conversation_history = [] } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    // Create or get session
    let sessionId = session_id;
    if (!sessionId) {
      const { data } = await supabase
        .from('chat_sessions')
        .insert([{ user_anonymous_id: req.user.anonymous_id }])
        .select()
        .single();
      sessionId = data.id;
    }
    
    // Save user message
    await supabase
      .from('chat_messages')
      .insert([{
        session_id: sessionId,
        role: 'user',
        content: message
      }]);
    
    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: `You are a compassionate mental health support companion. Your role is to:
- Listen empathetically and validate feelings
- Ask thoughtful questions to understand better
- Provide gentle support and coping strategies
- Never provide medical diagnoses or prescribe treatment
- Encourage professional help when appropriate
- Be warm, non-judgmental, and supportive
- Remember you are NOT a replacement for professional mental health care

Guidelines:
- Keep responses concise but meaningful (2-4 sentences)
- Ask open-ended questions
- Acknowledge emotions before offering suggestions
- Use trauma-informed language
- If someone mentions self-harm or suicide, encourage them to contact emergency services or crisis hotlines`
      },
      ...conversation_history,
      { role: 'user', content: message }
    ];
    
    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      temperature: 0.7,
      max_tokens: 250
    });
    
    const aiResponse = completion.choices[0].message.content;
    
    // Save AI response
    await supabase
      .from('chat_messages')
      .insert([{
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse
      }]);
    
    // Update session last_message_at
    await supabase
      .from('chat_sessions')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', sessionId);
    
    res.json({
      response: aiResponse,
      session_id: sessionId
    });
    
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});
```

**Example Implementation (Anthropic Claude):**

```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

app.post('/api/chat', async (req, res) => {
  const { message, session_id, conversation_history = [] } = req.body;
  
  try {
    const completion = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 250,
      system: `You are a compassionate mental health support companion...`,
      messages: [
        ...conversation_history,
        { role: 'user', content: message }
      ]
    });
    
    const aiResponse = completion.content[0].text;
    
    // Save to database (same as OpenAI example)
    
    res.json({
      response: aiResponse,
      session_id: sessionId
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});
```

---

## AI Integration

### Crisis Detection

Implement crisis detection to identify urgent situations:

```javascript
function detectCrisis(message) {
  const crisisKeywords = [
    'suicide', 'kill myself', 'end my life', 'want to die',
    'self harm', 'cutting', 'hurt myself', 'overdose'
  ];
  
  const lowerMessage = message.toLowerCase();
  return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
}

// In your chat endpoint
if (detectCrisis(message)) {
  // Return immediate crisis resources
  return res.json({
    response: `I'm really concerned about what you're sharing. Your safety is the top priority. Please reach out to one of these resources immediately:

• National Suicide Prevention Lifeline: 988 (US)
• Crisis Text Line: Text HOME to 741741
• International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

If you're in immediate danger, please call emergency services (911 in the US) or go to the nearest emergency room. I'm here to support you, but I'm not equipped to handle crisis situations.`,
    session_id: sessionId,
    crisis_detected: true
  });
}
```

### Rate Limiting

Implement rate limiting to prevent abuse:

```javascript
import rateLimit from 'express-rate-limit';

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: 'Too many requests, please try again later.'
});

app.post('/api/chat', chatLimiter, async (req, res) => {
  // Your chat logic
});

const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 posts per hour
  message: 'Too many posts, please try again later.'
});

app.post('/api/posts', postLimiter, async (req, res) => {
  // Your post logic
});
```

---

## Authentication & Security

### Anonymous User Tracking

Generate persistent anonymous IDs on the frontend:

```typescript
// Frontend code (already implemented in /src/app/services/storage.ts)
export const getUserId = (): string => {
  let userId = localStorage.getItem('safehaven_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('safehaven_user_id', userId);
  }
  return userId;
};
```

Send this ID with all API requests:

```typescript
// Frontend API client
const userId = getUserId();

fetch('/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Anonymous-User-ID': userId
  },
  body: JSON.stringify({ content, mood })
});
```

### Content Moderation

Implement basic content filtering:

```javascript
function moderateContent(content) {
  const prohibitedPatterns = [
    /\b\d{3}-\d{3}-\d{4}\b/g, // Phone numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails
    /\b(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/\S*)?\b/g // URLs
  ];
  
  let cleanContent = content;
  prohibitedPatterns.forEach(pattern => {
    cleanContent = cleanContent.replace(pattern, '[REDACTED]');
  });
  
  return cleanContent;
}

// Use in post creation
app.post('/api/posts', async (req, res) => {
  const { content, mood } = req.body;
  const moderatedContent = moderateContent(content);
  
  // Continue with post creation using moderatedContent
});
```

### CORS Configuration

```javascript
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### Input Validation

```javascript
import { z } from 'zod';

const createPostSchema = z.object({
  content: z.string().min(1).max(2000),
  mood: z.enum(['Positive', 'Neutral', 'Negative'])
});

app.post('/api/posts', async (req, res) => {
  try {
    const validated = createPostSchema.parse(req.body);
    // Continue with validated data
  } catch (error) {
    return res.status(400).json({ error: 'Invalid input' });
  }
});
```

---

## Environment Variables

Create a `.env` file:

```env
# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Service (choose one)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend.com

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=30
```

---

## Deployment Guide

### Option 1: Supabase + Vercel (Recommended)

**Database (Supabase):**

1. Create account at <https://supabase.com>
2. Create new project
3. Run SQL migrations from Database Schema section
4. Copy project URL and anon key

**Backend (Vercel Serverless Functions):**

1. Create `api/` folder in your project
2. Add API route files (e.g., `api/posts.ts`)
3. Deploy to Vercel:

```bash
npm install -g vercel
vercel
```

**Example Vercel API Route** (`api/posts.ts`):

```typescript
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ posts: data });
  }
  
  if (req.method === 'POST') {
    const { content, mood } = req.body;
    const { data, error } = await supabase
      .from('posts')
      .insert([{ content, mood }])
      .select()
      .single();
    
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ post: data });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
```

### Option 2: Node.js/Express + Railway

1. Create Express server
2. Deploy to Railway:

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Option 3: Supabase Edge Functions

Deploy AI chat as Edge Function:

```bash
npx supabase functions new chat
```

`supabase/functions/chat/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { message, session_id } = await req.json();
  
  // Your AI logic here
  
  return new Response(
    JSON.stringify({ response: aiResponse }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

Deploy:

```bash
npx supabase functions deploy chat
```

---

## Frontend Integration

Update your frontend to use the API:

### Update Storage Service

Replace `/src/app/services/storage.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const getPosts = async (): Promise<Post[]> => {
  const response = await fetch(`${API_URL}/api/posts`);
  const data = await response.json();
  return data.posts;
};

export const createPost = async (
  content: string,
  mood: Post['mood']
): Promise<Post> => {
  const userId = getUserId();
  const response = await fetch(`${API_URL}/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Anonymous-User-ID': userId
    },
    body: JSON.stringify({ content, mood })
  });
  const data = await response.json();
  return data.post;
};
```

### Update AI Service

Replace `/src/app/services/ai.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const generateAIResponse = async (
  userMessage: string,
  conversationHistory: ChatMessage[]
): Promise<string> => {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: userMessage,
      conversation_history: conversationHistory.map(m => ({
        role: m.role,
        content: m.content
      }))
    })
  });
  
  const data = await response.json();
  return data.response;
};
```

---

## Monitoring & Analytics

### Error Tracking

Use Sentry for error monitoring:

```javascript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.errorHandler());
```

### Analytics

Track usage patterns:

- Number of posts per day
- AI chat sessions
- Support interactions
- Peak usage times

```javascript
// Simple analytics tracking
async function trackEvent(event_type, metadata) {
  await supabase.from('analytics_events').insert([{
    event_type,
    metadata,
    created_at: new Date().toISOString()
  }]);
}
```

---

## Best Practices

1. **Never store PII** - Keep the platform truly anonymous
2. **Implement rate limiting** - Prevent abuse
3. **Content moderation** - Filter harmful content
4. **Crisis detection** - Identify and respond to emergencies
5. **Secure API keys** - Never expose in frontend code
6. **Regular backups** - Protect user data
7. **Monitor costs** - Track AI API usage
8. **Legal compliance** - Add terms of service and privacy policy
9. **Accessibility** - Ensure platform is accessible to all users
10. **Testing** - Thoroughly test AI responses for safety

---

## Support Resources

Add these resources to your platform:

```javascript
const crisisResources = {
  US: {
    'Suicide Prevention Lifeline': '988',
    'Crisis Text Line': 'Text HOME to 741741',
    'SAMHSA Helpline': '1-800-662-4357'
  },
  International: {
    'International Association for Suicide Prevention': 'https://www.iasp.info/resources/Crisis_Centres/'
  }
};
```

---

## Next Steps

1. Set up Supabase project
2. Run database migrations
3. Configure environment variables
4. Implement API endpoints
5. Integrate AI service
6. Test thoroughly
7. Deploy to production
8. Monitor and iterate

For questions or issues, refer to:

- Supabase Documentation: <https://supabase.com/docs>
- OpenAI API Reference: <https://platform.openai.com/docs>
- Anthropic Claude API: <https://docs.anthropic.com/>
