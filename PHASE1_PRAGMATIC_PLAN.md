# Phase 1: Pragmatic Type System Cleanup

**Status:** Analysis Complete  
**Total TS Errors:** 1047  
**Strategy:** Targeted fixes on critical blockers, not full refactor

---

## Error Distribution

| Category | Count | Priority | Strategy |
|----------|-------|----------|----------|
| TS2339 (Property not found) | 494 | HIGH | Type guards, optional chaining |
| TS2322 (Type mismatch) | 122 | HIGH | Boundary mappers |
| TS7006 (Implicit any param) | 77 | MEDIUM | Add type annotations |
| TS2769 (Overload mismatch) | 77 | MEDIUM | Fix function signatures |
| TS2345 (Argument type) | 58 | HIGH | Type narrowing |
| TS7031 (Implicit any binding) | 35 | MEDIUM | Destructure with types |
| TS2304 (Name not found) | 29 | HIGH | Import/export fixes |
| TS7016 (No .d.ts file) | 23 | LOW | Create .d.ts or ignore |

---

## Top Problem Files

| File | Errors | Root Cause | Fix Strategy |
|------|--------|-----------|--------------|
| Students.tsx | 102 | JSX imports, implicit any params | Add .d.ts for JSX imports, type params |
| Classes.tsx | 72 | Schema property mismatches | Fix schema references |
| routers.ts | 60 | DB query type mismatches | Add proper return types |
| setupWizardRouter.ts | 55 | Missing types on responses | Type all responses |
| Dashboard.tsx | 47 | Component prop types | Type component props |
| db.ts | 36 | Query builder return types | Type queries properly |

---

## Critical Blockers to Fix First

### 1. JSX Import Declarations (TS7016)
**Files:** Students.tsx, Classes.tsx, etc.  
**Issue:** JSX components imported without .d.ts  
**Fix:** Create simple .d.ts files for JSX components

### 2. Implicit Any Parameters (TS7006, TS7031)
**Files:** Students.tsx, Classes.tsx  
**Issue:** Callback parameters missing types  
**Fix:** Add explicit type annotations to all callbacks

### 3. DB Query Return Types (TS2339, TS2345)
**Files:** routers.ts, db.ts  
**Issue:** Query results not properly typed  
**Fix:** Add explicit return types to query functions

### 4. Schema Property Access (TS2339)
**Files:** routers.ts  
**Issue:** Accessing properties that don't exist on schema tables  
**Fix:** Verify schema definitions match usage

---

## Execution Plan

### Phase 1a: Quick Wins (30 min)
1. Create .d.ts for JSX imports (AddressAutocomplete, PhoneInput)
2. Add type annotations to callback parameters
3. Fix obvious schema property mismatches

### Phase 1b: Core Fixes (2 hours)
1. Type all tRPC procedure responses
2. Fix DB query return types
3. Add proper type guards for optional properties

### Phase 1c: Validation (30 min)
1. Run `pnpm build` - should pass
2. Run `pnpm tsc --noEmit` - should show significant reduction
3. Document any remaining suppressions

---

## Allowed Suppressions (Max 5 total)

| File | Line | Error | Reason | Status |
|------|------|-------|--------|--------|
| server/stockAlertEngine.ts | 128 | TS2551 | LSP false positive - schema mismatch | PENDING |
| (others as needed) | - | - | - | - |

---

## Success Criteria

- [ ] `pnpm build` passes with no errors
- [ ] TS error count reduced to < 100 (or 0 if possible)
- [ ] No broad `as any` casting on core types
- [ ] No mass `@ts-ignore` sweeps
- [ ] All suppressions documented with reasons
- [ ] Org-scoping is clear in all queries
- [ ] Kiosk routing types are correct
- [ ] Dashboard query types are correct

---

## Notes

- Do NOT refactor entire type system
- Do NOT create SessionUser unless absolutely necessary
- Focus on unblocking critical paths
- Keep changes minimal and targeted
- Document every suppression
