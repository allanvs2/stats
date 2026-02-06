# Vikings & JDA Dart Club Stats - Project State Document

**Last Updated**: 2025-02-05  
**Version**: 1.0.0  
**Status**: Production Ready (Vikings), JDA In Development  
**Live URL**: dartstats.online  
**Repository**: https://github.com/allanvs2/stats

---

## 🎯 Quick Start Summary

This is a professional dart club statistics platform built with Next.js 15, TypeScript, Supabase, and deployed on Vercel. It serves two clubs: **Vikings Dart Club** (fully operational) and **JDA Dart Club** (structure in place).

**Key Achievement**: Successfully deployed with TypeScript strict mode compliance, clean design system, and comprehensive Vikings club features including individual player pages, season filtering, and handicap system.

---

## 📊 Current Feature Status

### ✅ Completed Features

#### Vikings Club
- [x] Main dashboard with season selector
- [x] Club statistics overview (games, 180s, darts, averages)
- [x] Rankings table with position change indicators
- [x] Individual player detail pages
- [x] Weekly average trend charts (Recharts)
- [x] Top opponents analysis
- [x] Top 10 highest average games
- [x] Handicap system with tiered brackets
- [x] Season filtering (current + historical by year)
- [x] Clean professional design with Vikings branding

#### Admin Panel
- [x] Admin dashboard with system overview
- [x] User management (create, assign roles, club memberships)
- [x] Real-time notification system with bell icon
- [x] CSV upload with automatic delimiter detection
- [x] Analytics dashboard with charts
- [x] Club management overview

#### Authentication & Core
- [x] Email/password authentication
- [x] Role-based access control (admin/user)
- [x] Protected routes with middleware
- [x] User dashboard with club memberships
- [x] Logout functionality

### 🚧 In Progress / Planned

#### JDA Club
- [ ] Dashboard implementation (tables exist, UI needed)
- [ ] Stats display and filtering
- [ ] Individual player pages
- [ ] Season management
- [ ] Bonus point system visualization

#### Future Enhancements
- [ ] Performance trends over multiple seasons
- [ ] Export functionality (PDF/CSV)
- [ ] Mobile app optimization
- [ ] Advanced analytics
- [ ] Player comparison tools

---

## 🏗️ Technical Architecture

### Tech Stack
```
Frontend:
- Next.js 15 (App Router)
- TypeScript (strict mode)
- Tailwind CSS v4
- shadcn/ui components
- Recharts for visualizations

Backend:
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Real-time subscriptions
- Supabase Auth

Deployment:
- Vercel (CI/CD via GitHub)
- Environment variables configured
- TypeScript build validation
```

### Database Documentation
**Full database schema, RLS policies, stored procedures, and triggers documented in [DATABASE.md](./DATABASE.md)**

### Database Schema Quick Reference

**Core Tables:**
- `profiles` - User accounts (id, email, full_name, role, created_at)
- `clubs` - Club information (id, name, description, database_prefix)
- `club_memberships` - User-to-club relationships (user_id, club_id, joined_at)
- `admin_notifications` - Real-time notifications (type, message, user_id, read, created_at)

**Vikings Tables:**
- `vikings_friday` - Weekly session data (date, name, points, games, won, lost, darts_thrown, score_left, average, one_eighty, one_seventy_one, high_closer, winner, block, season)
- `vikings_matches` - Individual match results (date, player, against, legs, ave, result, season, year)
- `vikings_members` - Member roster

**JDA Tables:**
- `jda_stats` - Player statistics (structure ready)
- `jda_legs` - Individual leg tracking (structure ready)
- `jda_matches` - Match results (structure ready)

**Stored Procedures:**
- `get_vikings_rankings(target_season)` - Complex ranking calculation with position changes week-over-week
- `get_vikings_handicaps()` - Handicap calculations based on season averages (min 3 sessions)

**Important Schema Notes:**
- Seasons stored as VARCHAR/text (not integers)
- "position" is a PostgreSQL reserved keyword - handled in queries
- Vikings average calculation: `(totalScore / totalDarts * 3)` for multiplication factor
- Season filtering uses "season_year" format (e.g., "1_2026")

---

## 🎨 Design System

### Color Themes

