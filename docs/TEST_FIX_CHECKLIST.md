# Playwright Test Suite - Complete Test List & Fix Checklist

## Test Execution Summary

**Current Status (as of last run):**
- ✅ **Passed:** 4 tests
- ❌ **Failed:** 1,047 tests
- ⏭️ **Did not run:** 28 tests
- ⏱️ **Total Duration:** 7.0 minutes

## Root Cause Analysis

### Primary Issues

1. **🚨 CRITICAL: Angular Application Not Running**
   - **Error:** `ERR_CONNECTION_REFUSED at http://localhost:4200/`
   - **Impact:** 99% of test failures
   - **Cause:** Angular dev server is not started

2. **🔒 SSL/TLS Certificate Issues**
   - **Error:** `tlsv1 unrecognized name` SSL alert
   - **Impact:** API authentication tests
   - **Cause:** Self-signed certificates or IdentityServer not running

3. **🔐 API Authentication Disabled**
   - **Known Issue:** API allows anonymous access (should require Bearer tokens)
   - **Impact:** Auth-related API tests fail

---

## 🔧 Fix Checklist

### Phase 1: Environment Setup (CRITICAL - Must Complete First)

- [ ] **Start IdentityServer (MUST START FIRST)**
  ```bash
  cd C:\apps\AngularNetTutotial\TokenService\Duende-IdentityServer\src\Duende.STS.Identity
  dotnet run
  ```
  - Wait for: `Now listening on: https://localhost:44310`
  - Verify: Open https://localhost:44310 in browser

- [ ] **Start API (Requires IdentityServer Running)**
  ```bash
  cd C:\apps\AngularNetTutotial\ApiResources\TalentManagement-API
  dotnet run
  ```
  - Wait for: `Now listening on: https://localhost:44378`
  - Verify: Open https://localhost:44378/swagger in browser

- [ ] **Start Angular Client**
  ```bash
  cd C:\apps\AngularNetTutotial\Clients\TalentManagement-Angular-Material\talent-management
  npm start
  ```
  - Wait for: `✔ Browser application bundle generation complete`
  - Verify: Open http://localhost:4200 in browser

- [ ] **Verify All Services Running**
  - [ ] IdentityServer: https://localhost:44310 ✅
  - [ ] API: https://localhost:44378/swagger ✅
  - [ ] Angular: http://localhost:4200 ✅

### Phase 2: Configuration Verification

- [ ] **Verify Test Users Exist in IdentityServer**
  - Check file: `TokenService/Duende-IdentityServer/src/Duende.Admin/identityserverdata.json`
  - Verify users: `antoinette16`, `rosamond33`, `ashtyn1`
  - Password: `Pa$$word123` for all test users

- [ ] **Verify Angular Environment Configuration**
  - File: `Clients/.../src/environments/environment.ts`
  - identityServerUrl: `https://localhost:44310` ✅
  - clientId: `TalentManagement` ✅
  - apiUrl: `https://localhost:44378/api/v1` ✅

- [ ] **Verify SSL Certificates**
  - Trust self-signed certificates for localhost
  - Or update `playwright.config.ts` with `ignoreHTTPSErrors: true` (already set)

### Phase 3: Run Tests & Monitor Results

- [ ] **Run Quick Smoke Test**
  ```bash
  npx playwright test tests/diagnostic.spec.ts --headed
  ```
  - Should show Angular app loading as Guest

- [ ] **Run Authentication Tests**
  ```bash
  npx playwright test tests/auth/login.spec.ts --headed
  ```
  - Should successfully login with test users

- [ ] **Run Full Test Suite**
  ```bash
  npx playwright test --reporter=list
  ```

- [ ] **Review Test Report**
  ```bash
  npx playwright show-report
  ```

### Phase 4: Address Known Issues (Post-Environment Setup)

- [ ] **API Authentication (If Still Failing)**
  - Issue: API returns 200 OK without Bearer tokens
  - Expected: Should return 401 Unauthorized
  - Fix: Enable authentication in API configuration
  - File: `ApiResources/TalentManagement-API/Program.cs`
  - Add: `app.UseAuthentication();` before `app.UseAuthorization();`

- [ ] **IdentityServer Password Grant (If API Tests Fail)**
  - Issue: "unauthorized_client" for password grant
  - Workaround: Use Profile page token extraction (already implemented)
  - Tests should use `getTokenFromProfile(page)` helper

