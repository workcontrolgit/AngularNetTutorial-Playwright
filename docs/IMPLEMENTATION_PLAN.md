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
- [ ] Decide on Git submodule vs monorepo approach
- [ ] If submodule: Initialize Git repo for playwright project
- [ ] If submodule: Add as submodule to AngularNetTutorial
- [ ] Update `.gitignore` for test artifacts
- [ ] Create `README.md` with setup instructions

#### 1.2 Directory Structure
- [ ] Create `tests/` folder structure:
  - [ ] `tests/auth/`
  - [ ] `tests/employee-management/`
  - [ ] `tests/department-management/`
  - [ ] `tests/position-management/`
  - [ ] `tests/salary-ranges/`
  - [ ] `tests/dashboard/`
  - [ ] `tests/api/`
  - [ ] `tests/workflows/`
  - [ ] `tests/visual/`
- [ ] Create `fixtures/` folder
- [ ] Create `page-objects/` folder
- [ ] Create `utils/` folder
- [ ] Create `config/` folder

#### 1.3 Configuration Files
- [ ] Update `playwright.config.ts` with baseURL
- [ ] Configure multiple reporters (HTML, JUnit, JSON)
- [ ] Set up video recording (retain-on-failure)
- [ ] Set up screenshot capture (only-on-failure)
- [ ] Configure browser projects (chromium, firefox, webkit)
- [ ] Add API test project configuration
- [ ] Configure webServer for local dev (optional)

#### 1.4 Test Users & Environment
- [ ] Create `config/test-users.json` with roles:
  - [ ] Employee role credentials
  - [ ] Manager role credentials
  - [ ] HRAdmin role credentials
- [ ] Create `config/environments.json`:
  - [ ] Development URLs
  - [ ] Staging URLs (if applicable)
  - [ ] API endpoint configurations

### Week 2: Core Fixtures & Critical Tests

#### 2.1 Authentication Fixtures
- [ ] Create `fixtures/auth.fixtures.ts`:
  - [ ] `loginAs(page, username, password)` - Browser login
  - [ ] `getApiToken(request, username, password)` - API token
  - [ ] `logout(page)` - Logout helper
  - [ ] `isAuthenticated(page)` - Check auth state

#### 2.2 Data Fixtures
- [ ] Create `fixtures/data.fixtures.ts`:
  - [ ] `createEmployeeData(overrides)` - Employee factory
  - [ ] `createDepartmentData(overrides)` - Department factory
  - [ ] `createPositionData(overrides)` - Position factory
  - [ ] `createSalaryRangeData(overrides)` - Salary range factory

#### 2.3 API Helpers
- [ ] Create `fixtures/api.fixtures.ts`:
  - [ ] `createEmployee(request, token, data)` - API employee creation
  - [ ] `deleteEmployee(request, token, id)` - API cleanup
  - [ ] `createDepartment(request, token, data)` - API department
  - [ ] `deleteDepartment(request, token, id)` - API cleanup

#### 2.4 Critical Path Tests
- [ ] Create `tests/auth/login.spec.ts`:
  - [ ] Test OIDC login redirect to IdentityServer
  - [ ] Test successful login callback
  - [ ] Test token storage in session/localStorage
  - [ ] Test authenticated state after login
- [ ] Create `tests/auth/logout.spec.ts`:
  - [ ] Test logout clears tokens
  - [ ] Test redirect after logout
- [ ] Create `tests/employee-management/employee-smoke.spec.ts`:
  - [ ] Test view employee list
  - [ ] Test create employee (Manager role)
  - [ ] Test view employee detail

#### 2.5 CI/CD Setup
- [ ] Create GitHub Actions workflow file (or Azure DevOps)
- [ ] Configure test execution on PR
- [ ] Set up test report publishing
- [ ] Configure artifact storage (videos, screenshots)
- [ ] Add status badges to README

---

## Phase 2: Core Features (Weeks 3-4)
### Goal: Cover main CRUD operations

### Week 3: Employee & Department Management