**Vikings Club**
- Primary: Deep reds (#b91c1c, red-700 to red-900)
- Accent: Yellow for highlights
- Background: Slate/zinc tones
- Logo: Black & white with 90% transparency overlay

**JDA Club**
- Primary: Dark slate colors
- Accent: Purple/blue tones
- Background: Similar slate theme

### Key Design Decisions
1. **Clean, newspaper-like aesthetic** - Moved away from "rainbow" color schemes
2. **Background logos** - Subtle, 90% transparent, don't interfere with content
3. **Position change indicators** - Color-coded (green ↑, red ↓, gray −)
4. **Card-based layouts** - Consistent shadow-sm, hover:shadow-md
5. **Professional typography** - Clear hierarchy, readable fonts
6. **Responsive design** - Mobile-first approach

### Component Patterns
```typescript
// Standard card layout
<Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow opacity-90">
  <CardHeader className="border-b border-slate-100">
    <CardTitle className="text-slate-900">Title</CardTitle>
  </CardHeader>
  <CardContent className="pt-6">
    {/* Content */}
  </CardContent>
</Card>
```

---

## 💻 Critical Technical Patterns

### TypeScript Strict Mode Compliance
```typescript
// ❌ NEVER USE - Will break Vercel build
const data: any = await fetch(...)

// ✅ CORRECT - Always define types
interface PlayerData {
  name: string;
  average: number;
}
const data: PlayerData[] = await fetch(...)
```

### Supabase Client Usage
```typescript
// Server Components (app/...)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// Client Components ('use client')
import { createBrowserClient } from '@supabase/ssr'
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Season Handling Pattern
```typescript
// Season selector uses "season_year" format
const seasonValue = "1_2026" // Season 1 of year 2026

// For queries, extract just the season number
const seasonToQuery = seasonValue.split('_')[0] // "1"

// Current season detection
const { data } = await supabase
  .from('vikings_friday')
  .select('season, date')
  .order('date', { ascending: false })
  .limit(1)
```

### Dynamic Chart Loading
```typescript
// Always use React.lazy for Recharts to avoid SSR issues
const LineChart = React.lazy(() => 
  import('recharts').then(mod => ({ default: mod.LineChart }))
)
```

---

## 📁 Key File Locations

### Critical Files
```
/src/app/layout.tsx                          - Root layout
/src/middleware.ts                           - Route protection
/src/lib/supabase/server.ts                  - Server Supabase client
/src/lib/supabase/client.ts                  - Browser Supabase client
```

### Vikings Club
```
/src/app/clubs/vikings/page.tsx              - Vikings main page (wrapper)
/src/components/clubs/VikingsDashboard.tsx   - Vikings dashboard logic
/src/app/clubs/vikings/[playerId]/page.tsx   - Player detail page
/src/components/clubs/VikingsHandicaps.tsx   - Handicap system
```

### Admin
```
/src/app/admin/page.tsx                      - Admin dashboard
/src/components/admin/UserManagementClient.tsx
/src/components/admin/NotificationBell.tsx
/src/components/admin/CustomCSVUpload.tsx
```

### JDA Club
```
/src/app/clubs/jda/page.tsx                  - JDA main page
/src/components/clubs/JDADashboard.tsx       - JDA dashboard (placeholder)
```

---

## 🚨 Known Issues & Limitations

### Current Issues
None identified - production stable

### Technical Constraints
1. **TypeScript Strict Mode** - Must pass with no `any` types or Vercel build fails
2. **Reserved Keywords** - "position" requires careful handling in SQL
3. **Season Data Type** - Stored as VARCHAR, requires string comparison
4. **Rate Limits** - Supabase free tier has API limits
5. **Browser Storage** - No localStorage/sessionStorage in artifacts

### Design Limitations
1. JDA club needs full implementation
2. No multi-season comparison tools yet
3. No export functionality (PDF/CSV)
4. Limited mobile optimization

---

## 🔄 Recent Changes (Last Session)

**Date**: 2025-02-05

**Changes Made:**
- Initial project review and documentation
- Created PROJECT_STATE.md file for session continuity
- Created DATABASE.md for complete schema documentation
- Documented complete system architecture
- Mapped all features and file locations
- Established patterns and conventions

**Next Session Focus:**
- [To be filled in at end of each session]

---

## 📝 Development Notes

### Before Starting Work
1. Read this file first
2. Check "Recent Changes" section
3. Review any new issues or limitations
4. Pull latest from GitHub if needed

### After Each Session
1. Update "Recent Changes" section with date and summary
2. Move completed items from 🚧 to ✅
3. Add any new issues to 🚨 section
4. Update file locations if new files added
5. Document any new patterns or decisions

### Deployment Checklist
- [ ] Run `npm run build` locally
- [ ] Check for TypeScript errors
- [ ] Verify no ESLint violations
- [ ] Test on localhost:3000
- [ ] Push to GitHub (auto-deploys to Vercel)
- [ ] Monitor Vercel build logs
- [ ] Test on dartstats.online

---

## 🎯 Project Goals & Vision

### Short-term Goals (Next 2-4 weeks)
1. Complete JDA club implementation
2. Add export functionality
3. Mobile optimization improvements
4. Performance monitoring setup

### Long-term Goals (3-6 months)
1. Advanced analytics and insights
2. Player comparison tools
3. Historical trend analysis
4. Mobile app (React Native)
5. API for third-party integrations

### Success Metrics
- Vikings club: 100% feature complete ✅
- User satisfaction: High engagement
- System stability: 99%+ uptime
- Performance: <2s page load times

---

## 📚 Useful Commands

```bash
# Development
npm run dev              # Start dev server (Turbopack)

# Building
npm run build            # Production build
npm run start            # Start production server

# Linting
npm run lint             # Run ESLint

# Database
# (Use Supabase dashboard for schema changes)

# Deployment
git push origin main     # Auto-deploys to Vercel
```

---

## 🔗 Important Links

- **Live Site**: https://dartstats.online
- **GitHub**: https://github.com/allanvs2/stats
- **Vercel Dashboard**: [Your Vercel project]
- **Supabase Dashboard**: [Your Supabase project]

## 📄 Important Documentation Files

- **[PROJECT_STATE.md](./PROJECT_STATE.md)** - This file, project overview and current state
- **[DATABASE.md](./DATABASE.md)** - Complete database schema, RLS policies, stored procedures
- **[README.md](./README.md)** - General project README

---

## 💡 Tips for Future Sessions

1. **Always check this file first** - Saves 15-20 minutes of project exploration
2. **Check DATABASE.md for schema details** - Complete table structures, RLS policies, and stored procedures
3. **Update both files after every session** - Keep documentation current
4. **TypeScript strict mode** - Test builds before pushing
5. **Season handling** - Remember the "season_year" format
6. **Supabase clients** - Server vs browser patterns
7. **Background logos** - 90% transparency, don't dominate design
8. **Color consistency** - Vikings red, JDA slate/purple

---

**End of PROJECT_STATE.md**
