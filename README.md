# MCAT Study Tracker

A comprehensive React Native mobile application built with Expo to help students track their MCAT preparation progress, manage study sessions, take practice exams, and analyze performance.

## Features

- **Authentication**: Secure user registration and login with Supabase
- **Dashboard**: Overview of study progress, recent activity, and goals
- **Study Sessions**: Track study time by subject and topic
- **Practice Exams**: Take full-length and section-specific practice tests
- **Analytics**: Visualize performance trends and identify areas for improvement
- **Goals**: Set and track MCAT preparation milestones
- **Cross-platform**: Works on iOS, Android, and web

## Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (PostgreSQL database, authentication, real-time)
- **State Management**: TanStack Query (React Query)
- **Charts**: React Native Chart Kit
- **Storage**: AsyncStorage for local data persistence
- **Language**: TypeScript

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mcat-study-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Update `lib/supabase.ts` with your credentials
   - Run the SQL scripts from the technical architecture document to create tables

4. Start the development server:
```bash
npm start
```

5. Use the Expo Go app on your phone or run on simulator:
   - iOS: Press `i` to open iOS simulator
   - Android: Press `a` to open Android emulator
   - Web: Press `w` to open in web browser

## Project Structure

```
app/
├── (auth)/          # Authentication screens
│   ├── login.tsx
│   └── signup.tsx
├── (tabs)/          # Main tab navigation
│   ├── dashboard.tsx
│   ├── study.tsx
│   ├── practice.tsx
│   ├── analytics.tsx
│   └── goals.tsx
├── _layout.tsx      # Root layout with providers
└── index.tsx        # Entry point

lib/
└── supabase.ts      # Supabase client configuration

constants/
└── Colors.ts        # App colors and constants

assets/              # Images, fonts, and other static assets
```

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Start on Android
- `npm run ios` - Start on iOS
- `npm run web` - Start on web
- `npm run tunnel` - Start with tunnel for external access
- `npm run clear` - Clear cache and start

## Database Schema

The app uses the following main tables:
- `users` - User profiles and preferences
- `study_sessions` - Individual study session records
- `practice_exams` - Practice exam results and scores
- `goals` - User-defined goals and progress tracking

Refer to the technical architecture document for detailed schema information.

## Development Notes

- The app uses Expo Router for file-based navigation
- TanStack Query handles server state management and caching
- Supabase provides real-time database updates
- All screens are currently placeholder implementations
- Authentication flow redirects to login by default

## Next Steps

1. Set up Supabase database with the provided schema
2. Implement authentication logic
3. Build out individual screen functionality
4. Add data fetching with TanStack Query
5. Implement charts and analytics
6. Add form validation and error handling
7. Style components and improve UI/UX
8. Add testing
9. Prepare for app store deployment

## Contributing

This is a beginner-friendly project. Feel free to contribute by:
- Implementing screen functionality
- Adding new features
- Improving UI/UX
- Writing tests
- Updating documentation

## License

MIT License - see LICENSE file for details