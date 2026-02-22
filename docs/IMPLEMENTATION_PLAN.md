# Playwright Testing Implementation Plan
## Angular .NET Tutorial Project

**Project:** Comprehensive E2E and API Testing Strategy
**Timeline:** 8 Weeks (Phased Approach)
**Status:** 🚀 Ready to Start

---

## 📋 Overview

This plan implements comprehensive Playwright testing for the AngularNetTutorial full-stack application following the CAT (Client, API Resource, Token Service) pattern.

**Key Deliverables:**
- ✅ E2E browser tests for all user workflows
- ✅ API integration tests for all endpoints
- ✅ Authentication & authorization tests
- ✅ Role-based access control validation
- ✅ CI/CD integration

---

## Phase 1: Foundation (Weeks 1-2)
### Goal: Set up infrastructure and critical path tests

### Week 1: Project Setup & Structure

#### 1.1 Repository Setup
- [x] Decide on Git submodule vs monorepo approach
- [x] If submodule: Initialize Git repo for playwright project
- [x] If submodule: Add as submodule to AngularNetTutorial
- [x] Update `.gitignore` for test artifacts
- [x] Create `README.md` with setup instructions

#### 1.2 Directory Structure
- [x] Create `tests/` folder structure:
  - [x] `tests/auth/`
  - [x] `tests/employee-management/`
  - [x] `tests/department-management/`
  - [x] `tests/position-management/`
  - [x] `tests/salary-ranges/`
  - [x] `tests/dashboard/`
  - [x] `tests/api/`
  - [x] `tests/workflows/`
  - [x] `tests/visual/`
- [x] Create `fixtures/` folder
- [x] Create `page-objects/` folder
- [x] Create `utils/` folder
- [x] Create `config/` folder

#### 1.3 Configuration Files
- [x] Update `playwright.config.ts` with baseURL
- [x] Configure multiple reporters (HTML, JUnit, JSON)
- [x] Set up video recording (retain-on-failure)
- [x] Set up screenshot capture (only-on-failure)
- [x] Configure browser projects (chromium, firefox, webkit)
- [x] Add API test project configuration
- [x] Configure webServer for local dev (optional)

#### 1.4 Test Users & Environment
- [x] Create `config/test-users.json` with roles:
  - [x] Employee role credentials
  - [x] Manager role credentials
  - [x] HRAdmin role credentials
- [x] Create `config/environments.json`:
  - [x] Development URLs
  - [x] Staging URLs (if applicable)
  - [x] API endpoint configurations

### Week 2: Core Fixtures & Critical Tests

#### 2.1 Authentication Fixtures
- [x] Create `fixtures/auth.fixtures.ts`:
  - [x] `loginAs(page, username, password)` - Browser login
  - [x] `getApiToken(request, username, password)` - API token
  - [x] `logout(page)` - Logout helper
  - [x] `isAuthenticated(page)` - Check auth state

#### 2.2 Data Fixtures
- [x] Create `fixtures/data.fixtures.ts`:
  - [x] `createEmployeeData(overrides)` - Employee factory
  - [x] `createDepartmentData(overrides)` - Department factory
  - [x] `createPositionData(overrides)` - Position factory
  - [x] `createSalaryRangeData(overrides)` - Salary range factory

#### 2.3 API Helpers
- [x] Create `fixtures/api.fixtures.ts`:
  - [x] `createEmployee(request, token, data)` - API employee creation
  - [x] `deleteEmployee(request, token, id)` - API cleanup
  - [x] `createDepartment(request, token, data)` - API department
  - [x] `deleteDepartment(request, token, id)` - API cleanup

#### 2.4 Critical Path Tests
- [x] Create `tests/auth/login.spec.ts`:
  - [x] Test OIDC login redirect to IdentityServer
  - [x] Test successful login callback
  - [x] Test token storage in session/localStorage
  - [x] Test authenticated state after login
- [x] Create `tests/auth/logout.spec.ts`:
  - [x] Test logout clears tokens
  - [x] Test redirect after logout
- [x] Create `tests/employee-management/employee-smoke.spec.ts`:
  - [x] Test view employee list
  - [x] Test create employee (Manager role)
  - [x] Test view employee detail

#### 2.5 CI/CD Setup
- [x] Create GitHub Actions workflow file (or Azure DevOps)
- [x] Configure test execution on PR
- [x] Set up test report publishing
- [x] Configure artifact storage (videos, screenshots)
- [x] Add status badges to README

---

## Phase 2: Core Features (Weeks 3-4)
### Goal: Cover main CRUD operations

### Week 3: Employee & Department Management

#### 3.1 Employee List Tests
- [x] Create `tests/employee-management/employee-list.spec.ts`:
  - [x] Test pagination controls
  - [x] Test page size changes
  - [x] Test search by employee number
  - [x] Test search by name
  - [x] Test search by email
  - [x] Test autocomplete suggestions
  - [x] Test clear search button
  - [x] Test empty state (no results)

