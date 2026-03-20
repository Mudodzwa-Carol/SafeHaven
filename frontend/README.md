# SafeHaven

A Secure AI-Driven mental health support

## Features

### Community Feed

- Anonymous posting with mood indicators (Positive, Neutral, Struggling)
- Support reactions (heart/like system)
- Comment system for community engagement
- Real-time updates with persistent storage
- Warm, supportive design with mood-based color coding

### AI Chat Companion

- Context-aware AI responses that adapt to conversation history
- Emotion detection (anxiety, depression, stress, loneliness, etc.)
- Topic extraction (work, relationships, sleep, therapy, meditation)
- Supportive, non-judgmental conversational style
- Visual distinction with emerald/teal color scheme

### Privacy & Safety

- Fully anonymous - no personal data collected
- Local storage only (ready for backend integration)
- Clear disclaimers about not replacing professional care
- Mobile-responsive design with no horizontal scrolling

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Routing**: React Router v7 (Data Mode)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Package Manager**: npm

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (recommended) or yarn

To check if Node.js is installed:

```bash
node --version
npm --version
```

## Installation

1. **Clone or download this repository** to your local machine

2. **Navigate to the project directory**:

   ```bash
   cd SafeHaven
   ```

3. **Install dependencies**:

   Using npm (recommended):

   ```bash
   npm install
   ```

   Or using yarn:

   ```bash
   yarn install
   ```

## Running the Application

1. **Start the development server**:

   Using npm:

   ```bash
   npm run dev
   ```

   Or using yarn:

   ```bash
   yarn dev
   ```

2. **Open your browser** and navigate to:

   ```
   http://localhost:5173
   ```

   (The port number may vary - check your terminal output for the exact URL)

3. **The application should now be running!** You'll see:
   - The Safehaven homepage with navigation
   - Community Feed page (default view)
   - AI Chat page accessible via navigation

## Building for Production

To create a production-ready build:

Using npm:

```bash
npm run build
```

The built files will be in the `dist` folder.

To preview the production build locally:

```bash
npm run preview
```

## Project Structure

```
safehaven/
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   └── ui/
│   │   ├── pages/
│   │   │   ├── AIChat.tsx
│   │   │   └── CommunityFeed.tsx
│   │   └── services/
│   │       ├── ai.ts
│   │       └── storage.ts
│   ├── imports/
│   │   └── pasted_text/
│   │       └── safehaven-ui-design.md
│   └── styles/
│       ├── fonts.css
│       ├── index.css
│       ├── tailwind.css
│       └── theme.css
├── package.json
├── postcss.config.mjs
├── vite.config.ts
├── .gitignore
├── README.md
└── ATTRIBUTIONS.md
```

## Key Components

### Storage Service (`src/app/services/storage.ts`)

- Manages community posts using localStorage
- Provides functions for creating posts, toggling support, and managing comments
- Includes TypeScript interfaces for type safety
- Ready for backend API integration (see inline comments)

### AI Service (`src/app/services/ai.ts`)

- Generates context-aware mental health support responses
- Detects emotions and extracts topics from user messages
- Maintains conversation context for more natural interactions
- Includes detailed notes on backend integration with OpenAI/Anthropic

## Data Persistence

Currently, the application uses **localStorage** to persist data:

- Community posts are saved across browser sessions
- AI chat history is maintained during the session
- Sample data is initialized on first load

**Note**: Clearing browser data will reset all content.

## Backend Integration (Future)

The codebase is structured for easy backend integration:

### For Community Posts

Replace localStorage calls in `src/app/services/storage.ts` with API calls:

- `GET /api/posts` - Fetch all posts
- `POST /api/posts` - Create new post
- `POST /api/posts/:id/support` - Toggle support
- `GET /api/posts/:id/comments` - Get comments
- `POST /api/posts/:id/comments` - Add comment

### For AI Chat

Replace the AI service in `src/app/services/ai.ts` with:

- `POST /api/chat` - Send message and conversation history to backend
- Backend securely calls OpenAI/Anthropic API with your API key
- Return AI response to frontend

**Recommended Backend Stack**:

- Database: PostgreSQL (via Supabase) or MongoDB
- API: Node.js/Express, Next.js API routes, or Supabase Edge Functions
- AI: OpenAI GPT-4, Anthropic Claude, or similar

Detailed integration notes are included as comments in both service files.

## Environment Variables (For Backend Integration)

When you add a backend, create a `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Security Note**: Never commit API keys to version control. The current implementation keeps all logic frontend-only to avoid this issue.

## Browser Compatibility

This application works best on:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Mobile browsers are fully supported with responsive design.

## Troubleshooting

### Port Already in Use

If port 5173 is already in use, Vite will automatically try the next available port. Check your terminal output.

### Build Errors

Ensure you're using Node.js v18 or higher:

```bash
node --version
```

### LocalStorage Not Persisting

Check your browser settings to ensure localStorage is enabled and not being cleared automatically.

## Important Notes

- **Not for Production PHI/PII**: This application is designed for development and prototyping. It is not intended for collecting personally identifiable information (PII) or protected health information (PHI) in a production environment without proper security measures.

- **Not Medical Advice**: The AI companion provides supportive conversation but is not a replacement for professional mental health care. Users in crisis should contact appropriate emergency services or crisis hotlines.

- **Sample Data**: The application includes sample posts to demonstrate functionality. These will appear on first load.

## Contributing

This is a development project. When adding features:

1. Follow the existing component structure
2. Update TypeScript interfaces when modifying data structures
3. Add backend integration notes in comments
4. Maintain mobile responsiveness
5. Test across different browsers

## License

This project is for educational and development purposes.

## Support

For questions or issues with the codebase, please refer to the inline comments in the service files (`storage.ts` and `ai.ts`) which provide detailed implementation guidance.

---

**Built with care for mental health support**
