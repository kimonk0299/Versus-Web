# Versus - Movie Tournament Bracket (Web Version)

A web-based movie tournament bracket game that lets you discover which movies reign supreme! Based on the Android Versus app, this Next.js implementation preserves all the critical business logic while bringing the experience to the web.

## Features

- **Single Actor Mode**: Run a single-elimination tournament for one actor's top movies
- **Actor vs Actor Mode**: Head-to-head battle between two actors' movies
- **Preset Actor Database**: ~160 actors from Tamil, Telugu, Bollywood, and Hollywood cinema
- **TMDb Integration**: Search for any actor not in the preset database
- **Smart Popularity Scoring**: Uses voteCount × voteAverage for better results
- **Confetti Animation**: Celebration effects for tournament winners
- **Responsive Design**: Works on mobile, tablet, and desktop

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS with custom theme
- **Animation**: Framer Motion
- **Fonts**: Fredoka (headings), Nunito (body text)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- TMDb API key (get one at https://www.themoviedb.org/settings/api)

### Installation

1. Clone the repository:
```bash
cd versus-web
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - The `.env.local` file already contains the TMDb API key
   - Never commit this file to version control!

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
versus-web/
├── src/
│   ├── app/                          # Next.js pages (App Router)
│   │   ├── page.tsx                  # Home: mode selector, actor search
│   │   ├── disambiguation/[query]/   # Actor TMDb search results
│   │   ├── bracket/[actorId]/        # Single actor tournament
│   │   ├── bracket/[actorId]/vs/[actor2Id]/  # Versus mode
│   │   ├── winner/[movieId]/         # Winner screen
│   │   ├── versus-result/            # Versus result screen
│   │   ├── layout.tsx                # Root layout (fonts, theme)
│   │   └── api/tmdb/                 # TMDb API proxy routes
│   │
│   ├── components/                   # Reusable UI components
│   │   ├── MovieCard.tsx             # Movie poster card
│   │   ├── ActorSearchField.tsx      # Input with autocomplete
│   │   ├── SuggestionsList.tsx       # Dropdown for preset actors
│   │   ├── ActorResultCard.tsx       # Disambiguation actor card
│   │   ├── ConfettiAnimation.tsx     # Canvas confetti
│   │   └── LoadingSpinner.tsx        # Loading state
│   │
│   ├── stores/                       # Zustand stores (state management)
│   │   ├── homeStore.ts              # Mode, actor search, presets
│   │   ├── bracketStore.ts           # Tournament state, logic
│   │   └── disambiguationStore.ts    # TMDb search results
│   │
│   └── lib/                          # Business logic
│       ├── tmdb/
│       │   ├── client.ts             # API route fetch wrappers
│       │   ├── types.ts              # TypeScript interfaces
│       │   └── repository.ts         # getTopMovies logic
│       ├── preset-actors/
│       │   ├── database.ts           # Preset actor search
│       │   └── data.json             # ~160 actors
│       ├── bracket/
│       │   ├── algorithm.ts          # Bracket creation, advancement
│       │   └── types.ts              # BracketState, Matchup, Movie
│       └── constants.ts              # TMDb URLs, config
```

## Critical Business Logic

This web app preserves the exact business logic from the Android version:

### 1. Popularity Scoring
```typescript
// CRITICAL: Use voteCount × voteAverage, NOT TMDb's popularity field
popularity: item.vote_count * item.vote_average
```

### 2. Role Filtering
```typescript
// CRITICAL: Only include movies where actor had lead/supporting role
.filter(item => item.order < 10)
```

### 3. Bracket Padding
```typescript
// Pad to nearest power of 2: 16, 8, or 4 minimum
const targetSize = movies.length >= 16 ? 16 :
                   movies.length >= 8  ? 8  :
                   movies.length >= 4  ? 4  : 2;
```

### 4. Versus Mode Pairing
```typescript
// CRITICAL: Shuffle EACH actor's movies independently, then pair by index
const shuffled1 = shuffleArray(movies1);
const shuffled2 = shuffleArray(movies2);
const matchups = Array.from({ length: Math.min(shuffled1.length, shuffled2.length) },
  (_, i) => ({ movie1: shuffled1[i], movie2: shuffled2[i], winner: null }));
```

### 5. Exact Name Matching
```typescript
// CRITICAL: Case-insensitive exact match for preset lookup
return results.find(actor =>
  actor.name.toLowerCase() === query.trim().toLowerCase()
) || null;
```

## Theme Configuration

**Colors**:
- Primary: `#6C63FF` (vibrant purple)
- Secondary: `#FF6584` (hot coral pink)
- Background: `#FFF8F0` (warm cream)
- Surface Variant: `#F5F0FF` (light lavender)
- Card Border: `#E0D8F0`

**Fonts**:
- **Fredoka**: Headings (bubbly, chunky style)
- **Nunito**: Body text, buttons (rounded, friendly)

## User Flows

### Single Actor Tournament
1. User selects "Single Actor" mode
2. User types actor name (autocomplete shows preset suggestions)
3. If exact match found → go to bracket
4. If not found → disambiguation screen (TMDb search)
5. User picks movies in head-to-head matchups
6. Winner screen with confetti animation

### Actor vs Actor Battle
1. User selects "Actor vs Actor" mode
2. User enters two actor names
3. Each actor's movies are shuffled independently
4. Movies are paired by index (Actor1[0] vs Actor2[0], etc.)
5. User picks winner for each matchup
6. Result screen shows final score and winning actor

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project to Vercel
3. Set environment variable: `TMDB_API_KEY`
4. Deploy!

The app is optimized for Vercel with:
- Automatic image optimization
- API route caching
- Static page generation where possible

## License

This project is a web port of the Android Versus app.

## Credits

- Movie data provided by [The Movie Database (TMDb)](https://www.themoviedb.org/)
- Preset actor database curated for Tamil, Telugu, Bollywood, and Hollywood cinema