#### 3.1 Employee List Tests
- [ ] Create `tests/employee-management/employee-list.spec.ts`:
  - [ ] Test pagination controls
  - [ ] Test page size changes
  - [ ] Test search by employee number
  - [ ] Test search by name
  - [ ] Test search by email
  - [ ] Test autocomplete suggestions
  - [ ] Test clear search button
  - [ ] Test empty state (no results)

#### 3.2 Employee CRUD Tests
- [ ] Create `tests/employee-management/employee-create.spec.ts`:
  - [ ] Test successful employee creation (Manager)
  - [ ] Test form validation (required fields)
  - [ ] Test email format validation
  - [ ] Test salary numeric validation
  - [ ] Test position dropdown selection
  - [ ] Test department dropdown selection
  - [ ] Test success notification
  - [ ] Test redirect to detail page
- [ ] Create `tests/employee-management/employee-edit.spec.ts`:
  - [ ] Test navigate to edit form
  - [ ] Test form pre-populates with data
  - [ ] Test update employee information
  - [ ] Test validation on edit
  - [ ] Test success notification
- [ ] Create `tests/employee-management/employee-delete.spec.ts`:
  - [ ] Test delete confirmation dialog
  - [ ] Test successful deletion
  - [ ] Test employee removed from list
  - [ ] Test cancel deletion

#### 3.3 Page Objects
- [ ] Create `page-objects/employee-list.page.ts`:
  - [ ] `goto()` - Navigate to list
  - [ ] `clickCreate()` - Click create button
  - [ ] `searchByName(name)` - Search functionality
  - [ ] `getEmployeeCount()` - Count rows
  - [ ] `clickEmployee(name)` - Click detail link
- [ ] Create `page-objects/employee-form.page.ts`:
  - [ ] `fillForm(data)` - Fill all fields
  - [ ] `submit()` - Submit form
  - [ ] `getValidationErrors()` - Get error messages

#### 3.4 Department Tests
- [ ] Create `tests/department-management/department-crud.spec.ts`:
  - [ ] Test list departments
  - [ ] Test create department (Manager)
  - [ ] Test edit department
  - [ ] Test delete department
  - [ ] Test search departments
- [ ] Create `tests/department-management/department-validation.spec.ts`:
  - [ ] Test required field validation
  - [ ] Test duplicate name handling
  - [ ] Test relationships with employees

### Week 4: API Integration Tests

#### 4.1 Employee API Tests
- [ ] Create `tests/api/employees-api.spec.ts`:
  - [ ] Test GET /api/v1/employees (list)
  - [ ] Test GET /api/v1/employees/:id (detail)
  - [ ] Test POST /api/v1/employees (create with token)
  - [ ] Test PUT /api/v1/employees/:id (update with token)
  - [ ] Test DELETE /api/v1/employees/:id (admin only)
  - [ ] Test 401 Unauthorized (no token)
  - [ ] Test 403 Forbidden (wrong role)
  - [ ] Test 400 Bad Request (invalid data)
  - [ ] Test 404 Not Found (invalid ID)

#### 4.2 Department API Tests
- [ ] Create `tests/api/departments-api.spec.ts`:
  - [ ] Test GET /api/v1/departments
  - [ ] Test POST /api/v1/departments
  - [ ] Test PUT /api/v1/departments/:id
  - [ ] Test DELETE /api/v1/departments/:id
  - [ ] Test error scenarios

#### 4.3 Authentication API Tests
- [ ] Create `tests/api/auth-api.spec.ts`:
  - [ ] Test token acquisition from IdentityServer
  - [ ] Test token validation
  - [ ] Test token expiration handling
  - [ ] Test invalid credentials
  - [ ] Test token refresh (if implemented)

#### 4.4 Token Manager Utility
- [ ] Create `utils/token-manager.ts`:
  - [ ] `getToken(role)` - Get cached or new token
  - [ ] `refreshToken(token)` - Refresh expired token
  - [ ] `parseToken(token)` - Decode JWT
  - [ ] `isTokenExpired(token)` - Check expiration

---

## Phase 3: Advanced Features (Weeks 5-6)
### Goal: Test complex scenarios

### Week 5: Positions, Salary Ranges & Dashboard

