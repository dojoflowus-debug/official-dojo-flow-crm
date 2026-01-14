# 🆘 SETUP WIZARD RECOVERY GUIDE

## If Setup Wizard Files Are Lost or Broken

### Quick Recovery (Recommended)

**Step 1: Check Git Tags**
```bash
cd /home/ubuntu/dojoflow-kiosk
git tag -l
```

You should see:
- `setup-wizard-complete` (current version)
- `setup-wizard-original` (backup version)

**Step 2: Restore from Tag**
```bash
# Option A: Restore from current complete version
git checkout setup-wizard-complete -- client/src/pages/SetupWizard.tsx
git checkout setup-wizard-complete -- client/src/components/setup-wizard/
git checkout setup-wizard-complete -- client/src/lib/voiceService.ts
git checkout setup-wizard-complete -- client/src/components/KaiCaptions.tsx

# Option B: Restore from original version (if current is broken)
git checkout setup-wizard-original -- client/src/pages/SetupWizard.tsx
git checkout setup-wizard-original -- client/src/components/setup-wizard/
git checkout setup-wizard-original -- client/src/lib/voiceService.ts
git checkout setup-wizard-original -- client/src/components/KaiCaptions.tsx
```

**Step 3: Verify Files Exist**
```bash
ls -la client/src/pages/SetupWizard.tsx
ls -la client/src/components/setup-wizard/
ls -la client/src/lib/voiceService.ts
ls -la client/src/components/KaiCaptions.tsx
```

**Step 4: Restart Dev Server**
```bash
pnpm dev
```

**Step 5: Test Setup Wizard**
- Navigate to `/setup` in your browser
- Verify welcome screen appears
- Test voice selection
- Test Kai appearance selection
- Test industry selection

---

## Recovery from Commit Hash

If git tags are lost, use commit hashes:

```bash
# Primary backup point
git checkout 6bb01d06 -- client/src/pages/SetupWizard.tsx client/src/components/setup-wizard/ client/src/lib/voiceService.ts client/src/components/KaiCaptions.tsx

# Original backup point
git checkout 92f90c2a -- client/src/pages/SetupWizard.tsx client/src/components/setup-wizard/ client/src/lib/voiceService.ts client/src/components/KaiCaptions.tsx
```

---

## Find Setup Wizard in Git History

If you don't know the commit hash:

```bash
# Search for Setup Wizard commits
git log --all --oneline | grep -i "setup"
git log --all --oneline | grep -i "wizard"
git log --all --oneline | grep -i "voice"
git log --all --oneline | grep -i "kai"

# Show commits that modified SetupWizard.tsx
git log --all --oneline -- client/src/pages/SetupWizard.tsx

# Show detailed history
git log --all --stat -- client/src/pages/SetupWizard.tsx
```

---

## Verify File Integrity

After recovery, check that files are not empty:

```bash
# Check file sizes (should be > 0 bytes)
wc -l client/src/pages/SetupWizard.tsx
wc -l client/src/components/setup-wizard/*.tsx
wc -l client/src/lib/voiceService.ts
wc -l client/src/components/KaiCaptions.tsx

# Expected line counts (approximate):
# SetupWizard.tsx: ~700+ lines
# Step files: ~200-400 lines each
# voiceService.ts: ~100+ lines
# KaiCaptions.tsx: ~80+ lines
```

---

## Rollback Protection

**Before any rollback operation:**

1. **Check current state first:**
```bash
git status
git log --oneline -10
```

2. **Create safety branch:**
```bash
git branch safety-backup-$(date +%Y%m%d-%H%M%S)
```

3. **Verify target commit has Setup Wizard:**
```bash
git show COMMIT_HASH:client/src/pages/SetupWizard.tsx | head -20
```

4. **Only rollback if target has the files you need**

---

## Emergency: Complete Project Rollback

If entire project is broken:

```bash
# Rollback to setup-wizard-complete tag
git reset --hard setup-wizard-complete

# Or rollback to specific commit
git reset --hard 6bb01d06

# Restart server
pnpm dev
```

**⚠️ WARNING:** This will lose ALL uncommitted changes!

---

## Prevention Checklist

Before making major changes:

- [ ] Create checkpoint: `webdev_save_checkpoint`
- [ ] Create git tag: `git tag -a my-milestone -m "Description"`
- [ ] Verify files exist: `ls -la client/src/pages/SetupWizard.tsx`
- [ ] Test in browser: Visit `/setup`
- [ ] Document changes in SETUP_WIZARD_BACKUP.md

---

## Contact for Help

If recovery fails:

1. Check `SETUP_WIZARD_BACKUP.md` for detailed file information
2. Check `CRITICAL_FILES.md` for file list
3. Search git history for Setup Wizard commits
4. Use git tags: `setup-wizard-complete` or `setup-wizard-original`
5. Restore from commit: `6bb01d06` or `92f90c2a`

---

## Success Indicators

After recovery, you should see:

✅ Welcome screen with Kai greeting  
✅ Terms & Conditions acceptance page  
✅ Voice selection (male/female with waveforms)  
✅ Kai appearance selection (3 options)  
✅ Industry selection (5 industries)  
✅ Voice plays using ElevenLabs or Web Speech  
✅ Captions display below Kai's orb  
✅ Progress indicator shows "Step 1 of 8"  

---

**Last Updated:** 2025-01-17  
**Protected Commits:** 92f90c2a, 6bb01d06  
**Git Tags:** setup-wizard-original, setup-wizard-complete  
