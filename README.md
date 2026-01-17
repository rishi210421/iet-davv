# Career Oracle

A production-ready full-stack recruitment & placement operating system built with Next.js, Firebase, and AI integration.

## Features

### Student Dashboard
- Job applications and tracking
- Interview scheduling and calendar
- AI Resume Verifier
- Coding challenges with Monaco editor
- AI Interview Coach
- Career Path recommendations
- Offer management

### Recruiter Dashboard
- Job posting and management
- Applicant tracking
- Interview scheduling
- Analytics and insights
- Top talent discovery
- Offer management

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Charts**: Recharts
- **Code Editor**: Monaco Editor
- **AI**: OpenAI / Gemini (abstracted service layer)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up Firebase:
   - Create a Firebase project
   - Enable Authentication (Email/Password, Phone)
   - Create Firestore database
   - Enable Storage
   - Copy your config to `.env.local`

3. Configure environment variables:
```bash
cp .env.example .env.local
```

4. Set up Firebase Security Rules:
   - Deploy Firestore rules from `firestore.rules`
   - Deploy Storage rules from `storage.rules`

5. Seed demo data (optional):
```bash
npm run seed
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Deployment

The app is ready for Vercel deployment. Make sure to:
1. Add all environment variables in Vercel dashboard
2. Deploy Firebase security rules
3. Build and deploy: `npm run build`

## Project Structure

```
/app              - Next.js App Router pages
/components       - React components
/lib              - Utilities and services
  /firebase       - Firebase configuration
  /ai.ts          - AI service layer
/types            - TypeScript types
/scripts          - Seed data scripts
```

## License

MIT
