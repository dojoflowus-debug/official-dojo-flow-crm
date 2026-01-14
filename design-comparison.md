# Kai Chat Design Comparison - Original vs Current

## Key Design Differences to Fix

### 1. Left Sidebar (Dark)
**Original:**
- DojoFlow logo: Coral/salmon swirl icon with "DojoFlow" text
- Navigation items have "⋮⋮" drag handles on the left
- Active item (Kai Command) has coral/rose background with rounded corners
- Settings has chevron for expand
- User profile at bottom with avatar photo, name, email

**Current Issues:**
- Missing drag handles (⋮⋮) on nav items
- Logo icon is MessageSquare instead of swirl
- Need to match exact coral color (#E85A6B or similar)

### 2. Top Bar
**Original:**
- "Dashboard" title on left
- Right side: "Sidebar" button (coral when active), "Top Menu" button, "Credits: 0" in green, notification bell, eye icon, more icons
- Sidebar button has coral background when sidebar is visible

**Current Issues:**
- Mostly matches, minor color tweaks needed

### 3. Command Center (Light Gray Panel)
**Original:**
- Header: hamburger menu icon, "Command Center" text, checkbox icon, plus icon, "New Chat" button (coral)
- Search bar with placeholder
- Tabs: Active/Archived/All with pill style
- Smart Collections with icons (clock, sparkles, checkbox) and counts in gray pills
- Recent Conversations header with count "15"
- Conversation cards: white background, title truncated, timestamp, preview text, tags (kai/growth/billing in colored pills), status pill, "In Progress" with clock icon

**Current Issues:**
- Need hamburger icon before "Command Center"
- Conversation cards need exact styling match
- Tag colors: kai=blue, growth=green, billing=purple

### 4. Main Conversation Panel (White)
**Original:**
- Top banner: uppercase text, action icons on right (document, users, speaker, maximize, eye)
- Center: Large Kai logo (coral swirl), "Hi, I'm Kai." heading, description text
- Suggested prompts: 3 cards with headers (START WITH YOUR GOALS, CHECK HEALTH OF YOUR DOJO, FIX BILLING & RENEWALS) and example text
- Input bar: rounded, attachment icon, textarea, mic icon, send button (coral)
- Disclaimer: "Kai can make mistakes..."

**Current Issues:**
- Missing the Kai swirl logo in center
- Missing suggested prompt cards with headers
- Need to add the 3 prompt cards layout

### 5. Colors to Match
- Coral/Rose primary: #E85A6B or similar
- Sidebar dark: #1E293B (slate-800/900)
- Command center bg: #F8FAFC (slate-50)
- White panel: #FFFFFF
- Green credits: #10B981 (emerald-500)
- Tag colors:
  - kai: light blue bg, blue text
  - growth: light green bg, green text  
  - billing: light purple bg, purple text
  - neutral: light gray bg, gray text
  - attention: light orange/yellow bg

### 6. Typography
- DojoFlow logo: Bold, ~18px
- Nav items: Medium weight, ~14px
- Command Center header: Semibold, ~16px
- Section headers: Uppercase, xs, tracking-wider
- Conversation titles: Medium, ~14px
- "Hi, I'm Kai.": Large heading, ~32px
- Prompt headers: Uppercase, small, coral color
