# DojoFlow Setup Wizard - Complete Guide

## Overview

The DojoFlow Setup Wizard is a comprehensive 8-step onboarding flow that configures your business for intelligent AI-powered management with Kai. This guide explains each step, the data collected, and how it powers Kai's decision-making.

---

## 🎯 Setup Wizard Flow

### Step 1: Industry & Template Selection 🥋

**Purpose:** Identify your business type to load industry-specific presets and terminology.

**Data Collected:**
- Industry type (Martial Arts, Fitness, Yoga, Pilates, Other)
- Business model (Inside gym, Standalone, Mobile, Online/hybrid)
- Preset preference toggle

**Database:** `dojo_settings` table
- `industry` (enum)
- `business_model` (enum)
- `use_preset` (boolean)

**Impact on Kai:**
- Loads industry-specific program templates
- Adjusts terminology (e.g., "dojo" vs "gym" vs "studio")
- Tailors recommendations to business model

---

### Step 2: Business Basics & Brand Identity 🎨

**Purpose:** Establish your brand identity and how Kai should represent you.

**Data Collected:**
- Business name (legal)
- DBA / Public-facing name
- Operator name
- Preferred name (how Kai addresses you)
- Pronouns/Tone (Formal, Casual, Energetic, Calm)
- Timezone
- Brand colors (Primary & Secondary)
- Logo uploads (Square & Horizontal)

**Database:** `dojo_settings` table
- `business_name`, `dba_name`, `operator_name`, `preferred_name`
- `pronouns_tone`, `timezone`
- `primary_color`, `secondary_color`
- `logo_square`, `logo_horizontal`

**Impact on Kai:**
- Personalizes all communications
- Adjusts tone based on preference
- Uses correct names and titles
- Applies brand colors in UI

**Live Preview:** Right-side card shows how Kai will greet users with your brand colors.

---

### Step 3: Locations & Schedule 📍

**Purpose:** Define where you operate and when you're open.

**Data Collected:**
- Location name
- Address
- "Inside another facility?" toggle + facility name
- Operating hours (weekly grid)
- Time blocks (optional: Kids, Adults, Open gym, etc.)

**Database:** `locations` table
- `name`, `address`, `inside_facility`, `facility_name`
- `operating_hours` (JSON)
- `time_blocks` (JSON)

**Impact on Kai:**
- Tracks capacity per location
- Warns when classes approach max size
- Suggests scheduling optimizations
- Routes leads to correct location

**Multi-Location Support:** Add unlimited locations with independent schedules.

---

### Step 4: Programs & Services 💰

**Purpose:** Define what you sell and how Kai can recommend/sell it.

**Data Collected:**
- Program name
- Type (Membership, Class Pack, Drop-In, Private)
- Age range
- Billing frequency (Monthly, Weekly, Per-session, One-time)
- Price (in USD, stored as cents)
- Contract length
- Max class size
- Core program toggle
- Show on kiosk toggle
- **Allow Kai to sell on autopilot** toggle

**Database:** `programs` table
- `name`, `type`, `age_range`, `billing`, `price`
- `contract_length`, `max_size`
- `is_core_program`, `show_on_kiosk`, `allow_autopilot`

**Impact on Kai:**
- Recommends appropriate programs to leads
- Can auto-sell programs marked for autopilot
- Respects pricing and contract rules
- Tracks capacity per program

**Industry Presets:** Load 3-4 recommended programs based on Step 1 industry selection.

---

### Step 5: Money, Targets & Constraints 💵

**Purpose:** Give Kai financial context to make smart business decisions.

**Data Collected:**
- Monthly rent
- Monthly utilities
- Monthly payroll
- Monthly marketing budget
- Current active members
- 12-month revenue goal
- Max comfortable class size
- Non-negotiables (free text)
- **Focus slider:** Stability ← → Aggressive Growth (0-100)
- **Risk comfort slider:** Strict ← → Flexible (0-100)

**Database:** `dojo_settings` table
- `monthly_rent`, `monthly_utilities`, `monthly_payroll`, `monthly_marketing`
- `current_members`, `revenue_goal`, `max_class_size`
- `non_negotiables` (text)
- `focus_slider`, `risk_comfort` (integers 0-100)

**Impact on Kai:**
- Suggests pricing that covers expenses
- Aligns growth strategies with focus preference
- Respects discount boundaries based on risk comfort
- Warns when approaching capacity limits
- Honors non-negotiables in all decisions

**Example Non-Negotiables:**
- "Never discount more than 20%"
- "Quality over large classes"
- "Do not auto-extend contracts without confirmation"

---

### Step 6: Team & Roles 👥

