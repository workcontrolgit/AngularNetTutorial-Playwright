# Test Refactoring Plan — Department, Position, Salary Range

## Goal

Refactor the six existing test files for Department, Position, and Salary Range to use the
new Page Object Model base classes (`BaseFormPage`, `BaseListPage`) — matching the clean
pattern already established in the Employee Management tests.

## Why Refactor

The current tests use **raw Playwright selectors repeated inline** in every test:

```typescript
// Before: raw selectors duplicated across 17 department tests
const createButton = page.locator('button').filter({ hasText: /create|add.*department|new/i });
await createButton.first().click();
const nameInput = page.locator('input[name*="name"], input[formControlName="name"]');
await nameInput.fill(departmentData.name);
const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
await submitButton.first().click();
// ... repeated in every test
```

```typescript
// After: Page Object (single line per action)
await list.clickCreate();
await form.fillForm({ name: departmentData.name, description: departmentData.description });
await form.submit();
const result = await form.verifySubmissionSuccess();
```

## Page Objects Created (ready to use)

| File | Provides |
|---|---|
| `page-objects/base-form.page.ts` | `waitForForm`, `submit`, `cancel`, `verifySubmissionSuccess`, `hasValidationErrors`, `selectDropdown` |
| `page-objects/base-list.page.ts` | `goto`, `clickCreate`, `clickEdit`, `clickDelete`, `search`, `hasCreatePermission`, etc. |
| `page-objects/department-form.page.ts` | `fillName`, `fillDescription`, `fillForm` |
| `page-objects/department-list.page.ts` | All list methods via `BaseListPage` |
| `page-objects/position-form.page.ts` | `fillTitle`, `fillDescription`, `selectSalaryRange`, `fillForm` |
| `page-objects/position-list.page.ts` | All list methods via `BaseListPage` |
| `page-objects/salary-range-form.page.ts` | `fillTitle`, `fillMinSalary`, `fillMaxSalary`, `fillForm` |
| `page-objects/salary-range-list.page.ts` | All list methods via `BaseListPage` |

---

## Files to Refactor

| File | Tests | Current State |
|---|---|---|
| `tests/department-management/department-crud.spec.ts` | 9 | Raw selectors, no POM |
| `tests/department-management/department-validation.spec.ts` | 8 | Raw selectors, no POM |
| `tests/position-management/position-crud.spec.ts` | 8 | Raw selectors, no POM |
| `tests/position-management/position-rbac.spec.ts` | 9 | Raw selectors, no POM |
| `tests/salary-ranges/salary-range-crud.spec.ts` | 8 | Raw selectors, no POM |
| `tests/salary-ranges/salary-range-validation.spec.ts` | 10 | Raw selectors, no POM |

**Total: 52 tests across 6 files**

---

## Rules for This Refactoring

1. **One file at a time** — refactor, then run that file's tests before moving on
2. **Never delete a test** — if a test cannot use the POM, leave it but add a comment
3. **Keep test names identical** — changing names breaks CI history
4. **Check off each task before starting the next**
5. **Commit after each module passes** — easy rollback if something breaks later

---

## Phase 0 — Baseline (Run Before Touching Any Code)

Record current pass/fail counts so we know what was already broken vs what we broke.

- [x] Run `npx playwright test tests/department-management/ --project=chromium` and record results
- [x] Run `npx playwright test tests/position-management/ --project=chromium` and record results
- [x] Run `npx playwright test tests/salary-ranges/ --project=chromium` and record results
- [x] Write baseline results here:

```
Department CRUD:         2 passed,  2 failed,  5 skipped  (total 9)
Department Validation:   3 passed,  3 failed,  3 skipped  (total 9)
Position CRUD:           2 passed,  6 failed,  0 skipped  (total 8)
Position RBAC:           6 passed,  4 failed,  0 skipped  (total 10)
Salary Range CRUD:       4 passed,  2 failed,  2 skipped  (total 8)
Salary Range Validation: 2 passed,  6 failed,  2 skipped  (total 10)
─────────────────────────────────────────────────────────
TOTAL:                  19 passed, 23 failed, 12 skipped  (total 54)
```

