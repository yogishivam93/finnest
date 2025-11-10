# AI Agent Instructions for Finnest

## Project Overview
Finnest is a Next.js application for managing financial assets, beneficiaries, and FX rates. The app uses Supabase for data storage and authentication, with TypeScript for type safety.

## Architecture

### Key Components
- `src/app/*` - Next.js App Router pages and layouts
- `src/components/*` - React components organized by feature
- `src/lib/` - Shared utilities and service clients
- `src/types/` - TypeScript type definitions

### Data Flow
1. Supabase handles data persistence (`src/lib/supabase.ts`)
2. Type definitions in `src/types/` define the shape of data
3. Components fetch and display data using Supabase client
4. Asset and FX related operations are centralized in `src/lib/fx.ts`

## Development Workflow

### Environment Setup
Required environment variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Common Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint checks

## Project Conventions

### Component Structure
- Stateful logic belongs in client components (marked with "use client")
- Reusable UI components live in `src/components/`
- Page components follow Next.js App Router conventions in `src/app/`

### Data Patterns
- Asset data follows the `Asset` type interface in `src/types/asset.ts`
- FX operations are consolidated in `src/lib/fx.ts`
- All database operations go through the Supabase client

### UI/UX Patterns
- Use TailwindCSS for styling
- Components like `AssetsTable`, `BeneficiariesTable` handle data display
- Modal components (`AddAssetModal`, `FxRateModal`) for user interactions

## Integration Points
- Supabase: Authentication and data storage
- Recharts: Data visualization
- Next.js App Router: Page routing and layouts
- TailwindCSS: Styling system

## Common Gotchas
- Always use "use client" directive for client-side components
- Environment variables must be prefixed with `NEXT_PUBLIC_` for client usage
- Check for null values in data types as shown in `src/types/asset.ts`

## Reference Examples
- Basic component: See `src/components/DashboardShell.tsx`
- Data types: See `src/types/asset.ts`
- Service setup: See `src/lib/supabase.ts`