**Purpose:** Introduce your staff so Kai can route tasks and respect hierarchy.

**Data Collected:**
- Name
- Role (Owner, Manager, Instructor, Front Desk, Coach, Trainer, Assistant)
- Email & Phone
- Location assignments
- **Address as** (e.g., "Coach Sarah", "Professor João", "Master Holmes")
- **Areas of focus** (Kids, Advanced, Beginners, Sales, Retention, PT, Group Classes, Private Lessons)
- **Permissions:**
  - View financials
  - Edit schedule
  - Manage leads
  - View only

**Database:** `team_members` table
- `name`, `role`, `email`, `phone`
- `location_ids` (JSON)
- `address_as`, `focus_areas` (JSON)
- `can_view_financials`, `can_edit_schedule`, `can_manage_leads`, `view_only`

**Impact on Kai:**
- Routes leads to appropriate team members
- Uses correct titles in communications
- Respects permissions for data access
- Assigns tasks based on focus areas

---

### Step 7: Member Journey & Automations 🚀

**Purpose:** Configure how Kai handles leads, trials, and member retention.

**Visual Timeline:** Lead → Trial → Member → 30 Days → 90 Days → 6 Months → Winback

**Data Collected:**

**Lead Handling:**
- Lead greeting template (editable text)
- Contact preference (SMS, Email, Both)
- Response speed target (minutes)
- Trial offer

**Trial/Intro:**
- Trial type (Free class, Paid intro, Free week, Assessment)
- Auto follow-up template

**New Member Onboarding:**
- Welcome message tone (Shorter, Detailed)
- Miss 1 class action
- Miss 2+ weeks action