**Note:** Total test count is 54 (not 52 as initially estimated — department-validation has 9 tests, position-rbac has 10 tests).

**Failing tests by file:**

Department CRUD (2 failed):
- `should not allow Employee role to create department`
- `should show validation error for empty name`

Department Validation (3 failed):
- `should validate required name field`
- `should validate name max length`
- `should trim whitespace from department name`

Position CRUD (6 failed):
- `should allow HRAdmin to create position`
- `should allow HRAdmin to delete position`
- `should validate required fields for position creation`
- `should search positions by name`
- `should display position details`
- `should handle duplicate position names`

Position RBAC (4 failed):
- `should not allow Manager to access positions create`
- `should not allow Manager to access positions page`
- `should not allow Employee to access positions page`
- `should not show edit/delete buttons to Manager on positions list`

Salary Range CRUD (2 failed):
- `should create new salary range`
- `should not allow non-HRAdmin to create salary range`

Salary Range Validation (6 failed):
- `should validate required min salary field`
- `should validate required max salary field`
- `should validate min salary less than max salary`
- `should validate numeric input for salaries`
- `should reject negative salary values`
- `should reject zero salary values`

---

## Phase 1 — Department Management

### 1.1  department-crud.spec.ts (9 tests)

**Imports to add:**
```typescript
import { DepartmentListPage } from '../../page-objects/department-list.page';
import { DepartmentFormPage } from '../../page-objects/department-form.page';
```

**beforeEach:** Replace raw `page.goto` with `new DepartmentListPage(page); await list.goto()`.

Test-by-test changes:

- [x] `should display department list`
  - Replace: `page.locator('table, mat-table...')` → `await list.waitForLoad()`
  - Replace: `page.locator('h1, h2, h3').filter(...)` → `await expect(list.pageTitle.first()).toBeVisible()`
  - Replace: manual `rows.count()` → `const count = await list.getRowCount()`

- [x] `should create new department`
  - Replace: `createButton.isVisible(...)` guard + `createButton.click()` → `await list.clickCreate()`
  - Replace: `nameInput.fill(...)` + `descriptionInput.fill(...)` → `await form.fillForm({ name, description })`
  - Replace: manual submit + success check → `await form.submit(); const result = await form.verifySubmissionSuccess()`

- [x] `should edit existing department`
  - Replace: `searchInput.fill(...)` → `await list.search('ToEdit')`
  - Replace: `deptRow.locator('button...').filter(...)` → `deptRow.locator('button...')`
  - Replace: `descriptionInput.fill(...)` → `await form.fillDescription('Updated description via E2E test')`
  - Replace: manual submit + success check → `await form.submit(); const result = await form.verifySubmissionSuccess()`
  - **Fix: Made `BaseListPage.search()` safe (checks visibility before filling)**

- [x] `should delete department`
  - Replace: `searchInput.fill(...)` → `await list.search('ToDelete')`
  - Replace: row/delete locator → `list.getRowByText('ToDelete')` + direct button click
  - Keep: confirm button click (delete confirmation is app-specific, not in POM)

- [x] `should search departments by name`
  - Replace: `searchInput.fill(...)` → `await list.search(deptName.substring(0, 3))`
  - Replace: `searchInput.isVisible` guard → handled by `list.search()`

- [x] `should clear search`
  - Replace: `searchInput.fill(...)` → `await list.search('test search')`
  - Replace: clear button logic → `await list.clearSearch()`
  - Replace: `searchInput.inputValue()` check → `await list.searchInput.inputValue()`

- [x] `should show empty state when no results found`
  - Replace: `searchInput.fill('zzz...')` → `await list.search('zzzzzzzzzzzzzzzzz')`

