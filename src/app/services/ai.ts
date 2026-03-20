// AI Service for mental health support conversations
// This simulates an AI backend - replace with actual AI API calls when ready

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  createdAt: number;
}

interface ConversationContext {
  recentTopics: string[];
  emotionalState: string;
  messageCount: number;
}

// Store conversation context to make responses more contextual
let conversationContext: ConversationContext = {
  recentTopics: [],
  emotionalState: "neutral",
  messageCount: 0,
};

// Detect emotional keywords in user messages
const detectEmotion = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  const emotionPatterns = {
    anxious: ["anxious", "anxiety", "worried", "nervous", "panic", "fear"],
    depressed: ["sad", "depressed", "hopeless", "worthless", "empty", "numb"],
    happy: ["happy", "good", "great", "wonderful", "amazing", "excited", "joy"],
    stressed: ["stressed", "overwhelmed", "pressure", "too much", "burden"],
    angry: ["angry", "frustrated", "mad", "irritated", "annoyed"],
    lonely: ["lonely", "alone", "isolated", "nobody", "left out"],
    grateful: ["thank", "grateful", "appreciate", "helped"],
  };
  
  for (const [emotion, keywords] of Object.entries(emotionPatterns)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return emotion;
    }
  }
  
  return "neutral";
};

// Extract topics from user message
const extractTopics = (message: string): string[] => {
  const lowerMessage = message.toLowerCase();
  const topics: string[] = [];
  
  const topicPatterns = {
    work: ["work", "job", "career", "boss", "colleague"],
    relationships: ["relationship", "partner", "boyfriend", "girlfriend", "spouse", "family"],
    sleep: ["sleep", "insomnia", "tired", "exhausted", "rest"],
    therapy: ["therapy", "therapist", "counseling", "medication"],
    exercise: ["exercise", "workout", "physical", "activity", "gym"],
    meditation: ["meditate", "meditation", "mindful", "breathing"],
  };
  
  for (const [topic, keywords] of Object.entries(topicPatterns)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      topics.push(topic);
    }
  }
  
  return topics;
};

// Generate contextual AI responses
// Backend equivalent: POST /api/chat with OpenAI/Anthropic API
export const generateAIResponse = async (userMessage: string): Promise<string> => {
  // Update conversation context
  conversationContext.messageCount += 1;
  const emotion = detectEmotion(userMessage);
  const topics = extractTopics(userMessage);
  
  if (emotion !== "neutral") {
    conversationContext.emotionalState = emotion;
  }
  
  conversationContext.recentTopics = [
    ...new Set([...topics, ...conversationContext.recentTopics])
  ].slice(0, 5);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate contextual response
  const response = generateContextualResponse(userMessage, emotion, topics);
  
  return response;
};

const generateContextualResponse = (
  message: string,
  emotion: string,
  topics: string[]
): string => {
  const lowerMessage = message.toLowerCase();
  
  // Contextual responses based on conversation history
  const isFollowUp = conversationContext.messageCount > 2;
  
  // Emotion-based responses
  switch (emotion) {
    case "anxious":
      return getAnxietyResponse(isFollowUp, topics);
    
    case "depressed":
      return getDepressionResponse(isFollowUp, topics);
    
    case "happy":
      return getPositiveResponse(isFollowUp, topics);
    
    case "stressed":
      return getStressResponse(isFollowUp, topics);
    
    case "angry":
      return "It sounds like you're feeling frustrated, and that's completely valid. Anger often signals that something important to you isn't being honored. Would you like to talk about what triggered these feelings? Sometimes expressing them can help process what's happening.";
    
    case "lonely":
      return "Loneliness can be one of the hardest feelings to sit with. I want you to know that reaching out here is a brave step. You're not as alone as you might feel right now. Have you considered connecting with the community feed? Sometimes just knowing others understand can help.";
    
    case "grateful":
      return "I'm glad I could be here for you. Remember, you're the one doing the hard work of opening up and being honest about your feelings. That takes real courage. I'm here anytime you need support.";
    
    default:
      return getDefaultResponse(lowerMessage, isFollowUp);
  }
};

const getAnxietyResponse = (isFollowUp: boolean, topics: string[]): string => {
  const responses = [
    "I hear that you're experiencing anxiety. Anxiety can feel overwhelming, but remember that what you're feeling is valid and temporary. Have you tried any grounding techniques? The 5-4-3-2-1 method can be helpful: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste.",
    "Anxiety often makes us feel like we need to have everything figured out right now. It's okay to take things one moment at a time. What's one small thing you could do right now to feel a bit more grounded?",
    "When anxiety strikes, our thoughts can spiral. Try to notice your thoughts without judging them. Remember, thoughts aren't facts. What specific worry is weighing most heavily on you right now?",
  ];
  
  if (topics.includes("work")) {
    return "Work-related anxiety is really common. Sometimes it helps to break overwhelming tasks into smaller, manageable steps. Is there a specific work situation that's triggering these anxious feelings?";
  }
  
  if (topics.includes("sleep")) {
    return "Anxiety and sleep difficulties often go hand in hand. When our minds are racing, it's hard to rest. Have you tried creating a calming bedtime routine? Things like limiting screen time, deep breathing, or gentle journaling can help signal to your body that it's time to wind down.";
  }
  
  return responses[isFollowUp ? 1 : 0];
};