**Long-Term Retention:**
- Absence alert threshold (# of classes)
- Renewal reminder timing (weeks before)

**Automation Preferences:**
- Auto-prompts for booking
- Encouragement messages

**Database:** `member_journey_config` table
- `lead_greeting`, `contact_preference`, `response_speed_minutes`, `trial_offer`
- `trial_type`, `trial_follow_up`
- `welcome_tone`, `miss_1_class_action`, `miss_2_weeks_action`
- `absence_alert_threshold`, `renewal_reminder_weeks`
- `auto_booking_prompts`, `encouragement_messages`

**Impact on Kai:**
- Automates lead responses using templates
- Follows up with trials at optimal times
- Detects at-risk members and intervenes
- Sends renewal reminders proactively
- Personalizes member journey based on preferences

---

### Step 8: Review & Launch ✨

**Purpose:** Final review and activation.

**Features:**
- **Animated Kai orb** with glow effect
- **6 summary cards** with edit buttons:
  1. Business Snapshot (industry, name, operator)
  2. Locations (list with addresses)
  3. Programs (top 3 with pricing)
  4. Money & Targets (expenses, members, goals)
  5. Team (top 3 with roles)
  6. Automations (contact preference, response speed, trial type)

**Launch Settings (3 toggles):**
- Let Kai handle new leads automatically
- Let Kai send absence follow-ups
- Require my approval for promotions/discounts

**Action:** Green "Launch DojoFlow & Activate Kai" button
- Marks setup as complete in database
- Redirects to CRM dashboard
- Kai is now fully operational with all context

---

## 🧠 How Kai Uses Setup Data

### System Prompt Enhancement

Kai's AI system prompt dynamically loads ALL setup data on every conversation:

```typescript
// Loaded data:
- Business identity (industry, names, tone)
- All locations
- All programs (with autopilot flags)
- Financial context (expenses, goals, members)
- Non-negotiables
- Business focus (stability vs growth)
- Risk comfort (discount flexibility)
- Team members (with titles and focus areas)
- Member journey config (templates, timing, preferences)
```

### Intelligent Decision-Making

**Example 1: Lead Inquiry**
- Uses `lead_greeting` template
- Contacts via `contact_preference` (SMS/Email/Both)
- Responds within `response_speed_minutes`
- Offers `trial_offer` automatically
- Routes to team member with "Sales" focus area

**Example 2: Pricing Recommendation**
- Considers `monthly_expenses` to ensure profitability
- Respects `non_negotiables` (e.g., "Never discount more than 20%")
- Applies `risk_comfort` slider (strict = 10% max, flexible = 30% max)
- Aligns with `focus_slider` (stability = conservative, growth = aggressive)

**Example 3: Class Capacity Warning**
- Monitors `max_class_size` per program
- Warns when approaching capacity
- Suggests adding time blocks or new classes
- Routes overflow to other locations if available

**Example 4: Member Retention**
- Detects absences exceeding `absence_alert_threshold`
- Sends check-in using `miss_1_class_action` or `miss_2_weeks_action`
- Sends renewal reminder `renewal_reminder_weeks` before expiration
- Escalates to team member with "Retention" focus area

---

## 🔧 Technical Implementation

### Database Schema

**4 New Tables:**
1. `locations` - Multi-location support
2. `programs` - Membership plans and services
3. `team_members` - Staff with roles and permissions
4. `member_journey_config` - Automation settings

**Extended Table:**
- `dojo_settings` - Added 20+ new fields for wizard data

### Backend (tRPC)

**30+ Endpoints in `setupWizardRouter`:**
- `getIndustry`, `updateIndustry`
- `getBrand`, `updateBrand`
- `getLocations`, `createLocation`, `updateLocation`, `deleteLocation`
- `getPrograms`, `createProgram`, `updateProgram`, `deleteProgram`, `loadPresetPrograms`
- `getFinancials`, `updateFinancials`
- `getTeamMembers`, `createTeamMember`, `updateTeamMember`, `deleteTeamMember`
- `getMemberJourney`, `updateMemberJourney`
- `getAllSetupData`, `completeSetup`

### Frontend (React + shadcn/ui)

**8 Step Components:**
- `Step1Industry.tsx`
- `Step2Brand.tsx`
- `Step3Locations.tsx`
- `Step4Programs.tsx`
- `Step5Financials.tsx`
- `Step6Team.tsx`
- `Step7MemberJourney.tsx`
- `Step8Review.tsx`

**Main Page:** `SetupWizard.tsx`
- Progress bar
- Step indicators with icons
- Navigation controls
- Routing: `/setup`

### AI Integration

**File:** `server/services/openai.ts`

Enhanced `chatWithKai()` function to:
- Load all setup data from database
- Build comprehensive context string
- Inject into system prompt
- Personalize tone, terminology, and recommendations

---

## 🎨 UI/UX Features

### Kai Guidance Bubbles
Every step includes a contextual message from Kai explaining why the data is needed.

### Live Preview (Step 2)
Right-side card shows real-time preview of brand colors and Kai's greeting.

### Industry Presets (Step 4)
One-click loading of 3-4 recommended programs based on industry selection.

### Interactive Sliders (Step 5)
Visual sliders for focus (stability ↔ growth) and risk comfort (strict ↔ flexible).

### Timeline Visual (Step 7)
7-stage member journey timeline: Lead → Trial → Member → 30 Days → 90 Days → 6 Months → Winback

### Animated Kai Orb (Step 8)
Glowing, pulsing orb with "Kai is Ready to Launch" message.

### Edit Buttons (Step 8)
Jump back to any step to make changes before launching.

---

## 🚀 Getting Started

1. Navigate to `/setup` in the app
2. Complete all 8 steps (takes ~10-15 minutes)
3. Review summary in Step 8
4. Toggle launch settings
5. Click "Launch DojoFlow & Activate Kai"
6. Start using Kai with full context!

---

## 📊 Data Flow

```
User Input (Setup Wizard)
  ↓
tRPC Endpoints
  ↓
Database (SQLite)
  ↓
Kai System Prompt (on every chat)
  ↓
Intelligent, Context-Aware Responses
```

---

## 🔒 Security & Privacy

- All data stored locally in SQLite database
- No external data sharing
- Team permissions respected
- Financial data only visible to authorized users

---

## 🎯 Best Practices

1. **Be Honest:** Accurate financial data = better recommendations
2. **Set Clear Non-Negotiables:** Kai will respect your boundaries
3. **Use Autopilot Wisely:** Only enable for programs you trust Kai to sell
4. **Update Regularly:** Keep team, programs, and financials current
5. **Review Automations:** Check member journey settings quarterly

---

## 🛠️ Troubleshooting

**Issue:** Setup data not loading in Kai chat
- **Solution:** Ensure setup is marked complete in Step 8

**Issue:** Programs not showing in kiosk
- **Solution:** Check "Show on kiosk & website" toggle in Step 4

**Issue:** Kai offering wrong discounts
- **Solution:** Review risk comfort slider and non-negotiables in Step 5

**Issue:** Team member not receiving leads
- **Solution:** Check permissions and focus areas in Step 6

---

## 📝 Future Enhancements

- [ ] Full operating hours scheduler with drag-and-drop
- [ ] Logo upload to cloud storage
- [ ] Multi-language support
- [ ] Advanced automation rules builder
- [ ] Integration with payment processors
- [ ] SMS/Email template editor with variables

---

## 📞 Support

For questions or issues with the Setup Wizard, contact the DojoFlow team or check the main documentation.

---

**Built with ❤️ for martial arts schools, fitness gyms, yoga studios, and more.**