#### 3.2 Employee CRUD Tests
- [x] Create `tests/employee-management/employee-create.spec.ts`:
  - [x] Test successful employee creation (Manager)
  - [x] Test form validation (required fields)
  - [x] Test email format validation
  - [x] Test salary numeric validation
  - [x] Test position dropdown selection
  - [x] Test department dropdown selection
  - [x] Test success notification
  - [x] Test redirect to detail page
- [x] Create `tests/employee-management/employee-edit.spec.ts`:
  - [x] Test navigate to edit form
  - [x] Test form pre-populates with data
  - [x] Test update employee information
  - [x] Test validation on edit
  - [x] Test success notification
- [x] Create `tests/employee-management/employee-delete.spec.ts`:
  - [x] Test delete confirmation dialog
  - [x] Test successful deletion
  - [x] Test employee removed from list
  - [x] Test cancel deletion

#### 3.3 Page Objects
- [x] Create `page-objects/employee-list.page.ts`:
  - [x] `goto()` - Navigate to list
  - [x] `clickCreate()` - Click create button
  - [x] `searchByName(name)` - Search functionality
  - [x] `getEmployeeCount()` - Count rows
  - [x] `clickEmployee(name)` - Click detail link
- [x] Create `page-objects/employee-form.page.ts`:
  - [x] `fillForm(data)` - Fill all fields
  - [x] `submit()` - Submit form
  - [x] `getValidationErrors()` - Get error messages

#### 3.4 Department Tests
- [x] Create `tests/department-management/department-crud.spec.ts`:
  - [x] Test list departments
  - [x] Test create department (Manager)
  - [x] Test edit department
  - [x] Test delete department
  - [x] Test search departments
- [x] Create `tests/department-management/department-validation.spec.ts`:
  - [x] Test required field validation
  - [x] Test duplicate name handling
  - [x] Test relationships with employees

### Week 4: API Integration Tests

#### 4.1 Employee API Tests
- [x] Create `tests/api/employees-api.spec.ts`:
  - [x] Test GET /api/v1/employees (list)
  - [x] Test GET /api/v1/employees/:id (detail)
  - [x] Test POST /api/v1/employees (create with token)
  - [x] Test PUT /api/v1/employees/:id (update with token)
  - [x] Test DELETE /api/v1/employees/:id (admin only)
  - [x] Test 401 Unauthorized (no token)
  - [x] Test 403 Forbidden (wrong role)
  - [x] Test 400 Bad Request (invalid data)
  - [x] Test 404 Not Found (invalid ID)

#### 4.2 Department API Tests
- [x] Create `tests/api/departments-api.spec.ts`:
  - [x] Test GET /api/v1/departments
  - [x] Test POST /api/v1/departments
  - [x] Test PUT /api/v1/departments/:id
  - [x] Test DELETE /api/v1/departments/:id
  - [x] Test error scenarios

#### 4.3 Authentication API Tests
- [x] Create `tests/api/auth-api.spec.ts`:
  - [x] Test token acquisition from IdentityServer
  - [x] Test token validation
  - [x] Test token expiration handling
  - [x] Test invalid credentials
  - [x] Test token refresh (if implemented)

#### 4.4 Token Manager Utility
- [x] Create `utils/token-manager.ts`:
  - [x] `getToken(role)` - Get cached or new token
  - [x] `refreshToken(token)` - Refresh expired token
  - [x] `parseToken(token)` - Decode JWT
  - [x] `isTokenExpired(token)` - Check expiration

---

## Phase 3: Advanced Features (Weeks 5-6)
### Goal: Test complex scenarios

### Week 5: Positions, Salary Ranges & Dashboard

#### 5.1 Position Tests (HRAdmin Only)
- [x] Create `tests/position-management/position-crud.spec.ts`:
  - [x] Test HRAdmin can view positions
  - [x] Test HRAdmin can create position
  - [x] Test HRAdmin can edit position
  - [x] Test HRAdmin can delete position
- [x] Create `tests/position-management/position-rbac.spec.ts`:
  - [x] Test Manager cannot access create
  - [x] Test Employee cannot access create
  - [x] Test unauthorized redirects to 403

#### 5.2 Salary Range Tests
- [x] Create `tests/salary-ranges/salary-range-crud.spec.ts`:
  - [x] Test list salary ranges
  - [x] Test create salary range (HRAdmin)
  - [x] Test edit salary range
  - [x] Test delete salary range
- [x] Create `tests/salary-ranges/salary-range-validation.spec.ts`:
  - [x] Test min/max salary validation
  - [x] Test currency format
  - [x] Test relationship with positions

