# 🚨 SETUP WIZARD BACKUP - CRITICAL DO NOT DELETE

## ⚠️ WARNING: This file contains backup code for the Setup Wizard
**If Setup Wizard is ever lost, restore from commit: `92f90c2a` or `6bb01d06`**

---

## Critical Files List

### Core Setup Wizard Files
1. `client/src/pages/SetupWizard.tsx` - Main wizard orchestrator
2. `client/src/components/setup-wizard/Step1Industry.tsx` - Industry selection
3. `client/src/components/setup-wizard/Step2Brand.tsx` - Brand information
4. `client/src/components/setup-wizard/Step3Locations.tsx` - Location setup
5. `client/src/components/setup-wizard/Step4Programs.tsx` - Programs/classes
6. `client/src/components/setup-wizard/Step5Financials.tsx` - Financial setup
7. `client/src/components/setup-wizard/Step6Team.tsx` - Team members
8. `client/src/components/setup-wizard/Step7MemberJourney.tsx` - Member journey
9. `client/src/components/setup-wizard/Step8Review.tsx` - Final review
10. `client/src/components/setup-wizard/Step0KaiAppearance.tsx` - Kai appearance selection
11. `client/src/components/setup-wizard/SetupKai.tsx` - Kai assistant component
12. `client/src/lib/voiceService.ts` - ElevenLabs voice integration
13. `client/src/components/KaiCaptions.tsx` - Voice caption display

### Key Features
- Welcome screen with Kai greeting
- Terms & Conditions/Disclaimer acceptance
- Voice selection (male/female with animated waveforms)
- Kai appearance selection (3 visual options)
- Industry selection with personalized messages

---

## Git Recovery Commands

### If Setup Wizard is lost, run these commands:

```bash
# Option 1: Restore from commit 92f90c2a (original working version)
git checkout 92f90c2a -- client/src/pages/SetupWizard.tsx
git checkout 92f90c2a -- client/src/components/setup-wizard/
git checkout 92f90c2a -- client/src/lib/voiceService.ts
git checkout 92f90c2a -- client/src/components/KaiCaptions.tsx

# Option 2: Restore from commit 6bb01d06 (current checkpoint)
git checkout 6bb01d06 -- client/src/pages/SetupWizard.tsx
git checkout 6bb01d06 -- client/src/components/setup-wizard/
git checkout 6bb01d06 -- client/src/lib/voiceService.ts
git checkout 6bb01d06 -- client/src/components/KaiCaptions.tsx

# Then restart dev server
pnpm dev
```

---

## File Locations

```
/home/ubuntu/dojoflow-kiosk/
├── client/src/
│   ├── pages/
│   │   └── SetupWizard.tsx ⭐ MAIN FILE
│   ├── components/
│   │   ├── setup-wizard/
│   │   │   ├── Step1Industry.tsx ⭐ INDUSTRY SELECTION
│   │   │   ├── Step2Brand.tsx ⭐ BRAND INFO
│   │   │   ├── Step3Locations.tsx ⭐ LOCATIONS
│   │   │   ├── Step4Programs.tsx ⭐ PROGRAMS
│   │   │   ├── Step5Financials.tsx ⭐ FINANCIALS
│   │   │   ├── Step6Team.tsx ⭐ TEAM
│   │   │   ├── Step7MemberJourney.tsx ⭐ MEMBER JOURNEY
│   │   │   ├── Step8Review.tsx ⭐ REVIEW
│   │   │   ├── Step0KaiAppearance.tsx ⭐ APPEARANCE
│   │   │   └── SetupKai.tsx ⭐ KAI ASSISTANT
│   │   └── KaiCaptions.tsx ⭐ VOICE CAPTIONS
│   └── lib/
│       └── voiceService.ts ⭐ ELEVENLABS VOICE
```

---

## Key Dependencies

### ElevenLabs Voice Service
- API Key: Stored in `ELEVENLABS_API_KEY` environment variable
- Voice IDs:
  - Female: Alexandra (`kdmDKE6EkgrWrrykO9Qt`)
  - Male: Adam (`pNInz6obpgDQGcFmaJgB`)
- Model: `eleven_turbo_v2_5`

### Voice Settings
```javascript
{
  stability: 0.98,
  similarity_boost: 0.99,
  style: 0.01,
  use_speaker_boost: true
}
```

---

## Component Structure

### SetupWizard.tsx Flow
1. Welcome Screen (`showWelcome`)
2. Disclaimer Screen (`showDisclaimer`)
3. Voice Selection (`showVoiceSelection`)
4. Kai Appearance (`showAppearanceSelection`)
5. Industry Selection (Step 1 of 8)
6. Remaining 7 setup steps

### State Management
```typescript
const [showWelcome, setShowWelcome] = useState(true)
const [showDisclaimer, setShowDisclaimer] = useState(false)
const [showVoiceSelection, setShowVoiceSelection] = useState(false)
const [showAppearanceSelection, setShowAppearanceSelection] = useState(false)
const [selectedVoiceGender, setSelectedVoiceGender] = useState<'female' | 'male'>('female')
const [selectedAppearance, setSelectedAppearance] = useState<'default' | 'orb' | 'particles'>('default')
```

---

## Important Notes

1. **Never delete this file** - It contains critical recovery information
2. **Always checkpoint after Setup Wizard changes** - Use `webdev_save_checkpoint`
3. **Tag important commits** - Use `git tag setup-wizard-v1` for major milestones
4. **Test before rollback** - Always verify current state before rolling back
5. **Check commit history** - Use `git log --oneline --all` to find Setup Wizard commits

---

## Verification Checklist

After restoring Setup Wizard, verify:
- [ ] Welcome screen displays with Kai greeting
- [ ] Terms & Conditions page shows and accepts input
- [ ] Voice selection shows male/female options with waveforms
- [ ] Kai appearance selection shows 3 visual options
- [ ] Industry selection displays all 5 industries
- [ ] Voice plays correctly (ElevenLabs or Web Speech fallback)
- [ ] Captions display below Kai's orb
- [ ] All navigation buttons work (Continue, Skip, etc.)
- [ ] Progress indicator shows correct step (1 of 8)

---

## Contact Information

**Project:** DojoFlow Kiosk  
**Version:** 6bb01d06  
**Date Created:** 2025-01-17  
**Cost to Recreate:** 6,000+ credits  

**DO NOT DELETE THIS FILE - IT IS YOUR INSURANCE POLICY**