const getDepressionResponse = (isFollowUp: boolean, topics: string[]): string => {
  const responses = [
    "I'm sorry you're feeling this way. Depression can make everything feel heavy and hopeless, but I want you to know that these feelings, while very real, don't define your worth. Have you been able to talk to anyone about how you're feeling, like a counselor or trusted friend?",
    "It takes strength to acknowledge these feelings and reach out. Even small steps count. What's one tiny thing that brought you even a moment of comfort recently?",
    "Depression often tells us lies - that we're worthless, that things won't get better, that we're a burden. Those aren't truths, even though they feel real. You deserve support and care. Are you currently connected with any mental health professionals?",
  ];
  
  if (topics.includes("therapy")) {
    return "I'm glad you're considering or already working with a therapist. Professional support can be really valuable. How is that going for you? Remember, it's okay if it takes time to find the right fit with a therapist.";
  }
  
  if (topics.includes("exercise")) {
    return "Physical activity can sometimes help with depression, even though it's often the last thing we feel like doing when we're struggling. Even a short walk can help. Be gentle with yourself - any movement counts.";
  }
  
  return responses[isFollowUp ? 1 : 0];
};

const getPositiveResponse = (isFollowUp: boolean, topics: string[]): string => {
  const responses = [
    "That's wonderful to hear! It's important to acknowledge and celebrate the positive moments. What brought about this feeling today?",
    "I love hearing this. Recognizing and savoring good feelings is an important practice. What would help you hold onto this feeling?",
    "This is great! Even small positive shifts matter. Keep noticing what helps you feel this way.",
  ];
  
  if (topics.includes("meditation") || topics.includes("exercise")) {
    return "It's amazing that you're seeing positive results from your self-care practices! Building these healthy habits takes real commitment. Keep going - you're doing great.";
  }
  
  return responses[isFollowUp ? 1 : 0];
};

const getStressResponse = (isFollowUp: boolean, topics: string[]): string => {
  const responses = [
    "Feeling overwhelmed and stressed is a sign that you're carrying a lot right now. It's important to remember that you don't have to handle everything at once. What feels most urgent or heavy for you right now?",
    "Stress often comes from feeling like there's too much to do and not enough resources to handle it. Sometimes just naming what's stressing us can help. Would it help to talk through what's on your plate?",
    "When we're stressed, our bodies go into fight-or-flight mode. Taking a few deep breaths can help signal to your nervous system that you're safe. What's one thing you could let go of or ask for help with?",
  ];
  
  if (topics.includes("work")) {
    return "Work stress can be particularly challenging because it often feels inescapable. Remember that your worth isn't determined by your productivity. Are there any boundaries you could set to protect your wellbeing?";
  }
  
  return responses[isFollowUp ? 1 : 0];
};

const getDefaultResponse = (message: string, isFollowUp: boolean): string => {
  if (message.includes("help") || message.includes("what should i do")) {
    return "I'm here to listen and support you, though I want to be clear that I'm an AI companion, not a replacement for professional mental health care. If you're in crisis, please reach out to a crisis helpline. Otherwise, tell me more about what you're experiencing - sometimes just talking through things can bring clarity.";
  }
  
  if (message.includes("?")) {
    return "That's a thoughtful question. I'm here to listen and offer support. What feels most important to you about this?";
  }
  
  const responses = [
    "Thank you for sharing that with me. Your feelings are valid and important. Would you like to tell me more about what's on your mind?",
    "I'm listening. It's okay to take your time - there's no rush. What else would you like to share?",
    "I hear you. How are you feeling about all of this?",
    "That sounds like a lot to carry. What kind of support would feel most helpful right now?",
  ];
  
  return responses[conversationContext.messageCount % responses.length];
};

// Reset conversation context (useful for new sessions)
export const resetConversationContext = () => {
  conversationContext = {
    recentTopics: [],
    emotionalState: "neutral",
    messageCount: 0,
  };
};

// Get initial greeting message
export const getInitialGreeting = (): ChatMessage => {
  return {
    id: "initial_greeting",
    role: "assistant",
    content: "Hello, I'm here to listen and support you. This is a safe space to share what's on your mind. How are you feeling today?",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    createdAt: Date.now(),
  };
};

/* 
BACKEND INTEGRATION NOTES:
When integrating with a real AI API (OpenAI, Anthropic Claude, etc.):

1. Create a backend API endpoint (e.g., /api/chat)
2. Store your API key securely in environment variables (NEVER in frontend code)
3. Send user messages to your backend
4. Your backend calls the AI API with the conversation history
5. Return the AI response to the frontend

Example backend structure (Node.js/Express):

```javascript
app.post('/api/chat', async (req, res) => {
  const { message, conversationHistory } = req.body;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { 
        role: "system", 
        content: "You are a supportive mental health companion. Be empathetic, non-judgmental, and remember you're not a replacement for professional care." 
      },
      ...conversationHistory,
      { role: "user", content: message }
    ],
  });
  
  res.json({ response: response.choices[0].message.content });
});
```
*/