#### 5.3 Dashboard Tests
- [x] Create `tests/dashboard/dashboard-metrics.spec.ts`:
  - [x] Test dashboard loads
  - [x] Test employee count metric
  - [x] Test department count metric
  - [x] Test position count metric
  - [x] Test gender distribution chart
  - [x] Test salary range chart
- [x] Create `tests/dashboard/dashboard-navigation.spec.ts`:
  - [x] Test "Create Employee" link
  - [x] Test "Create Department" link
  - [x] Test navigation to each module

#### 5.4 Role-Based Access Control
- [x] Create `tests/auth/role-based-access.spec.ts`:
  - [x] Test Employee role:
    - [x] Can view lists
    - [x] Cannot see Create buttons
    - [x] Cannot access create forms
  - [x] Test Manager role:
    - [x] Can create employees
    - [x] Can create departments
    - [x] Cannot access positions
    - [x] Cannot access salary ranges
  - [x] Test HRAdmin role:
    - [x] Full access to all modules
    - [x] Can delete records
    - [x] Can access admin features

### Week 6: End-to-End Workflows

#### 6.1 Complete Workflows
- [x] Create `tests/workflows/complete-employee-workflow.spec.ts`:
  - [x] Login as Manager
  - [x] Create new employee
  - [x] Search for new employee
  - [x] View employee detail
  - [x] Edit employee information
  - [x] Verify changes reflected in list
  - [x] Logout
- [x] Create `tests/workflows/manager-daily-tasks.spec.ts`:
  - [x] Login as Manager
  - [x] Review employee list
  - [x] Create new employee
  - [x] Update existing employee
  - [x] Create new department
  - [x] Assign employee to department
  - [x] Logout
- [x] Create `tests/workflows/hradmin-operations.spec.ts`:
  - [x] Login as HRAdmin
  - [x] Create new salary range
  - [x] Create new position
  - [x] Link position to salary range
  - [x] Create employee in new position
  - [x] Verify all relationships
  - [x] Logout

#### 6.2 Cache Tests
- [x] Create `tests/api/cache-api.spec.ts`:
  - [x] Test cache headers in responses
  - [x] Test cache invalidation endpoint
  - [x] Test cache statistics endpoint
  - [x] Test cache bypass with headers

#### 6.3 Navigation & Routing
- [x] Create `tests/navigation/routing.spec.ts`:
  - [x] Test direct URL access (protected routes)
  - [x] Test browser back button
  - [x] Test breadcrumb navigation
  - [x] Test deep linking
  - [x] Test unauthorized redirects

---

## Phase 4: Polish & Edge Cases (Weeks 7-8)
### Goal: Harden test suite

### Week 7: Error Handling & Edge Cases

#### 7.1 Form Validation Edge Cases
- [x] Create `tests/validation/form-validation.spec.ts`:
  - [x] Test max length validation
  - [x] Test special characters in names
  - [x] Test email format variations
  - [x] Test negative salary values
  - [x] Test zero salary
  - [x] Test extremely large numbers
  - [x] Test SQL injection attempts
  - [x] Test XSS attempts in text fields

#### 7.2 Network Error Handling
- [x] Create `tests/error-handling/network-errors.spec.ts`:
  - [x] Test API timeout handling
  - [x] Test network disconnection
  - [x] Test slow API responses
  - [x] Test error messages display
  - [x] Test retry mechanisms
- [x] Create `tests/error-handling/api-errors.spec.ts`:
  - [x] Test 500 Internal Server Error
  - [x] Test 503 Service Unavailable
  - [x] Test malformed JSON response
  - [x] Test empty response handling

#### 7.3 Authentication Edge Cases
- [x] Create `tests/auth/auth-edge-cases.spec.ts`:
  - [x] Test session expiration during work
  - [x] Test concurrent logins (same user)
  - [x] Test token refresh timing
  - [x] Test invalid token handling
  - [x] Test logout during API call

#### 7.4 Concurrent Operations
- [x] Create `tests/concurrency/concurrent-operations.spec.ts`:
  - [x] Test multiple users creating employees
  - [x] Test simultaneous edit conflicts
  - [x] Test race conditions in forms
  - [x] Test concurrent deletions

### Week 8: Performance, Visual & Accessibility

#### 8.1 Performance Tests
- [x] Create `tests/performance/load-time.spec.ts`:
  - [x] Test dashboard loads < 2 seconds
  - [x] Test employee list loads < 2 seconds
  - [x] Test form submission < 1 second
  - [x] Test search response < 500ms
- [x] Create `tests/performance/large-datasets.spec.ts`:
  - [x] Test pagination with 1000+ records
  - [x] Test search with large dataset
  - [x] Test chart rendering with max data

#### 8.2 Visual Regression Tests
- [x] Create `tests/visual/dashboard-visual.spec.ts`:
  - [x] Baseline screenshot of dashboard
  - [x] Test chart rendering consistency
  - [x] Test responsive layout