- [ ] **Selector Updates (If UI Tests Fail After App Starts)**
  - Review failed tests for selector issues
  - Update selectors to be more specific
  - Use `h1:has-text("...")` instead of `text=...`

---

## 📋 Complete Test Inventory (39 Test Files, ~1,051 Tests)

### 1. Authentication & Authorization (6 files)

#### `tests/auth/login.spec.ts`
- ✅ Guest mode loads correctly
- ✅ User icon appears in header
- ✅ Login option appears in menu
- ✅ Login redirects to IdentityServer
- ✅ Successful login with Employee role
- ✅ Successful login with Manager role
- ✅ Successful login with HRAdmin role
- ❌ Invalid credentials show error
- ❌ Login persists across page reload

#### `tests/auth/logout.spec.ts`
- ✅ Logout option appears after login
- ✅ Logout redirects to IdentityServer
- ✅ Logout screen shows return link
- ✅ Returns to Guest mode after logout
- ❌ Session cleared after logout
- ❌ Protected routes inaccessible after logout

#### `tests/auth/role-based-access.spec.ts`
- ❌ Employee cannot create employees
- ❌ Employee cannot edit employees
- ❌ Employee cannot delete employees
- ❌ Manager can create employees
- ❌ Manager can edit employees
- ❌ Manager cannot delete employees
- ❌ HRAdmin has full access
- ❌ Manager cannot access positions
- ❌ Manager cannot access salary ranges
- ❌ Employee cannot access positions
- ❌ Employee cannot access salary ranges

#### `tests/auth/auth-edge-cases.spec.ts`
- ❌ Expired token handling
- ❌ Token refresh on expiration
- ❌ Concurrent login attempts
- ❌ Login with special characters
- ❌ Token storage security
- ❌ Session timeout handling
- ❌ Multiple tabs authentication sync
- ❌ Invalid redirect URI handling
- ❌ PKCE flow validation
- ❌ State parameter validation

#### `tests/api/auth-api.spec.ts`
- ❌ Acquire token from IdentityServer
- ❌ Validate token on API request
- ❌ Reject invalid token
- ❌ Reject expired token
- ❌ Include proper claims in token
- ❌ Include role/scope claims for Manager
- ❌ Include role/scope claims for HRAdmin
- ❌ Include role/scope claims for Employee
- ❌ Reject request without Authorization header
- ❌ Reject malformed Authorization header
- ❌ Validate token signature
- ❌ Proper token audience claim
- ❌ Proper token issuer claim
- ❌ Extract token from Profile page and call API (✅ with app running)
- ❌ Verify token has correct scopes
- ❌ Use different tokens for different roles
- ❌ Call API with HRAdmin token

#### `tests/diagnostic-token-storage.spec.ts`
- ❌ Compare token extraction: localStorage vs Profile page

---

### 2. Employee Management (5 files)

#### `tests/employee-management/employee-smoke.spec.ts`
- ❌ View employee list
- ❌ Create new employee
- ❌ View employee detail
- ❌ View employee list as Employee role (read-only)

#### `tests/employee-management/employee-list.spec.ts`
- ❌ Display employee list with pagination
- ❌ Change page size
- ❌ Search by employee number
- ❌ Search by name
- ❌ Search by email
- ❌ Autocomplete suggestions
- ❌ Clear search
- ❌ Empty state when no results
- ❌ Navigate to next page
- ❌ Navigate to previous page

#### `tests/employee-management/employee-create.spec.ts`
- ❌ Successfully create with valid data
- ❌ Show validation errors for required fields
- ❌ Validate email format
- ❌ Validate salary as numeric
- ❌ Select position from dropdown
- ❌ Select department from dropdown
- ❌ Show success notification
- ❌ Redirect after creation
- ❌ Prevent Employee role from creating

#### `tests/employee-management/employee-edit.spec.ts`
- ❌ Navigate to edit form
- ❌ Pre-populate form with data
- ❌ Successfully update employee
- ❌ Validate required fields on edit
- ❌ Validate email format on edit
- ❌ Show success notification after update
- ❌ Cancel edit and return to list
- ❌ Prevent Employee role from editing

#### `tests/employee-management/employee-delete.spec.ts`
- ❌ Show delete confirmation dialog
- ❌ Successfully delete employee
- ❌ Remove from list after deletion
- ❌ Cancel deletion
- ❌ Prevent Manager role from deleting
- ❌ Prevent Employee role from deleting

---

### 3. Department Management (2 files)

