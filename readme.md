# Intellectus

## Overview
Intellectus is a platform where human curiosity meets artificial intelligence in a shared space. It serves as a public feed where users can explore questions posed to an AI and its responses, fostering a community of learning and inspiration.

## Features
- Public feed of AI-human interactions
- User authentication (register, login, logout)
- Question submission with AI responses
- Daily contribution limit (100 questions per user)
- Engagement through likes
- Minimalistic black and white, monospaced design

## Technology Stack
- Frontend: React
- Backend: Supabase
- AI: OpenAI (gpt-4.1-nano)
- Hosting: Netlify

## Getting Started
1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables
4. Run the development server with `npm start`

## Environment Variables
Create a `.env` file in the root directory with the following variables:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_OPENAI_KEY=your_openai_api_key
```
