# DojoFlow TODO

## Phase 1: Design Foundation & Navigation (COMPLETED)
- [x] Bottom navigation bar component (kiosk-friendly, mobile-first)
- [x] Enforce navigation lock - no sidebars allowed
- [x] Dark theme with accent colors (red/orange)
- [x] Responsive layout for tablet and mobile

## Phase 2: Student Card Component - Emotionally Rich (COMPLETED)
- [x] Student card base component with avatar
- [x] Belt strip visual indicator (colored bands)
- [x] Attendance ring/progress circle
- [x] Progress bars for promotion readiness
- [x] Small student timeline (class history)
- [x] Promotion readiness badge
- [x] Parent/contact role clarity display
- [x] Student card hover/interaction states
- [x] Fix StudentCard getInitials error with undefined firstName/lastName

## Phase 3: Dojo Dashboard (COMPLETED)
- [x] Command center tiles layout
- [x] Quick stats (active students, classes today, etc.)
- [x] Student roster view with rich cards
- [x] Class schedule view
- [x] Attendance tracking interface
- [x] Quick actions menu

## Phase 4: Student Management Features (COMPLETED)
- [x] Create new student form
- [x] Edit student profile
- [x] Student details modal/drawer
- [x] Bulk enrollment interface
- [x] Student search and filter
- [x] Archive/deactivate student

## Phase 5: Attendance & Tracking (COMPLETED)
- [x] Class attendance check-in
- [x] Attendance history view
- [x] Attendance percentage calculation
- [x] Attendance ring visualization

## Phase 6: Belt Promotion System (COMPLETED)
- [x] Belt level tracking (White, Yellow, Orange, Green, Blue, Brown, Black)
- [x] Progress tracking toward next belt
- [x] Class requirements display
- [x] Attendance requirements display
- [x] Promotion eligibility indicator
- [x] Belt test registration interface
- [x] Promotion history timeline

## Phase 7: Testing & Validation (COMPLETED)
- [x] Fix StudentCard getInitials error with undefined firstName/lastName
- [x] Verify all data bindings work correctly
- [x] Test routing to student profile
- [x] Test search functionality
- [x] Test filter functionality
- [x] Test quick action handlers
- [x] Verify no regressions from original functionality
- [x] Test empty state design
- [x] Create comprehensive vitest tests for StudentCommandBar
- [x] Create comprehensive vitest tests for StudentCard
- [x] Create comprehensive vitest tests for StudentFilters
- [x] Create comprehensive vitest tests for OperationalIndicators

## Phase 8: Instructor Features
- [ ] Instructor dashboard
- [ ] Class management
- [ ] Student evaluation notes
- [ ] Attendance marking interface

## Phase 9: Parent/Contact Management
- [ ] Parent/contact information storage
- [ ] Parent portal (future)
- [ ] Contact role clarity (mother, father, guardian, etc.)

## Phase 10: Data Models & Database
- [x] Student table with belt tracking
- [x] Belt progress table
- [x] Class enrollments table
- [x] Attendance tracking table
- [x] Belt tests table
- [ ] Verify all relationships are correct
- [ ] Create indexes for performance

## Phase 11: Authentication & Authorization
- [x] User authentication system
- [ ] Role-based access control (owner, staff, instructor, student)
- [ ] Protected routes for authenticated users

## Phase 12: Performance & Optimization
- [ ] Lazy load student cards
- [ ] Optimize database queries
- [ ] Image optimization for belt visuals

## Phase 13: Deployment & Hosting
- [ ] Environment configuration
- [ ] Database migrations
- [ ] Initial checkpoint before first delivery

## Phase 14: Student Page Redesign (Apple-Style Command UI)

### Visual System & Foundation
- [x] Implement Apple-style glass panels with backdrop blur and soft shadows
- [x] Establish typography hierarchy (larger headings, refined scale)
- [x] Define color palette (dark glass backgrounds, minimal accent colors)
- [x] Create subtle depth system (soft transitions, light reflection edges)
- [x] Implement soft hover effects and lift animations