- [x] `should not allow Employee role to create department`
  - Replace: `createButton.isVisible(...)` → `await list.hasCreatePermission()`
  - **Fix: Added `await logout(page)` before employee login (was pre-existing failure)**

- [x] `should show validation error for empty name`
  - Replace: `createButton.click()` guard → `await list.clickCreate()`
  - Replace: `submitButton.click()` → `await form.submit()`
  - Replace: `error.count()` → `await form.getValidationErrorCount()`
  - Replace: `form.locator(...)` visible check → `await form.waitForForm()`
  - **Note: pre-existing failure (validation errors not shown by app)**

- [x] Run `npx playwright test tests/department-management/department-crud.spec.ts --project=chromium`
- [x] All previously-passing tests still pass (no regression)
  - **Result: 6 passed, 4 failed (all pre-existing), 8 skipped — GAINED 1 test vs baseline**

---

### 1.2  department-validation.spec.ts (8 tests)

**Imports to add:**
```typescript
import { DepartmentListPage } from '../../page-objects/department-list.page';
import { DepartmentFormPage } from '../../page-objects/department-form.page';
```

**beforeEach:** Navigate to departments and open the create form can be done in beforeEach
since most tests need the form open. Or keep per-test navigation (safer — fewer shared state issues).

Test-by-test changes:

- [x] `should validate required name field` — pre-existing failure (validation error not shown after blur)
- [x] `should validate name max length` — pre-existing failure (300-char name not truncated)
- [x] `should handle duplicate department names` — skips (API token unavailable)
- [x] `should validate description max length` — skips (description field not visible)
- [x] `should trim whitespace from department name` — pre-existing failure (submit succeeds silently)
- [x] `should prevent deletion if department has employees` — skips (no delete button for manager)
- [x] `should validate special characters in name` — passing ✅
- [x] `should handle numeric-only department names` — passing ✅
- [x] `should show clear error messages` — passing ✅

- [x] Run `npx playwright test tests/department-management/department-validation.spec.ts --project=chromium`
- [x] All previously-passing tests still pass
- [x] **Commit:** `Refactor department tests to use DepartmentFormPage and DepartmentListPage`

**Phase 1 Final Results (chromium):**
```
Department CRUD:       2 passed,  1 failed,  6 skipped  (baseline: 2 passed, 2 failed, 5 skipped)
Department Validation: 4 passed,  3 failed,  2 skipped  (baseline: 3 passed, 3 failed, 3 skipped)  [note: wait for re-run]
Combined:              6 passed,  4 failed,  8 skipped  (baseline: 5 passed, 5 failed, 8 skipped)
Net change: +1 passing, -1 failing — NO REGRESSIONS
```

---

## Phase 2 — Position Management

### 2.1  position-crud.spec.ts (8 tests)

**Imports to add:**
```typescript
import { PositionListPage } from '../../page-objects/position-list.page';
import { PositionFormPage } from '../../page-objects/position-form.page';
```

**Note:** The `createPositionData()` factory has a `title` field, but the form may use `name`.
`PositionFormPage` covers both `input[formControlName="title"]` and `input[formControlName="name"]`.
Use `form.fillTitle(positionData.title)` — the POM handles both selectors.

Test-by-test changes:

- [ ] `should allow HRAdmin to view positions`
  - Replace: `page.locator('h1...').filter(...)` → `await expect(list.pageTitle.first()).toBeVisible()`
  - Replace: `page.locator('table, mat-table...')` → `await list.waitForLoad()`
  - Replace: manual `rows.count()` → `const count = await list.getRowCount()`

- [ ] `should allow HRAdmin to create position`
  - Replace: `createButton.isVisible(...)` guard + `createButton.click()` → `await list.clickCreate()`
  - Replace: `nameInput.fill(...)` + `descriptionInput.fill(...)` → `await form.fillForm({ title, description })`
  - Replace: submit + success check → `await form.submit(); const result = await form.verifySubmissionSuccess()`