#### 5.1 Position Tests (HRAdmin Only)
- [ ] Create `tests/position-management/position-crud.spec.ts`:
  - [ ] Test HRAdmin can view positions
  - [ ] Test HRAdmin can create position
  - [ ] Test HRAdmin can edit position
  - [ ] Test HRAdmin can delete position
- [ ] Create `tests/position-management/position-rbac.spec.ts`:
  - [ ] Test Manager cannot access create
  - [ ] Test Employee cannot access create
  - [ ] Test unauthorized redirects to 403

#### 5.2 Salary Range Tests
- [ ] Create `tests/salary-ranges/salary-range-crud.spec.ts`:
  - [ ] Test list salary ranges
  - [ ] Test create salary range (HRAdmin)
  - [ ] Test edit salary range
  - [ ] Test delete salary range
- [ ] Create `tests/salary-ranges/salary-range-validation.spec.ts`:
  - [ ] Test min/max salary validation
  - [ ] Test currency format
  - [ ] Test relationship with positions

#### 5.3 Dashboard Tests
- [ ] Create `tests/dashboard/dashboard-metrics.spec.ts`:
  - [ ] Test dashboard loads
  - [ ] Test employee count metric
  - [ ] Test department count metric
  - [ ] Test position count metric
  - [ ] Test gender distribution chart
  - [ ] Test salary range chart
- [ ] Create `tests/dashboard/dashboard-navigation.spec.ts`:
  - [ ] Test "Create Employee" link
  - [ ] Test "Create Department" link
  - [ ] Test navigation to each module

#### 5.4 Role-Based Access Control
- [ ] Create `tests/auth/role-based-access.spec.ts`:
  - [ ] Test Employee role:
    - [ ] Can view lists
    - [ ] Cannot see Create buttons
    - [ ] Cannot access create forms
  - [ ] Test Manager role:
    - [ ] Can create employees
    - [ ] Can create departments
    - [ ] Cannot access positions
    - [ ] Cannot access salary ranges
  - [ ] Test HRAdmin role:
    - [ ] Full access to all modules
    - [ ] Can delete records
    - [ ] Can access admin features

### Week 6: End-to-End Workflows

#### 6.1 Complete Workflows
- [ ] Create `tests/workflows/complete-employee-workflow.spec.ts`:
  - [ ] Login as Manager
  - [ ] Create new employee
  - [ ] Search for new employee
  - [ ] View employee detail
  - [ ] Edit employee information
  - [ ] Verify changes reflected in list
  - [ ] Logout
- [ ] Create `tests/workflows/manager-daily-tasks.spec.ts`:
  - [ ] Login as Manager
  - [ ] Review employee list
  - [ ] Create new employee
  - [ ] Update existing employee
  - [ ] Create new department
  - [ ] Assign employee to department
  - [ ] Logout
- [ ] Create `tests/workflows/hradmin-operations.spec.ts`:
  - [ ] Login as HRAdmin
  - [ ] Create new salary range
  - [ ] Create new position
  - [ ] Link position to salary range
  - [ ] Create employee in new position
  - [ ] Verify all relationships
  - [ ] Logout

#### 6.2 Cache Tests
- [ ] Create `tests/api/cache-api.spec.ts`:
  - [ ] Test cache headers in responses
  - [ ] Test cache invalidation endpoint
  - [ ] Test cache statistics endpoint
  - [ ] Test cache bypass with headers

#### 6.3 Navigation & Routing
- [ ] Create `tests/navigation/routing.spec.ts`:
  - [ ] Test direct URL access (protected routes)
  - [ ] Test browser back button
  - [ ] Test breadcrumb navigation
  - [ ] Test deep linking
  - [ ] Test unauthorized redirects

---

## Phase 4: Polish & Edge Cases (Weeks 7-8)
### Goal: Harden test suite

### Week 7: Error Handling & Edge Cases

#### 7.1 Form Validation Edge Cases
- [ ] Create `tests/validation/form-validation.spec.ts`:
  - [ ] Test max length validation
  - [ ] Test special characters in names
  - [ ] Test email format variations
  - [ ] Test negative salary values
  - [ ] Test zero salary
  - [ ] Test extremely large numbers
  - [ ] Test SQL injection attempts
  - [ ] Test XSS attempts in text fields

