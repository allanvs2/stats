# Supabase Database Schema & Security

**Last Updated**: 2025-02-10  
**Database**: PostgreSQL (Supabase)  
**Project**: Vikings & JDA Dart Club Stats  
**Status**: ✅ Synchronized with live database

---

## 📋 Table of Contents

1. [Core Tables](#core-tables)
2. [Vikings Tables](#vikings-tables)
3. [JDA Tables](#jda-tables)
4. [Views](#views)
5. [Row Level Security Policies](#row-level-security-policies)
6. [Stored Procedures](#stored-procedures)
7. [Database Triggers](#database-triggers)
8. [Indexes](#indexes)
9. [Foreign Key Relationships](#foreign-key-relationships)
10. [Important Notes](#important-notes)

---

## Core Tables

### `profiles`
User account information extending Supabase Auth.

**Columns:**
- `id` (UUID, PK) - References auth.users
- `email` (TEXT, nullable) - User email
- `first_name` (TEXT, nullable) - User's first name
- `last_name` (TEXT, nullable) - User's last name
- `role` (TEXT, default 'user') - Either 'user' or 'admin'
- `created_at` (TIMESTAMPTZ, default now()) - Account creation timestamp
- `updated_at` (TIMESTAMPTZ, default now()) - Last update timestamp

**Indexes:**
- `profiles_pkey` - PRIMARY KEY on `id`
- `profiles_email_key` - UNIQUE on `email`

**Notes:**
- Auto-created via trigger when user signs up via auth.users
- Role defaults to 'user'
- Names are stored separately to allow for better sorting and filtering
- Full name can be constructed as: `first_name || ' ' || COALESCE(last_name, '')`

---

### `clubs`
Dart club information.

**Columns:**
- `id` (UUID, PK, default gen_random_uuid()) - Unique club identifier
- `name` (TEXT, NOT NULL) - Club display name
- `description` (TEXT, nullable) - Club description
- `logo_url` (TEXT, nullable) - URL to club logo image
- `database_prefix` (TEXT, nullable) - Prefix for table naming (e.g., 'vikings', 'jda')
- `created_at` (TIMESTAMPTZ, NOT NULL, default now()) - Club creation timestamp

**Indexes:**
- `clubs_pkey` - PRIMARY KEY on `id`
- `clubs_name_key` - UNIQUE on `name`

**Current Clubs:**
- Vikings (database_prefix: 'vikings')
- JDA (database_prefix: 'jda')

---

### `club_memberships`
Many-to-many relationship between users and clubs.

**Columns:**
- `id` (UUID, PK, default gen_random_uuid()) - Unique membership identifier
- `user_id` (UUID, nullable, FK) - References profiles.id
- `club_id` (UUID, nullable, FK) - References clubs.id
- `joined_at` (TIMESTAMPTZ, NOT NULL, default now()) - Membership start date

**Indexes:**
- `club_memberships_pkey` - PRIMARY KEY on `id`
- `club_memberships_user_id_club_id_key` - UNIQUE on `(user_id, club_id)`

**Foreign Keys:**
- `user_id` → `profiles.id` (CASCADE on delete)
- `club_id` → `clubs.id` (CASCADE on delete)

**Constraints:**
- UNIQUE constraint on (user_id, club_id) - prevents duplicate memberships

---

### `admin_notifications`
Real-time notification system for admin users.

**Columns:**
- `id` (UUID, PK, default gen_random_uuid()) - Unique notification identifier
- `type` (TEXT, NOT NULL) - Notification type (e.g., 'new_signup', 'data_upload')
- `message` (TEXT, NOT NULL) - Notification message content
- `user_id` (UUID, nullable, FK) - Related user (if applicable)
- `user_email` (TEXT, nullable) - User email for context
- `user_name` (TEXT, nullable) - User name for context
- `read` (BOOLEAN, default false) - Read/unread status
- `created_at` (TIMESTAMPTZ, default now()) - Notification timestamp

**Indexes:**
- `admin_notifications_pkey` - PRIMARY KEY on `id`
- `idx_admin_notifications_read` - Index on `read`
- `idx_admin_notifications_created_at` - Index on `created_at DESC`

**Use Cases:**
- New user signup notifications
- Admin action logs
- System alerts

---

## Vikings Tables

### `vikings_friday`
Weekly Friday session statistics for Vikings club.

**Columns:**
- `id` (UUID, PK, default gen_random_uuid()) - Unique record identifier
- `date` (DATE, nullable) - Session date
- `name` (TEXT, nullable) - Player name (historical data)
- `points` (INTEGER, nullable) - Points earned in session
- `games` (INTEGER, nullable) - Number of games played
- `won` (INTEGER, nullable) - Games won
- `lost` (INTEGER, nullable) - Games lost
- `darts_thrown` (INTEGER, nullable) - Total darts thrown
- `score_left` (INTEGER, nullable) - Remaining score (for average calculation)
- `average` (NUMERIC, nullable) - Dart average for session
- `one_eighty` (INTEGER, nullable) - Number of 180s scored
- `one_seventy_one` (INTEGER, nullable) - Number of 171s scored
- `high_closer` (INTEGER, nullable) - Highest checkout
- `winner` (INTEGER, default 0) - Winner flag (0 or 1)
- `block` (VARCHAR(45), nullable) - Block/division
- `season` (VARCHAR(45), nullable) - Season identifier (stored as VARCHAR!)
- `year` (INTEGER, nullable) - Year
- `created_at` (TIMESTAMPTZ, NOT NULL, default now()) - Record creation timestamp

**Indexes:**
- `vikings_friday_pkey` - PRIMARY KEY on `id`

**Important Notes:**
- Season stored as VARCHAR(45), not INTEGER
- Average calculation: `(totalScore / totalDarts * 3)` where totalScore = `(games * 501) - score_left`
- Multiple entries per player per season (one per Friday session)
- `name` field contains historical player names as they appeared in matches

---

### `vikings_matches`
Individual match results for Vikings club.

**Columns:**
- `id` (UUID, PK, default gen_random_uuid()) - Unique match identifier
- `date` (DATE, nullable) - Match date
- `player` (TEXT, nullable) - Player name (historical data)
- `against` (TEXT, nullable) - Opponent name (historical data)
- `legs` (INTEGER, nullable) - Number of legs in match
- `ave` (NUMERIC, nullable) - Match average
- `result` (TEXT, nullable) - Match result (e.g., "Won", "Lost")
- `season` (INTEGER, nullable) - Season number
- `year` (INTEGER, nullable) - Year
- `created_at` (TIMESTAMPTZ, NOT NULL, default now()) - Record creation timestamp

**Indexes:**
- `vikings_matches_pkey` - PRIMARY KEY on `id`

**Notes:**
- Used for head-to-head statistics
- Season stored as INTEGER here (unlike vikings_friday which uses VARCHAR)
- Player names are stored as they appeared historically in match data

---

### `vikings_members`
Vikings club member roster with optional user linkage.

**Columns:**
- `id` (UUID, PK, default gen_random_uuid()) - Unique member identifier
- `first_name` (VARCHAR(50), nullable) - Member first name
- `last_name` (VARCHAR(50), nullable) - Member last name
- `member` (VARCHAR(50), nullable) - Full member name or identifier (legacy field)
- `season` (INTEGER, nullable) - Season membership
- `user_id` (UUID, nullable, FK) - Optional link to registered user

**Indexes:**
- `vikings_members_pkey` - PRIMARY KEY on `id`
- `idx_vikings_members_first_name` - Index on `first_name`
- `idx_vikings_members_user_id` - Index on `user_id`

**Foreign Keys:**
- `user_id` → `profiles.id` (SET NULL on delete)

**Notes:**
- Allows linking Vikings players to registered users
- user_id can be NULL (player not registered yet)
- SET NULL on delete preserves historical member data
- When user_id is linked, first_name and last_name are synced from profiles table

---

## JDA Tables

### `jda_stats`
JDA club comprehensive player statistics.

**Columns:**
- `id` (UUID, PK, default gen_random_uuid()) - Unique record identifier
- `date` (DATE, nullable) - Statistics date
- `player` (VARCHAR(50), nullable) - Player name (historical data)
- `bonus` (INTEGER, nullable) - Bonus points awarded
- `points` (INTEGER, nullable) - Points earned
- `games` (INTEGER, nullable) - Games played
- `won` (INTEGER, nullable) - Games won
- `lost` (INTEGER, nullable) - Games lost
- `darts` (INTEGER, nullable) - Total darts thrown
- `score_left` (INTEGER, nullable) - Remaining score
- `average` (NUMERIC, nullable) - Dart average
- `one_eighty` (INTEGER, nullable) - Number of 180s scored
- `one_seventy_one` (INTEGER, nullable) - Number of 171s scored
- `closer` (INTEGER, nullable) - Highest checkout
- `closer1` (INTEGER, default 0) - Checkout type 1
- `closer2` (INTEGER, default 0) - Checkout type 2
- `block_position` (INTEGER, nullable) - Position in block
- `block` (VARCHAR(45), nullable) - Block/division
- `created_at` (TIMESTAMPTZ, NOT NULL, default now()) - Record creation timestamp

**Indexes:**
- `jda_stats_pkey` - PRIMARY KEY on `id`

**Notes:**
- `player` field contains historical player names as they appeared in matches

---

### `jda_legs`
Individual leg tracking for JDA club matches.

**Columns:**
- `id` (UUID, PK, default gen_random_uuid()) - Unique leg identifier
- `date` (DATE, nullable) - Leg date
- `player` (VARCHAR(50), nullable) - Player name (historical data)
- `opponent` (VARCHAR(45), nullable) - Opponent name (historical data)
- `darts` (INTEGER, nullable) - Darts thrown in leg
- `score_left` (INTEGER, nullable) - Remaining score at end of leg
- `result` (VARCHAR(45), nullable) - Leg result (won/lost)
- `created_at` (TIMESTAMPTZ, NOT NULL, default now()) - Record creation timestamp

**Indexes:**
- `jda_legs_pkey` - PRIMARY KEY on `id`

**Notes:**
- Player and opponent names are stored as they appeared historically in match data

---

### `jda_matches`
Match results for JDA club.

**Columns:**
- `id` (UUID, PK, default gen_random_uuid()) - Unique match identifier
- `date` (DATE, nullable) - Match date
- `player` (TEXT, nullable) - Player name (historical data)
- `opponent` (TEXT, nullable) - Opponent name (historical data)
- `legs` (INTEGER, nullable) - Number of legs in match
- `ave` (NUMERIC, nullable) - Match average
- `result` (TEXT, nullable) - Match result
- `created_at` (TIMESTAMPTZ, NOT NULL, default now()) - Record creation timestamp

**Indexes:**
- `jda_matches_pkey` - PRIMARY KEY on `id`

**Notes:**
- Player and opponent names are stored as they appeared historically in match data

---

### `jda_members`
JDA club member roster with user linkage.

**Columns:**
- `id` (UUID, PK, default gen_random_uuid()) - Unique member identifier
- `first_name` (VARCHAR(100), NOT NULL) - Member first name
- `last_name` (VARCHAR(100), nullable) - Member last name
- `display_name` (VARCHAR(100), NOT NULL) - How player appears in stats/leaderboards
- `user_id` (UUID, nullable, FK) - Link to registered user
- `notes` (TEXT, nullable) - Additional member notes
- `created_at` (TIMESTAMPTZ, NOT NULL, default now()) - Record creation timestamp
- `updated_at` (TIMESTAMPTZ, NOT NULL, default now()) - Last update timestamp

**Indexes:**
- `jda_members_pkey` - PRIMARY KEY on `id`
- `idx_jda_members_first_name` - Index on `first_name`
- `idx_jda_members_display_name` - Index on `display_name`
- `idx_jda_members_user_id` - Index on `user_id`

**Foreign Keys:**
- `user_id` → `profiles.id` (SET NULL on delete)

**Triggers:**
- `update_jda_members_updated_at` - Auto-updates `updated_at` on UPDATE

**Notes:**
- Allows linking JDA players to registered users
- `display_name` is the primary identifier used in stats and leaderboards
- Can support nicknames or preferred names different from legal names
- When user_id is linked, first_name and last_name are synced from profiles table
- Has automatic updated_at timestamp management

---

## Views

### `linked_players`
Consolidated view of all players linked to user accounts across both clubs.

**Columns:**
- `club_type` (TEXT) - 'vikings' or 'jda'
- `id` (UUID) - Member record ID
- `player_name` (TEXT) - Display name for Vikings (first_name) or JDA (display_name)
- `user_id` (UUID) - User account ID
- `full_name` (TEXT) - Reconstructed full name from profiles (first_name + last_name)
- `email` (TEXT) - User email from profiles
- `club_id` (UUID) - Club ID
- `club_name` (TEXT) - Club name

**Definition:**
```sql
SELECT 
  'vikings'::text AS club_type,
  vm.id,
  vm.first_name AS player_name,
  vm.user_id,
  CONCAT(p.first_name, ' ', COALESCE(p.last_name, '')) AS full_name,
  p.email,
  c.id AS club_id,
  c.name AS club_name
FROM vikings_members vm
LEFT JOIN profiles p ON vm.user_id = p.id
LEFT JOIN clubs c ON c.database_prefix = 'vikings'::text
WHERE vm.user_id IS NOT NULL

UNION ALL

SELECT 
  'jda'::text AS club_type,
  jm.id,
  jm.display_name AS player_name,
  jm.user_id,
  CONCAT(p.first_name, ' ', COALESCE(p.last_name, '')) AS full_name,
  p.email,
  c.id AS club_id,
  c.name AS club_name
FROM jda_members jm
LEFT JOIN profiles p ON jm.user_id = p.id
LEFT JOIN clubs c ON c.database_prefix = 'jda'::text
WHERE jm.user_id IS NOT NULL
```

**Use Cases:**
- Admin panel user management
- Cross-club user lookup
- Membership reporting
- User linking verification

---

## Row Level Security Policies

### Security Model Overview
- **Public Read**: Club stats viewable by club members
- **Admin All**: Admins can perform all operations
- **Self-Manage**: Users can view/update their own data
- **Authentication**: All authenticated users can view all profiles (prevents circular RLS dependency)

---

### Key RLS Patterns

**Admin Check Pattern:**
```sql
EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND role = 'admin'
)
```

**Club Member Check Pattern (Vikings):**
```sql
EXISTS (
  SELECT 1 FROM vikings_members
  WHERE user_id = auth.uid()
)
```

**Club Member Check Pattern (JDA):**
```sql
EXISTS (
  SELECT 1 FROM jda_members
  WHERE user_id = auth.uid()
)
```

---

### Critical RLS Notes

#### Profiles Table RLS
The profiles table uses a simplified RLS approach to prevent circular dependencies:
- **SELECT**: All authenticated users can view all profiles (required for role checks in other tables)
- **INSERT**: Service role for auth trigger, admins for manual creation
- **UPDATE**: Users can update own profile, admins can update any
- **DELETE**: Only admins can delete profiles

This prevents the circular dependency where other tables check profiles for admin role, which would fail if profiles RLS also checked profiles for admin role.

#### Notable RLS Policies

**Vikings & JDA Stats Tables:**
- Members can view if they're linked via respective members table
- Admins have full access (SELECT, INSERT, UPDATE, DELETE)
- Non-members have no access

**Member Tables (vikings_members, jda_members):**
- Users can view their own member record (via user_id)
- Admins have full access

**Core Tables:**
- Profiles: Authenticated users can view all, self-update, admin full access
- Clubs: Public read, admin modify
- Club Memberships: Users see own, admins see all

**Total RLS Policies:** 21 (after cleanup from 43)

**Current Policy Structure:**
- Each table has 1 admin policy (ALL operations)
- Each table has 1 user/member policy (SELECT with appropriate conditions)
- No duplicate or conflicting policies

---

## Stored Procedures

### `get_vikings_rankings(target_season TEXT)`
Calculates Vikings club rankings with week-over-week position changes.

**Returns:**
- `position` (BIGINT) - Current position
- `name` (TEXT) - Player name
- `points` (BIGINT) - Total points
- `games` (BIGINT) - Total games
- `180s` (BIGINT) - Total 180s
- `171s` (BIGINT) - Total 171s
- `average` (NUMERIC) - Calculated average
- `change` (BIGINT) - Position change from previous week

**Usage:**
```sql
SELECT * FROM get_vikings_rankings('1');
```

---

### `get_vikings_handicaps()`
Calculates handicap brackets based on season averages.

**Returns:**
- `name` (TEXT)
- `season_average` (NUMERIC)
- `handicap_start_score` (INTEGER) - 501/451/401/351/301
- `handicap_adjustment` (INTEGER) - 0/-50/-100/-150/-200

**Brackets:**
- 45+ avg: 501 (0)
- 40-44 avg: 451 (-50)
- 35-39 avg: 401 (-100)
- 30-34 avg: 351 (-150)
- <30 avg: 301 (-200)

**Minimum:** 3 sessions required

**Usage:**
```sql
SELECT * FROM get_vikings_handicaps();
```

---

## Database Triggers

### `update_jda_members_updated_at`
**Table:** jda_members  
**Timing:** BEFORE UPDATE  
**Function:** `update_updated_at_column()`

Auto-updates `updated_at` timestamp on row modification.

---

### Trigger Functions

**`handle_new_user()`** - Creates profile on auth signup  
**`notify_admin_on_signup()`** - Creates admin notification on signup  
**`update_updated_at_column()`** - Updates timestamp fields

---

## Indexes

**23 Total Indexes** including:
- Primary keys on all tables
- Unique constraints (email, club names, memberships)
- Performance indexes (user_id, first_name, display_name, dates, read status)

**Key Indexes:**
- `idx_vikings_members_first_name` - Fast name lookups for Vikings
- `idx_jda_members_first_name` - Fast name lookups for JDA
- `idx_jda_members_display_name` - Fast display name lookups for JDA
- `idx_vikings_members_user_id` - Fast user linkage queries
- `idx_jda_members_user_id` - Fast user linkage queries

---

## Foreign Key Relationships

```
profiles (id)
    ↓ CASCADE
club_memberships (user_id, club_id)

profiles (id)
    ↓ SET NULL
vikings_members (user_id)
jda_members (user_id)

clubs (id)
    ↓ CASCADE
club_memberships (club_id)
```

**4 Total Foreign Keys:**
1. club_memberships → profiles (CASCADE)
2. club_memberships → clubs (CASCADE)
3. vikings_members → profiles (SET NULL)
4. jda_members → profiles (SET NULL)

---

## Important Notes

### Key Changes Since Last Update (2025-02-10)
- 🔄 **MAJOR SCHEMA CHANGE**: Split name fields across all member tables
- ✅ `profiles.full_name` → `profiles.first_name` + `profiles.last_name`
- ✅ `vikings_members.name` + `vikings_members.surname` → `first_name` + `last_name`
- ✅ `jda_members` - Complete restructure:
  - `player_name` → `first_name`
  - `full_name` → `display_name`
  - Added `last_name`
  - Removed `season` column (not needed)
- ✅ Created `linked_players` view for unified player-user lookup
- ✅ RLS policies reduced from 43 to 21 (removed duplicates and conflicts)
- ✅ Fixed circular RLS dependency on profiles table
- ✅ Updated indexes to match new column names
- ✅ Member name syncing: Linked users get first_name/last_name from profiles

### Name Field Strategy
- **Member Tables**: Use structured names (first_name, last_name, display_name)
- **Stats Tables**: Keep historical names as-is (preserved for historical accuracy)
- **Profiles**: Always use first_name + last_name (synced to linked members)
- **Naming Convention**: Standardized on `first_name`/`last_name` across all tables for consistency

### Season Data Types
- `vikings_friday.season` - VARCHAR(45)
- `vikings_matches.season` - INTEGER
- Note: `jda_members.season` has been REMOVED

### Average Calculation
```
average = (totalScore / totalDarts) * 3
where: totalScore = (games * 501) - score_left
```

### User Linkage
Both clubs support optional user linking:
- Allows historical data without user accounts
- RLS policies based on membership
- SET NULL on delete preserves historical data
- Names automatically synced from profiles when user_id is linked

### Application Integration Notes
- Sign-up forms now require separate first_name and last_name inputs
- Profile displays should concatenate: `first_name || ' ' || COALESCE(last_name, '')`
- Admin panels should display both first_name and last_name fields
- JDA members use `display_name` for public-facing identifiers
- Vikings members use `first_name` for public-facing identifiers

---

## Database Statistics

- **Tables:** 10 (4 core, 3 Vikings, 3 JDA)
- **Views:** 1 (linked_players)
- **Indexes:** 23
- **Foreign Keys:** 4
- **RLS Policies:** 21 (reduced from 43)
- **Functions:** 5
- **Triggers:** 1

---

**Last Synchronized:** 2025-02-10  
**Next Review:** 2025-03-10

---

**End of DATABASE.md**