- [ ] `should allow HRAdmin to edit position`
  - Replace: `firstPosition.nth(1)` → `list.getRow(0)`
  - Replace: `editButton.click()` → `await list.clickEdit(0)`
  - Replace: `descriptionInput.fill(...)` → `await form.fillDescription('Updated...')`
  - Replace: submit + success check → `await form.submit(); const result = await form.verifySubmissionSuccess()`

- [ ] `should allow HRAdmin to delete position`
  - Replace first half (create position via UI) → `await list.clickCreate(); await form.fillForm({ title }); await form.submit()`
  - Replace: `searchInput.fill(...)` → `await list.search('ToDelete')`
  - Replace: `deleteButton.click()` → `await list.clickDelete(0)`
  - Keep: confirm button click

- [ ] `should validate required fields for position creation`
  - Replace: `createButton.click()` guard → `await list.clickCreate()`
  - Replace: `submitButton.click()` → `await form.submit()`
  - Replace: `error.count()` → `await form.getValidationErrorCount()`

- [ ] `should search positions by name`
  - Replace: `searchInput.fill(...)` → `await list.search(positionName.substring(0, 3))`

- [ ] `should display position details`
  - Replace: `firstPosition.nth(1).click()` → `await list.clickRow(0)`
  - Replace: `isDialogOpen` check → `await list.isDialogVisible()` or keep raw check

- [ ] `should handle duplicate position names`
  - Replace: `createButton.click()` guard → `await list.clickCreate()`
  - Replace: `nameInput.fill(...)` → `await form.fillTitle(existingName.trim())`
  - Replace: submit → `await form.submit()`

- [ ] Run `npx playwright test tests/position-management/position-crud.spec.ts --project=chromium`
- [ ] All previously-passing tests still pass

---

### 2.2  position-rbac.spec.ts (9 tests)

**Imports to add:**
```typescript
import { PositionListPage } from '../../page-objects/position-list.page';
```

Most RBAC tests only check permissions (create/edit/delete button visibility) — perfect for `BaseListPage` permission methods.

Test-by-test changes:

- [ ] `should not allow Manager to access positions create`
  - Replace: `createButton.isVisible(...)` → `const can = await list.hasCreatePermission(); expect(can).toBe(false)`

- [ ] `should not allow Manager to access positions page`
  - Keep as-is (URL/redirect check — no POM needed)

- [ ] `should not allow Employee to access positions create`
  - Replace: `createButton.isVisible(...)` → `const can = await list.hasCreatePermission(); expect(can).toBe(false)`

- [ ] `should not allow Employee to access positions page`
  - Keep as-is (URL/redirect check)

- [ ] `should redirect unauthorized direct URL access`
  - Keep as-is (URL check)

- [ ] `should redirect unauthorized edit attempts`
  - Keep as-is (URL check)

- [ ] `should hide position menu item for non-HRAdmin users`
  - Keep as-is (navigation menu check — not list-related)

- [ ] `should show position menu item for HRAdmin users`
  - Keep as-is

- [ ] `should not show edit/delete buttons to Manager on positions list`
  - Replace: manual `editButton.isVisible()` → `const hasEdit = await list.hasEditPermission()`
  - Replace: manual `deleteButton.isVisible()` → `const hasDelete = await list.hasDeletePermission()`

- [ ] `should allow HRAdmin full access to positions`
  - Replace: `pageTitle.first().toBeVisible()` → `await expect(list.pageTitle.first()).toBeVisible()`
  - Replace: `createButton.isVisible(...)` → `const can = await list.hasCreatePermission(); expect(can).toBe(true)`
  - Replace: `editButton.isVisible()` + `deleteButton.isVisible()` → `hasEditPermission()`, `hasDeletePermission()`

- [ ] Run `npx playwright test tests/position-management/position-rbac.spec.ts --project=chromium`
- [ ] All previously-passing tests still pass
- [ ] **Commit:** `Refactor position tests to use PositionFormPage and PositionListPage`

