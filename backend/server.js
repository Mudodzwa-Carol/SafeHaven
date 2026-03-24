import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import supabase from './config/supabase.js';
import authMiddleware from './middleware/auth.js';
import { chatLimiter, postLimiter, commentLimiter, generalLimiter } from './middleware/rateLimit.js';
import { moderateContent } from './utils/moderation.js';
import validate from './middleware/validate.js';
import { postSchema, commentSchema, chatSchema } from './validation/schemas.js';
import { detectCrisis, getCrisisResponse } from './utils/crisis.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const app = express();

app.use(cors());
app.use(express.json());
app.use(generalLimiter);

app.get('/', (req, res) => {
  res.send('Backend running');
});

// ================= POSTS =================

app.get('/api/posts', async (req, res) => {
  const { limit = 20, offset = 0, mood } = req.query;

  try {
    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (mood) {
      query = query.eq('mood', mood);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      posts: data,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= CREATE POST =================

app.post('/api/posts', authMiddleware, postLimiter, validate(postSchema), async (req, res) => {
  let { content, mood } = req.body;
content = moderateContent(content);

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

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= SUPPORT =================

app.post('/api/posts/:id/support', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const user_anonymous_id = req.user.anonymous_id;

  if (!user_anonymous_id) {
    return res.status(400).json({ error: 'Missing user_anonymous_id' });
  }

  try {
    const { data: existing } = await supabase
      .from('post_supports')
      .select('id')
      .eq('post_id', id)
      .eq('user_anonymous_id', user_anonymous_id)
      .single();

    if (existing) {
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

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= COMMENTS =================

app.get('/api/posts/:id/comments', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ comments: data });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/comments', authMiddleware, commentLimiter, validate(commentSchema), async (req, res) => {
  const { id } = req.params;
  let { content } = req.body;
  content = moderateContent(content);

  if (!content || content.length < 1 || content.length > 1000) {
    return res.status(400).json({ error: 'Invalid comment length' });
  }

  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([{ post_id: id, content }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ comment: data });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= CHAT =================

app.post('/api/chat', authMiddleware, chatLimiter, validate(chatSchema), async (req, res) => {
  const { message, session_id, conversation_history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    let sessionId = session_id;

    // Create session if needed
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

    // 🚨 Crisis detection BEFORE AI call
    if (detectCrisis(message)) {
  return res.json(getCrisisResponse());
}

    // Build Gemini prompt
    const prompt = `
You are a compassionate mental health support companion.

Guidelines:
- Be empathetic and supportive
- Keep responses short (2-4 sentences)
- Do NOT diagnose
- Encourage seeking help when needed

Conversation so far:
${conversation_history.map(m => `${m.role}: ${m.content}`).join('\n')}

User: ${message}
Assistant:
`;

    // Call Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    // Save AI response
    await supabase
      .from('chat_messages')
      .insert([{
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse
      }]);

    // Update session
    await supabase
      .from('chat_sessions')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', sessionId);

    res.json({
      response: aiResponse,
      session_id: sessionId
    });

  } catch (err) {
    console.error("Gemini error:", err.message || err);
    res.status(500).json({ error: err.message || 'Failed to generate response' });
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`Server running on port ${process.env.PORT || 3001}`);
});