### Command Center Redesign
- [x] Reduce to 4 core signals: Total Students, Active, At Risk, Inactive
- [x] Style signals as soft glass cards with minimal borders
- [x] Implement smooth hover effects on command center tiles

### Student Roster Redesign
- [x] Establish roster as visual hero (dominant screen presence)
- [x] Enhance table rows with soft styling and better visual hierarchy
- [x] Remove heavy framing, soften containers with glass panels
- [x] Maintain multi-view support: List, Map, Segments, Analytics
- [x] Improve row styling with better avatars and typography

### Interactions & Polish
- [x] Implement floating search bar with blur effect
- [x] Add blurred filter bar with glass styling
- [x] Implement soft hover lift on table rows
- [x] Minimize borders throughout (use soft white/10 borders)
- [x] Create subtle motion and transitions
- [x] Enhanced avatar styling with rings and transitions

### Architecture Validation
- [x] Verify bottom navigation remains intact
- [x] Confirm no sidebars reintroduced
- [x] Validate responsive layout across breakpoints
- [x] Test on mobile, tablet, desktop

### Testing & Delivery
- [x] Responsive design validation (mobile, tablet, desktop)
- [x] Performance check (glass blur effects, animations)
- [x] Accessibility review (contrast, focus states)
- [x] Save checkpoint with redesigned Student page


## Phase 15: Students Page Refinement (Apple-Style Dojo OS)

### Status Strip & Metrics
- [x] Slim status strip with soft glass containers
- [x] Subtle glow on "Active" and "At Risk" indicators
- [x] Minimal height, frosted effect styling

### Student Card Redesign
- [x] Convert roster rows into true premium cards
- [x] Add belt-colored ring around avatar
- [x] Display attendance streak with 🔥 emoji
- [x] Show "Last seen" timestamp
- [x] Add progress bar toward next belt
- [x] Implement quick action buttons (phone, chat, email, more)
- [x] Soft hover lift and glow effects
- [x] Glass blur and minimal borders

### View Modes Enhancement
- [x] Emphasize List, Map, Segments, Analytics as first-class modes
- [x] Ensure each mode feels like a distinct product feature
- [x] Maintain smooth transitions between modes

### Floating Search & Filter
- [x] Floating blurred search bar (OS-like toolbar)
- [x] Integrated filters (not boxed dropdowns)
- [x] Soft pill buttons for filter options
- [x] Minimal borders throughout

### Martial Arts Identity
- [x] Belt color system integration
- [x] Progress toward next rank visualization
- [x] Promotion readiness visual indicators
- [x] Calm, ceremonial feel (not CRM-like)

### Motion & Interactions
- [x] Soft hover elevation on cards
- [x] Light blur transitions
- [x] Status glow effects
- [x] No hard snapping, smooth OS-like movement
- [x] Refined animation timing

### Final Validation
- [x] Verify bottom navigation intact
- [x] No left sidebar regression
- [x] Student roster is visual hero
- [x] Calm aesthetic maintained
- [x] People > metrics focus
- [x] Test across all breakpoints
- [x] Save final checkpoint

## Bug Fixes

- [x] Fixed duplicate `classes` router causing TRPC JSON parsing error on /owner page
  - Removed duplicate `classes` router definition at line 823 (simple version)
  - Kept the comprehensive `classes` router at line 4253 with all functionality
  - This was causing requests to fall through to Vite catch-all middleware and return HTML instead of JSON

## Testing & Demo Data

- [x] Add fake student with photo for testing purposes

- [x] Fixed database query error on /students?filter=needs-attention page
  - Removed query for non-existent `student_cancellation_requests` table
  - Removed query for non-existent `student_tuition` table
  - Fixed `getAnalytics` TRPC procedure to only query existing tables
  - Page now loads successfully with KPI metrics displaying correctly
