# Cal — Event Calendar

A refined event management PWA built with React 19, TypeScript, Vite, and Supabase.

## Setup

**Prerequisites:** Node.js

1. Install dependencies:
```
   npm install
```

2. Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the Supabase SQL schema from `App.tsx` in your Supabase SQL Editor.

4. Start the app:
```
   npm run dev
```