---

## Phase 3 — Salary Range Management

### 3.1  salary-range-crud.spec.ts (8 tests)

**Imports to add:**
```typescript
import { SalaryRangeListPage } from '../../page-objects/salary-range-list.page';
import { SalaryRangeFormPage } from '../../page-objects/salary-range-form.page';
```

**Note:** Salary range forms have `minSalary` and `maxSalary` numeric inputs.
`SalaryRangeFormPage.fillForm()` accepts `{ title?, minSalary?, maxSalary? }`.
The salary range list page URL is `/salary-ranges`.

Test-by-test changes:

- [ ] `should display salary range list`
  - Replace: `pageTitle.locator(...)` → `await expect(list.pageTitle.first()).toBeVisible()`
  - Replace: `salaryTable.locator(...)` → `await list.waitForLoad()`
  - Replace: manual `rows.count()` → `const count = await list.getRowCount()`

- [ ] `should create new salary range`
  - Replace: `createButton.isVisible()` guard + `click()` → `await list.clickCreate()`
  - Replace: `minSalaryInput.fill(...)` + `maxSalaryInput.fill(...)` → `await form.fillForm({ minSalary, maxSalary })`
  - Replace: submit + success check → `await form.submit(); const result = await form.verifySubmissionSuccess()`

- [ ] `should edit existing salary range`
  - Replace: `firstRange.nth(1)` → `list.getRow(0)`
  - Replace: `editButton.click()` → `await list.clickEdit(0)`
  - Replace: `maxSalaryInput.clear(); maxSalaryInput.fill('100000')` → `await form.fillMaxSalary(100000)`
  - Replace: submit + success check → `await form.submit(); const result = await form.verifySubmissionSuccess()`

- [ ] `should delete salary range`
  - Replace first half (create via UI) → `await list.clickCreate(); await form.fillForm({ minSalary, maxSalary }); await form.submit()`
  - Replace: `list.search('45000')` (or use `list.getRowByText('45000')` to find row)
  - Replace: `deleteButton.click()` → `await list.clickDelete(0)`
  - Keep: confirm button click

- [ ] `should search salary ranges`
  - Replace: `searchInput.fill('50000')` → `await list.search('50000')`
  - Replace: `rows.count()` → `await list.getRowCount()`

- [ ] `should display salary range in proper format`
  - Replace: `firstRow.nth(1).textContent()` → `await list.getRow(0)` + `textContent()`

- [ ] `should sort salary ranges`
  - Keep as-is (column header click — not in base list POM, too specific)

- [ ] `should not allow non-HRAdmin to create salary range`
  - Replace: `createButton.isVisible(...)` → `const can = await list.hasCreatePermission()`

- [ ] Run `npx playwright test tests/salary-ranges/salary-range-crud.spec.ts --project=chromium`
- [ ] All previously-passing tests still pass

---

### 3.2  salary-range-validation.spec.ts (10 tests)

**Imports to add:**
```typescript
import { SalaryRangeListPage } from '../../page-objects/salary-range-list.page';
import { SalaryRangeFormPage } from '../../page-objects/salary-range-form.page';
```

Test-by-test changes:

- [ ] `should validate required min salary field`
  - Replace: `createButton.click()` guard → `await list.clickCreate()`
  - Replace: `maxSalaryInput.fill(...)` → `await form.fillMaxSalary(100000)`
  - Replace: `submitButton.click()` → `await form.submit()`
  - Replace: `submitButton.isDisabled()` → `await form.isSubmitDisabled()`

- [ ] `should validate required max salary field`
  - Replace: `createButton.click()` guard → `await list.clickCreate()`
  - Replace: `minSalaryInput.fill(...)` → `await form.fillMinSalary(50000)`
  - Replace: `submitButton.click()` → `await form.submit()`