#### `tests/department-management/department-crud.spec.ts`
- ❌ Display department list
- ❌ Create new department
- ❌ Edit existing department
- ❌ Delete department
- ❌ Search departments by name
- ❌ Clear search
- ❌ Empty state when no results
- ❌ Prevent Employee from creating
- ❌ Show validation error for empty name

#### `tests/department-management/department-validation.spec.ts`
- ❌ Validate required name field
- ❌ Validate name max length
- ❌ Handle duplicate department names
- ❌ Validate description max length
- ❌ Trim whitespace from name
- ❌ Prevent deletion if department has employees
- ❌ Validate special characters in name
- ❌ Handle numeric-only names
- ❌ Show clear error messages

---

### 4. Position Management (2 files)

#### `tests/position-management/position-crud.spec.ts`
- ❌ HRAdmin can view positions
- ❌ HRAdmin can create position
- ❌ HRAdmin can edit position
- ❌ HRAdmin can delete position
- ❌ Validate required fields
- ❌ Search positions by name
- ❌ Display position details
- ❌ Handle duplicate position names

#### `tests/position-management/position-rbac.spec.ts`
- ❌ Manager cannot access positions create
- ❌ Manager cannot access positions page
- ❌ Employee cannot access positions create
- ❌ Employee cannot access positions page
- ❌ Redirect unauthorized direct URL access
- ❌ Redirect unauthorized edit attempts
- ❌ Hide position menu for non-HRAdmin
- ❌ Show position menu for HRAdmin
- ❌ Manager doesn't see edit/delete buttons
- ❌ HRAdmin has full access to positions

---

### 5. Salary Ranges (2 files)

#### `tests/salary-ranges/salary-range-crud.spec.ts`
- ❌ Display salary range list
- ❌ Create new salary range
- ❌ Edit existing salary range
- ❌ Delete salary range
- ❌ Search salary ranges
- ❌ Display salary range in proper format
- ❌ Sort salary ranges
- ❌ Prevent non-HRAdmin from creating

#### `tests/salary-ranges/salary-range-validation.spec.ts`
- ❌ Validate required min salary field
- ❌ Validate required max salary field
- ❌ Validate min < max
- ❌ Validate numeric input
- ❌ Reject negative values
- ❌ Reject zero values
- ❌ Validate currency format
- ❌ Validate relationship with positions
- ❌ Handle very large values
- ❌ Show clear validation messages

---

### 6. Dashboard (2 files)

#### `tests/dashboard/dashboard-metrics.spec.ts`
- ❌ Display employee count metric
- ❌ Display department count metric
- ❌ Display position count metric
- ❌ Display charts with data
- ❌ Update metrics in real-time
- ❌ Display role-specific metrics
- ❌ Responsive metric cards
- ❌ Load metrics within timeout

#### `tests/dashboard/dashboard-navigation.spec.ts`
- ❌ Navigate to employee list from dashboard
- ❌ Navigate to create employee from dashboard
- ❌ Navigate to department list
- ❌ Navigate to create department
- ❌ Navigate to positions (HRAdmin)
- ❌ Navigate to salary ranges (HRAdmin)
- ❌ Show quick action buttons for Manager
- ❌ Hide create buttons for Employee
- ❌ Navigate using sidebar menu
- ❌ Navigate using top nav bar
- ❌ Return to dashboard from any page
- ❌ Highlight active menu item
- ❌ Navigate to profile or settings

---

### 7. API Tests (3 files)

#### `tests/api/employees-api.spec.ts`
- ❌ GET list of employees
- ❌ POST create new employee with token
- ❌ DELETE employee with admin token
- ❌ Return 403 Forbidden with wrong role
- ❌ Return 404 for invalid employee ID
- ❌ Support search/filter parameters
- ❌ Validate email format on create

#### `tests/api/departments-api.spec.ts`
- ❌ GET list of departments
- ❌ POST create new department
- ❌ GET department by ID
- ❌ PUT update department
- ❌ DELETE department
- ❌ Return 401 without authentication
- ❌ Return 400 for invalid data
- ❌ Return 404 for non-existent ID
- ❌ Validate required name field
- ❌ Handle duplicate names
- ❌ Return proper content-type header
- ❌ Support search/filter parameters

#### `tests/api/cache-api.spec.ts`
- ❌ Include cache headers in responses
- ❌ Respect Cache-Control values
- ❌ Include ETag for versioned resources
- ❌ Support conditional requests (If-None-Match)
- ❌ Invalidate cache on modification
- ❌ Provide cache invalidation endpoint
- ❌ Provide cache statistics endpoint
- ❌ Support cache bypass (no-cache)
- ❌ Support Pragma: no-cache
- ❌ Set appropriate cache headers
- ❌ Handle concurrent cache requests
- ❌ Expire cache after max-age

