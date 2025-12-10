# DojoFlow CRM Restoration Status

## ✅ Completed
- All 40 pages from backup restored to `/client/src/pages/`
- All components from backup restored to `/client/src/components/`
- All assets (logo.png, images) copied to `/client/src/assets/` and `/client/public/`
- Dependencies installed: react-router-dom, leaflet, react-leaflet, recharts, axios
- Database schema created with students, classes, leads, staff, kiosk tables
- Backend tRPC APIs created for dashboard stats, kiosk stats, Kai AI chat

## 🔧 Pages Needing Adaptation

### High Priority (Core CRM)
1. **Students.tsx** - Full student management (66KB file)
   - Needs: Convert React Router to Wouter
   - Needs: Replace fetch/axios with tRPC queries
   - Status: UI restored, needs backend integration

2. **Leads.tsx** - Lead pipeline management
   - Needs: Convert React Router to Wouter
   - Needs: Replace fetch/axios with tRPC queries
   - Status: Basic version working, needs full restore

3. **Classes.tsx** - Class schedule management (23KB file)
   - Needs: Convert React Router to Wouter
   - Needs: Replace fetch/axios with tRPC queries
   - Status: UI restored, needs backend integration

4. **Staff.tsx** - Staff/instructor management (21KB file)
   - Needs: Convert React Router to Wouter
   - Needs: Replace fetch/axios with tRPC queries
   - Status: UI restored, needs backend integration

5. **Billing.tsx** - Billing and payments
   - Needs: Convert React Router to Wouter
   - Needs: Replace fetch/axios with tRPC queries
   - Status: UI restored, needs backend integration

### Medium Priority
6. **Reports.tsx** - Analytics and reports
7. **Marketing.tsx** - Marketing campaigns
8. **VirtualReceptionist.tsx** - AI receptionist
9. **Kiosk.tsx** - Kiosk management
10. **KioskCheckIn.tsx** - Check-in system (38KB file)

### Low Priority (Support Pages)
11. **Attendance.tsx** - Attendance tracking
12. **InstructorView.tsx** - Instructor dashboard
13. **SetupWizard.tsx** - Initial setup
14. **Pricing.tsx** - Pricing page
15. **SubscriptionDashboard.tsx** - Subscription management

### Already Working
- ✅ **CRMDashboard.tsx** - Main dashboard with PlasmaKai AI (fully functional)
- ✅ **KaiDashboard.tsx** - Circular AI interface (fully functional)
- ✅ **Home.tsx** - Kiosk home page (fully functional)
- ✅ **CheckIn.tsx** - Student check-in (fully functional)

## 🔨 Required Fixes for Each Page

### Pattern 1: React Router → Wouter
```jsx
// OLD (React Router)
import { useNavigate, Link } from 'react-router-dom'
const navigate = useNavigate()
navigate('/students')
<Link to="/students">Students</Link>

// NEW (Wouter)
import { useLocation, Link } from 'wouter'
const [, setLocation] = useLocation()
setLocation('/students')
<Link href="/students">Students</Link>
```

### Pattern 2: Fetch/Axios → tRPC
```jsx
// OLD (Fetch)
const response = await fetch('/api/students')
const data = await response.json()

// NEW (tRPC)
import { trpc } from '@/lib/trpc'
const { data } = trpc.students.list.useQuery()
```

### Pattern 3: TypeScript Types
```tsx
// Add proper TypeScript types for props and state
interface StudentProps {
  onLogout?: () => void
  theme?: string
  toggleTheme?: () => void
}

export default function Students({ onLogout, theme, toggleTheme }: StudentProps) {
  // ...
}
```

## 📋 Next Steps

1. **Immediate**: Test current deployment with restored pages
2. **Phase 1**: Fix Students, Leads, Classes pages (most critical)
3. **Phase 2**: Fix Staff, Billing, Reports pages
4. **Phase 3**: Fix remaining support pages
5. **Phase 4**: Add missing backend APIs as needed

## 🗄️ Database Tables Available
- ✅ students (id, firstName, lastName, email, phone, beltRank, status, etc.)
- ✅ classes (id, name, instructor, schedule, capacity, etc.)
- ✅ leads (id, firstName, lastName, email, phone, status, source, etc.)
- ✅ staff_pins (id, name, pinHash, role, isActive, etc.)
- ✅ kiosk_check_ins (id, studentId, checkInTime, etc.)
- ✅ kiosk_visitors (id, name, email, phone, visitDate, etc.)
- ✅ kiosk_waivers (id, name, email, signedDate, etc.)
- ✅ users (auth system)

## 🔌 Backend APIs Available
- ✅ `trpc.dashboard.getStats` - Dashboard statistics
- ✅ `trpc.dashboard.getLeads` - Leads list
- ✅ `trpc.kiosk.getCheckIns` - Recent check-ins
- ✅ `trpc.kiosk.getVisitors` - Recent visitors
- ✅ `trpc.kiosk.getWaivers` - Recent waivers
- ✅ `trpc.kai.chat` - AI chat with PlasmaKai
- ✅ `trpc.students.list` - Students list
- ✅ `trpc.students.lookupByPhone` - Phone lookup
- ✅ `trpc.students.search` - Name search
- ✅ `trpc.staff.validatePin` - PIN authentication
- ✅ `/api/tts` - ElevenLabs text-to-speech

## 📝 Notes
- Original backup was React + Flask + SQLite
- Current stack is React + TypeScript + Node.js/tRPC + MySQL
- Hybrid approach preserves UI/UX while using modern backend
- All TypeScript errors are expected until pages are adapted
- Server is running and functional despite TS errors