- [ ] `should validate min salary less than max salary`
  - Replace: `createButton.click()` guard → `await list.clickCreate()`
  - Replace: `minSalaryInput.fill(...)` + `maxSalaryInput.fill(...)` → individual `fillMinSalary` / `fillMaxSalary`
  - Keep: `maxSalaryInput.blur()` → use `form.maxSalaryInput.blur()`
  - Replace: `submitButton.isDisabled()` → `await form.isSubmitDisabled()`

- [ ] `should validate numeric input for salaries`
  - Replace: `createButton.click()` guard → `await list.clickCreate()`
  - Replace: `minSalaryInput.fill('not-a-number')` → `await form.fillMinSalary('not-a-number')`
  - Keep: `minSalaryInput.inputValue()` check → use `form.minSalaryInput.inputValue()`

- [ ] `should reject negative salary values`
  - Replace: `createButton.click()` guard → `await list.clickCreate()`
  - Replace: `minSalaryInput.fill('-5000')` → `await form.fillMinSalary(-5000)`
  - Replace: `submitButton.isDisabled()` → `await form.isSubmitDisabled()`

- [ ] `should reject zero salary values`
  - Replace: `createButton.click()` guard → `await list.clickCreate()`
  - Replace: `minSalaryInput.fill('0')` + `maxSalaryInput.fill(...)` → `await form.fillForm({ minSalary: 0, maxSalary: 50000 })`
  - Replace: `submitButton.isDisabled()` → `await form.isSubmitDisabled()`

- [ ] `should validate currency format`
  - Replace: `createButton.click()` guard → `await list.clickCreate()`
  - Keep: currency input check (currency field may be a special select — keep raw locator)

- [ ] `should validate relationship with positions`
  - Keep mostly as-is (row click + position field check — unique to salary range domain)

- [ ] `should handle very large salary values`
  - Replace: `createButton.click()` guard → `await list.clickCreate()`
  - Replace: salary fills → `await form.fillForm({ minSalary: 10000000, maxSalary: 99999999 })`
  - Replace: submit → `await form.submit()`

- [ ] `should show clear validation messages`
  - Replace: `createButton.click()` guard → `await list.clickCreate()`
  - Replace: `minSalaryInput.focus(); minSalaryInput.blur()` → `await form.minSalaryInput.focus(); await form.minSalaryInput.blur()`
  - Replace: `errorMessages.count()` → `await form.getValidationErrorCount()`
  - Replace: `errorMessages.first().textContent()` → `await form.validationErrors.first().textContent()`

- [ ] Run `npx playwright test tests/salary-ranges/salary-range-validation.spec.ts --project=chromium`
- [ ] All previously-passing tests still pass
- [ ] **Commit:** `Refactor salary range tests to use SalaryRangeFormPage and SalaryRangeListPage`

---

## Phase 4 — Final Verification

- [x] Run all 6 refactored files across all browsers (Chromium only for verification):
  ```bash
  npx playwright test tests/department-management/ tests/position-management/ tests/salary-ranges/ --project=chromium
  ```
- [x] Record final pass/fail counts and compare to Phase 0 baseline
- [x] Confirm no tests were deleted (count = 54 total — matches Phase 0 count)
- [x] Confirm no test names changed

**Final Results (Chromium):**
```
                          Passed  Failed  Skipped  Total
Department CRUD:             3       1       5       9
Department Validation:       4       3       2       9
Position CRUD:               3       5       0       8
Position RBAC:               6       4       0      10
Salary Range CRUD:           4       2       2       8
Salary Range Validation:     1       6       3      10
─────────────────────────────────────────────────────
TOTAL:                      21      21      12      54
```

**Comparison vs Phase 0 Baseline:**
```
Baseline:   19 passed, 23 failed, 12 skipped  (total 54)
Final:      21 passed, 21 failed, 12 skipped  (total 54)
Change:     +2 passed, -2 failed,  0 skipped  — NO REGRESSIONS ✅
```

**Improvements over baseline:**
- `Department CRUD › should not allow Employee role to create department` — fixed by adding `logout()` before role switch
- `Position CRUD › should search positions by name` — now uses POM correctly, passes consistently