#### 7.2 Network Error Handling
- [ ] Create `tests/error-handling/network-errors.spec.ts`:
  - [ ] Test API timeout handling
  - [ ] Test network disconnection
  - [ ] Test slow API responses
  - [ ] Test error messages display
  - [ ] Test retry mechanisms
- [ ] Create `tests/error-handling/api-errors.spec.ts`:
  - [ ] Test 500 Internal Server Error
  - [ ] Test 503 Service Unavailable
  - [ ] Test malformed JSON response
  - [ ] Test empty response handling

#### 7.3 Authentication Edge Cases
- [ ] Create `tests/auth/auth-edge-cases.spec.ts`:
  - [ ] Test session expiration during work
  - [ ] Test concurrent logins (same user)
  - [ ] Test token refresh timing
  - [ ] Test invalid token handling
  - [ ] Test logout during API call

#### 7.4 Concurrent Operations
- [ ] Create `tests/concurrency/concurrent-operations.spec.ts`:
  - [ ] Test multiple users creating employees
  - [ ] Test simultaneous edit conflicts
  - [ ] Test race conditions in forms
  - [ ] Test concurrent deletions

### Week 8: Performance, Visual & Accessibility

#### 8.1 Performance Tests
- [ ] Create `tests/performance/load-time.spec.ts`:
  - [ ] Test dashboard loads < 2 seconds
  - [ ] Test employee list loads < 2 seconds
  - [ ] Test form submission < 1 second
  - [ ] Test search response < 500ms
- [ ] Create `tests/performance/large-datasets.spec.ts`:
  - [ ] Test pagination with 1000+ records
  - [ ] Test search with large dataset
  - [ ] Test chart rendering with max data

#### 8.2 Visual Regression Tests
- [ ] Create `tests/visual/dashboard-visual.spec.ts`:
  - [ ] Baseline screenshot of dashboard
  - [ ] Test chart rendering consistency
  - [ ] Test responsive layout
- [ ] Create `tests/visual/forms-visual.spec.ts`:
  - [ ] Baseline screenshots of all forms
  - [ ] Test form layout consistency
  - [ ] Test error message display

#### 8.3 Accessibility Tests
- [ ] Create `tests/accessibility/keyboard-navigation.spec.ts`:
  - [ ] Test tab navigation through forms
  - [ ] Test Enter key submission
  - [ ] Test Escape key cancel
  - [ ] Test arrow key navigation in lists
- [ ] Create `tests/accessibility/aria-labels.spec.ts`:
  - [ ] Test form field ARIA labels
  - [ ] Test button ARIA labels
  - [ ] Test navigation ARIA labels
  - [ ] Test error message ARIA roles

#### 8.4 Mobile/Responsive Tests
- [ ] Create `tests/responsive/mobile-layout.spec.ts`:
  - [ ] Test mobile viewport (375x667)
  - [ ] Test tablet viewport (768x1024)
  - [ ] Test mobile menu navigation
  - [ ] Test table scrolling on mobile
  - [ ] Test form usability on mobile

#### 8.5 Cross-Browser Tests
- [ ] Run full test suite on Chromium
- [ ] Run full test suite on Firefox
- [ ] Run full test suite on WebKit
- [ ] Document browser-specific issues
- [ ] Fix any cross-browser failures

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
**Status:** ⏳ Not Started
**Completion:** 0/34 tasks

### Phase 2: Core Features
**Status:** 🔒 Locked (Complete Phase 1 first)
**Completion:** 0/37 tasks

### Phase 3: Advanced Features
**Status:** 🔒 Locked (Complete Phase 2 first)
**Completion:** 0/30 tasks

### Phase 4: Polish & Edge Cases
**Status:** 🔒 Locked (Complete Phase 3 first)
**Completion:** 0/25 tasks

### Total Progress
**Overall:** 0/126 tasks (0%)

---

**Last Updated:** [Current Date]
**Next Review:** [Schedule next review]