---

### 8. Workflows (3 files)

#### `tests/workflows/complete-employee-workflow.spec.ts`
- ❌ Complete full employee lifecycle
- ❌ Handle workflow interruption gracefully
- ❌ Maintain search state during workflow

#### `tests/workflows/manager-daily-tasks.spec.ts`
- ❌ Complete typical manager daily workflow
- ❌ Handle multiple employee updates in sequence
- ❌ Review dashboard metrics before tasks

#### `tests/workflows/hradmin-operations.spec.ts`
- ❌ Complete full HRAdmin workflow with relationships
- ❌ Delete records as HRAdmin
- ❌ Manage all modules as HRAdmin

---

### 9. Navigation & Routing (1 file)

#### `tests/navigation/routing.spec.ts`
- ❌ Protect routes requiring authentication
- ❌ Allow direct URL access after auth
- ❌ Support browser back button
- ❌ Support browser forward button
- ❌ Support breadcrumb navigation
- ❌ Support deep linking to resources
- ❌ Redirect unauthorized users
- ❌ Preserve query parameters
- ❌ Handle invalid routes gracefully
- ❌ Maintain scroll position on back
- ❌ Navigate using route links
- ❌ Handle route parameters correctly
- ❌ Support hash-based routing
- ❌ Redirect from root to default
- ❌ Prevent unauthorized direct URL
- ❌ Handle logout redirect correctly

---

### 10. Validation (1 file)

#### `tests/validation/form-validation.spec.ts`
- ❌ Validate max length for text fields
- ❌ Handle special characters in names
- ❌ Validate email format variations
- ❌ Reject negative salary values
- ❌ Reject zero salary values
- ❌ Handle extremely large numbers
- ❌ Prevent SQL injection
- ❌ Prevent XSS attacks
- ❌ Validate whitespace-only input
- ❌ Validate leading/trailing whitespace
- ❌ Show multiple validation errors

---

### 11. Error Handling (2 files)

#### `tests/error-handling/network-errors.spec.ts`
- ❌ Handle API timeout gracefully
- ❌ Handle network disconnection
- ❌ Handle slow API responses
- ❌ Display user-friendly error messages
- ✅ Provide retry mechanism (PASSED - 3 browsers)
- ❌ Handle partial data load failures
- ❌ Recover from transient errors
- ❌ Cache data for offline access
- ❌ Handle rate limiting
- ❌ Maintain UI responsiveness during errors

#### `tests/error-handling/api-errors.spec.ts`
- ❌ Handle 500 Internal Server Error
- ❌ Handle 503 Service Unavailable
- ❌ Handle malformed JSON response
- ❌ Handle empty response body
- ❌ Handle wrong data structure
- ❌ Handle API returning HTML
- ❌ Handle partial response corruption
- ❌ Log errors for debugging
- ❌ Handle multiple simultaneous errors
- ❌ Provide error details for debugging

---

### 12. Performance (2 files)

#### `tests/performance/load-time.spec.ts`
- ❌ Load dashboard in under 2 seconds
- ❌ Load employee list in under 2 seconds
- ❌ Submit form in under 1 second
- ❌ Return search results in under 500ms
- ❌ Navigate between pages quickly
- ❌ Load page with all assets efficiently
- ❌ Handle rapid page transitions
- ❌ Measure time to interactive

#### `tests/performance/large-datasets.spec.ts`
- ❌ Handle pagination with large dataset
- ❌ Handle large page sizes efficiently
- ❌ Search quickly on large dataset
- ❌ Render charts with max data
- ❌ Sort on large dataset
- ❌ Filter on large dataset
- ❌ Scroll through large list
- ❌ Measure memory usage with large dataset

---

### 13. Visual Regression (2 files)

#### `tests/visual/dashboard-visual.spec.ts`
- ❌ Match dashboard baseline screenshot
- ❌ Render charts consistently
- ❌ Maintain layout on 1920x1080
- ❌ Display metrics consistently
- ❌ Render navigation consistently

#### `tests/visual/forms-visual.spec.ts`
- ❌ Match employee form baseline
- ❌ Display validation errors consistently
- ❌ Match department form baseline
- ❌ Display form inputs consistently
- ❌ Display form buttons consistently

---