- [x] Create `tests/visual/forms-visual.spec.ts`:
  - [x] Baseline screenshots of all forms
  - [x] Test form layout consistency
  - [x] Test error message display

#### 8.3 Accessibility Tests
- [x] Create `tests/accessibility/keyboard-navigation.spec.ts`:
  - [x] Test tab navigation through forms
  - [x] Test Enter key submission
  - [x] Test Escape key cancel
  - [x] Test arrow key navigation in lists
- [x] Create `tests/accessibility/aria-labels.spec.ts`:
  - [x] Test form field ARIA labels
  - [x] Test button ARIA labels
  - [x] Test navigation ARIA labels
  - [x] Test error message ARIA roles

#### 8.4 Mobile/Responsive Tests
- [x] Create `tests/responsive/mobile-layout.spec.ts`:
  - [x] Test mobile viewport (375x667)
  - [x] Test tablet viewport (768x1024)
  - [x] Test mobile menu navigation
  - [x] Test table scrolling on mobile
  - [x] Test form usability on mobile

#### 8.5 Cross-Browser Tests
- [x] Run full test suite on Chromium
- [x] Run full test suite on Firefox
- [x] Run full test suite on WebKit
- [x] Document browser-specific issues
- [x] Fix any cross-browser failures

---

## Documentation & Maintenance

### Documentation
- [ ] Create `docs/SETUP.md` - Setup instructions
- [ ] Create `docs/CONTRIBUTING.md` - Test writing guidelines
- [ ] Create `docs/PAGE_OBJECTS.md` - POM documentation
- [ ] Create `docs/FIXTURES.md` - Fixture usage guide
- [ ] Create `docs/CI_CD.md` - CI/CD pipeline documentation
- [ ] Create `docs/TROUBLESHOOTING.md` - Common issues

### Test Maintenance
- [ ] Set up test review schedule (weekly/monthly)
- [ ] Configure flaky test detection
- [ ] Set up test execution dashboard
- [ ] Create test coverage reports
- [ ] Implement test data cleanup strategy

### Code Quality
- [ ] Add ESLint configuration for test files
- [ ] Add Prettier for code formatting
- [ ] Set up pre-commit hooks
- [ ] Configure TypeScript strict mode
- [ ] Add code review checklist

---

## Success Metrics

### Coverage Goals
- [ ] ✅ 100% critical user paths tested
- [ ] ✅ All CRUD operations verified
- [ ] ✅ All roles tested (Employee, Manager, HRAdmin)
- [ ] ✅ Authentication flows covered
- [ ] ✅ API integration tested
- [ ] ✅ Error scenarios covered

### Quality Metrics
- [ ] ✅ Tests run in <10 minutes
- [ ] ✅ <5% flaky tests
- [ ] ✅ Pass rate >95% on main branch
- [ ] ✅ Test maintenance time <20% of development time
- [ ] ✅ All PRs include test updates

### CI/CD Integration
- [ ] ✅ Tests run on every PR
- [ ] ✅ Tests run on main branch
- [ ] ✅ Deployment blocked if tests fail
- [ ] ✅ Test reports published automatically
- [ ] ✅ Notifications for test failures

---

## Quick Reference

### Run Commands
```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/auth/login.spec.ts

# Run tests by tag
npx playwright test --grep @smoke

# Run tests in UI mode
npx playwright test --ui

# Run tests in headed mode
npx playwright test --headed

# Run tests in specific browser
npx playwright test --project=chromium

# Generate report
npx playwright show-report

# Debug test
npx playwright test --debug
```

### Key Files
- `playwright.config.ts` - Main configuration
- `tests/` - All test files
- `fixtures/` - Reusable test helpers
- `page-objects/` - Page Object Models
- `utils/` - Utility functions
- `config/` - Test configuration files

---

## Notes

**Priority Levels:**
- 🔴 Critical - Must complete before moving to next phase
- 🟡 Important - Should complete but can defer if needed
- 🟢 Nice-to-have - Can skip if time constrained

**Update Log:**
- [Date] - Plan created
- [Add dates as tasks are completed]

---

## Progress Tracker

### Phase 1: Foundation
**Status:** ✅ COMPLETE
**Completion:** 34/34 tasks (100%)

### Phase 2: Core Features
**Status:** ✅ COMPLETE
**Completion:** 78/78 tasks (100%)

### Phase 3: Advanced Features
**Status:** ✅ COMPLETE
**Completion:** 77/77 tasks (100%)

### Phase 4: Polish & Edge Cases
**Status:** ✅ COMPLETE
**Completion:** 56/56 tasks (100%)

### Total Progress
**Overall:** 245/245 tasks (100%) 🎉

---

**Last Updated:** [Current Date]
**Next Review:** [Schedule next review]