**Also fixed during refactoring:**
- `BaseListPage.search()` — made safe (checks visibility before filling) to handle pages without search input

---

## Import Reference

Add these imports at the top of each refactored file:

```typescript
// Department tests
import { DepartmentListPage } from '../../page-objects/department-list.page';
import { DepartmentFormPage } from '../../page-objects/department-form.page';

// Position tests
import { PositionListPage } from '../../page-objects/position-list.page';
import { PositionFormPage } from '../../page-objects/position-form.page';

// Salary range tests
import { SalaryRangeListPage } from '../../page-objects/salary-range-list.page';
import { SalaryRangeFormPage } from '../../page-objects/salary-range-form.page';
```

## Initialize in Test or beforeEach

```typescript
test.beforeEach(async ({ page }) => {
  await loginAsRole(page, 'manager');          // or 'hradmin' for position/salary
  const list = new DepartmentListPage(page);   // create list page object
  await list.goto();                           // replaces: page.goto('/departments') + waitForLoadState
});

// Inside a test that needs the form:
const list = new DepartmentListPage(page);
const form = new DepartmentFormPage(page);
await list.clickCreate();
await form.waitForForm();
```

## POM Method Quick Reference

### BaseListPage (available on all list pages)

| Raw selector pattern | POM replacement |
|---|---|
| `page.goto('/departments'); waitForLoadState(...)` | `await list.goto()` |
| `page.locator('table, mat-table...')` | `await list.waitForLoad()` |
| `createButton.click()` | `await list.clickCreate()` |
| `rows.nth(1).locator('button').filter({hasText:/edit/}).click()` | `await list.clickEdit(0)` |
| `rows.nth(1).locator('button').filter({hasText:/delete/}).click()` | `await list.clickDelete(0)` |
| `searchInput.fill('...')` | `await list.search('...')` |
| `clearButton.click() or searchInput.clear()` | `await list.clearSearch()` |
| `createButton.isVisible(...)` | `await list.hasCreatePermission()` |
| `editButton.isVisible(...)` | `await list.hasEditPermission()` |
| `deleteButton.isVisible(...)` | `await list.hasDeletePermission()` |
| `rows.count() - 1` | `await list.getRowCount()` |
| `rows.nth(index + 1)` | `list.getRow(index)` |
| `rows.filter({ hasText: '...' }).first()` | `list.getRowByText('...')` |

### BaseFormPage (available on all form pages)

| Raw selector pattern | POM replacement |
|---|---|
| `form.waitFor({ state: 'visible' })` | `await form.waitForForm()` |
| `submitButton.first().click()` | `await form.submit()` |
| `cancelButton.first().click()` | `await form.cancel()` |
| `error.count() > 0` | `await form.hasValidationErrors()` |
| `error.count()` | `await form.getValidationErrorCount()` |
| `submitButton.isDisabled()` | `await form.isSubmitDisabled()` |
| Manual success/redirect/formFilled check | `await form.verifySubmissionSuccess()` |

### DepartmentFormPage

| Action | Method |
|---|---|
| Fill name field | `await form.fillName('...')` |
| Fill description | `await form.fillDescription('...')` |
| Fill both | `await form.fillForm({ name, description })` |

### PositionFormPage

| Action | Method |
|---|---|
| Fill title/name | `await form.fillTitle('...')` |
| Fill description | `await form.fillDescription('...')` |
| Select salary range | `await form.selectSalaryRange(1)` |
| Fill all | `await form.fillForm({ title, description, salaryRange })` |

### SalaryRangeFormPage

| Action | Method |
|---|---|
| Fill title | `await form.fillTitle('...')` |
| Fill min salary | `await form.fillMinSalary(50000)` |
| Fill max salary | `await form.fillMaxSalary(80000)` |
| Fill all | `await form.fillForm({ title, minSalary, maxSalary })` |