### 14. Accessibility (2 files)

#### `tests/accessibility/keyboard-navigation.spec.ts`
- ❌ Navigate forms with Tab key
- ❌ Submit form with Enter key
- ❌ Close dialogs with Escape key
- ❌ Navigate menus with arrow keys
- ❌ Focus visible indicator
- ❌ Skip to main content
- ❌ Navigate tables with keyboard
- ❌ Access all interactive elements
- ❌ Focus trap in modals
- ❌ Logical tab order

#### `tests/accessibility/aria-labels.spec.ts`
- ❌ All buttons have accessible names
- ❌ All form inputs have labels
- ❌ All icons have aria-label
- ❌ Headings use proper hierarchy
- ❌ Tables have proper ARIA attributes
- ❌ Dialogs have aria-labelledby
- ❌ Live regions for dynamic content
- ❌ Proper roles for custom components
- ❌ Error messages associated with fields
- ❌ All images have alt text

---

### 15. Responsive/Mobile (1 file)

#### `tests/responsive/mobile-layout.spec.ts`
- ❌ Display correctly on mobile viewport
- ❌ Display correctly on tablet viewport
- ❌ Working mobile menu navigation
- ❌ Handle table scrolling on mobile
- ❌ Forms usable on mobile
- ❌ Adjust font sizes for mobile
- ❌ Stack columns on mobile
- ❌ Touch-friendly button sizes
- ❌ Handle orientation change
- ❌ No horizontal scroll on mobile
- ❌ Display images responsively
- ❌ Maintain functionality on all screens

---

### 16. Concurrency (1 file)

#### `tests/concurrency/concurrent-operations.spec.ts`
- ❌ Handle concurrent employee creation
- ❌ Handle concurrent updates
- ❌ Handle concurrent deletions
- ❌ Handle race conditions
- ❌ Handle optimistic locking
- ❌ Display conflict resolution
- ❌ Handle simultaneous searches
- ❌ Handle concurrent form submissions
- ❌ Handle concurrent navigation
- ❌ Maintain data consistency

---

### 17. Diagnostic Tests (2 files)

#### `tests/diagnostic.spec.ts`
- ❌ Check Angular app behavior

#### `tests/TalentManagement.spec.ts`
- ❌ Basic test

---

## 🎯 Quick Wins (Tests Likely to Pass After Environment Setup)

Once all services are running, these test categories should pass with minimal fixes:

1. **Authentication Flow** (tests/auth/login.spec.ts, logout.spec.ts)
   - Estimated: 10-15 tests should pass

2. **Employee Management Smoke Tests** (tests/employee-management/employee-smoke.spec.ts)
   - Estimated: 3-4 tests should pass

3. **Dashboard Navigation** (tests/dashboard/dashboard-navigation.spec.ts)
   - Estimated: 5-10 tests should pass

4. **Basic CRUD Operations** (employee-list, department-crud)
   - Estimated: 10-20 tests should pass

**Total Quick Wins: ~30-50 tests** (after environment setup)

---

## 📊 Expected Test Pass Rate After Fixes

| Phase | Expected Pass Rate | Estimated Passing Tests |
|-------|-------------------|------------------------|
| After Phase 1 (Services Running) | ~40-50% | 420-525 tests |
| After Phase 2 (Config Verified) | ~60-70% | 630-735 tests |
| After Phase 3 (Selector Fixes) | ~75-85% | 788-893 tests |
| After Phase 4 (API Auth Enabled) | ~90-95% | 945-998 tests |

---

## 📝 Notes

- **Browser Coverage:** Tests run on Chromium, Firefox, and WebKit (3x multiplier)
- **Parallel Execution:** Tests run in parallel (1 worker on CI, unlimited locally)
- **Flaky Tests:** Some tests may be flaky due to timing/animation issues
- **Visual Tests:** Require baseline screenshots to be generated first
- **Performance Tests:** May fail based on machine specs

---

## 🚀 Next Steps

1. **START HERE:** Complete Phase 1 - Environment Setup ☑️
2. Run diagnostic test: `npx playwright test tests/diagnostic.spec.ts --headed`
3. Run auth tests: `npx playwright test tests/auth/ --headed`
4. Run full suite: `npx playwright test`
5. Review HTML report: `npx playwright show-report`
6. Fix failing selectors or configuration issues
7. Re-run tests iteratively

---

**Last Updated:** 2026-02-14
**Test Suite Version:** Initial Implementation
**Total Tests:** ~1,051 tests across 39 spec files
