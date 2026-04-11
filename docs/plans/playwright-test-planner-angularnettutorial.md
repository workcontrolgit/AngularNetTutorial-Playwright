# Playwright Test Planner AngularNet Tutorial

**Plan Name:** playwright-test-planner-angularnettutorial

## Purpose

This is a comprehensive Playwright test plan for the AngularNetTutorial application running at `http://localhost:4200`. The plan covers authentication, role-based access, dashboard navigation, employees, departments, positions, salary ranges, validation, workflows, responsive behavior, accessibility, error handling, and performance.

Each scenario assumes a blank or fresh browser state unless the scenario explicitly states a logged-in role or pre-seeded dataset.

## Application Under Test

- **Frontend:** Angular 20 + Material Design
- **Frontend path:** `C:\apps\AngularNetTutotial\Clients\TalentManagement-Angular-Material`
- **Frontend URL:** `http://localhost:4200`
- **API URL:** `https://localhost:44378`
- **IdentityServer URL:** `https://sts.skoruba.local`
- **Architecture:** CAT Pattern (Client, API Resource, Token Service)

## Required Services

All three services must be running before executing browser tests.

1. Start IdentityServer.
   Success criteria: `https://sts.skoruba.local` is reachable.
2. Start the .NET Web API.
   Success criteria: `https://localhost:44378/swagger` is reachable.
3. Start the Angular client.
   Success criteria: `http://localhost:4200` is reachable.

## Supported Roles And Accounts

Use the configured test users from `config/test-users.json`.

1. **Employee**
   Username: `antoinette16`
   Expected behavior: read-only access to visible modules.
2. **Manager**
   Username: `rosamond33`
   Expected behavior: can create and edit employees and departments; some current UI and route behavior differs by module and must be validated.
3. **HRAdmin**
   Username: `ashtyn1`
   Expected behavior: full administrative access.

## Current App Facts Verified From This Repo

1. Authentication is optional on first load; the app starts in guest mode and login is initiated from the user menu.
2. Login uses browser-based OIDC through IdentityServer.
3. The dashboard is a central navigation surface after login.
4. List pages share common behaviors through `BaseListPage`: table rendering, search, pagination, create/edit/delete button visibility, and empty states.
5. Verified list routes used by page objects:
   - Employees: `/employees`
   - Departments: `/departments`
   - Positions: `/positions`
   - Salary ranges: `/salary-ranges`
6. Department search uses `input[formControlName="Name"]`, not the generic search selector.
7. Position routes have stricter create and edit access than simple menu visibility suggests.
8. Salary range validation includes required fields, numeric minimums, and `min < max` business rules.

## Risks And Known Constraints

1. API authentication behavior is inconsistent in this repo and may allow anonymous access in some environments.
2. Password-grant token acquisition may fail depending on IdentityServer configuration.
3. Role expectations in documentation and actual UI behavior are not perfectly aligned for some modules, especially Positions and Salary Ranges.
4. The test plan should treat route-guard behavior and visible menu/button behavior as separate assertions.

## Test Strategy

1. Prioritize critical user journeys first: guest load, login, dashboard, entity list access, and create/edit/delete permissions.
2. Validate both UI affordances and direct URL access.
3. Use page objects where available for list and form interactions.
4. Prefer browser-based authentication helpers over direct token setup for end-to-end coverage.
5. Keep scenarios independent and reset state between tests.
6. Use seeded or prepared data for large dataset and workflow scenarios.

## Suggested Test Assets

1. Authentication helpers: `fixtures/auth.fixtures.ts`
2. Data helpers: `fixtures/data.fixtures.ts`
3. API setup and cleanup helpers: `fixtures/api.fixtures.ts`
4. Seed test entry point: `tests/seed.spec.ts`
5. Employee POMs: `page-objects/employee-list.page.ts`, `page-objects/employee-form.page.ts`
6. Department POMs: `page-objects/department-list.page.ts`, `page-objects/department-form.page.ts`
7. Position POMs: `page-objects/position-list.page.ts`, `page-objects/position-form.page.ts`
8. Salary range POMs: `page-objects/salary-range-list.page.ts`, `page-objects/salary-range-form.page.ts`

## Scenario Suite 1: Guest Experience And Authentication

### 1.1 Guest landing state

Assumption: fresh browser context.

1. Navigate to `/`.
2. Wait for the page to reach a stable loaded state.
3. Verify the app renders in guest mode.

Expected outcomes:
- A guest or anonymous state is visible.
- The app does not force an immediate redirect loop.
- The user menu is visible and offers a Login action.

Failure conditions:
- Page fails to load.
- Login entry point is missing.
- Unexpected authenticated state appears in a clean session.

### 1.2 Successful login through IdentityServer

Assumption: fresh browser context; valid credentials for each role.

1. Navigate to `/`.
2. Open the user menu.
3. Click Login.
4. Verify redirect to IdentityServer or the login form.
5. Enter credentials.
6. Submit the login form.
7. Verify redirect back to the Angular app.
8. Verify dashboard content is visible.

Expected outcomes:
- Redirect to the STS completes successfully.
- The user returns to the Angular app authenticated.
- Dashboard heading or equivalent landing content is visible.

Failure conditions:
- Redirect never occurs.
- Credentials submit but user remains unauthenticated.
- Callback returns to a broken or blank state.

### 1.3 Logout flow

Assumption: authenticated session for any valid role.

1. Open the user menu.
2. Click Logout.
3. Verify redirect to logout screen.
4. Complete the return link flow back to the Angular app.
5. Verify guest mode is restored.

Expected outcomes:
- Logout completes without orphaned authenticated state.
- Tokens are effectively cleared.
- Guest UI is visible again.

### 1.4 Invalid login handling

Assumption: fresh browser context.

1. Trigger the login flow.
2. Enter invalid credentials.
3. Submit the form.

Expected outcomes:
- Authentication fails cleanly.
- An error message or failed-login state is shown.
- The user is not authenticated on return to the Angular app.

## Scenario Suite 2: Dashboard And Navigation

### 2.1 Dashboard availability by role

Assumption: one test run each for Employee, Manager, and HRAdmin.

1. Login as the target role.
2. Navigate to `/dashboard`.
3. Verify the page heading and main dashboard content load.

Expected outcomes:
- Dashboard loads for all supported roles.
- No role lands on a broken or inaccessible dashboard state.

### 2.2 Sidebar and top navigation

Assumption: authenticated session.

1. Inspect sidebar, toolbar, or top navigation elements.
2. Navigate to Employees.
3. Return to Dashboard.
4. Navigate to Departments.

Expected outcomes:
- Core navigation elements are visible.
- Module links navigate to the correct pages.
- Return to Dashboard is possible from sub-pages.

### 2.3 Role-aware navigation visibility

Assumption: run once per role.

1. Login as Employee and inspect visible menu items.
2. Repeat for Manager.
3. Repeat for HRAdmin.

Expected outcomes:
- Menu items match the intended role access model.
- Hidden modules are either absent or inaccessible.
- Menu visibility and route access mismatches are documented as defects.

## Scenario Suite 3: Employee Management

### 3.1 Employee list load and read operations

Assumption: authenticated session.

1. Navigate to `/employees`.
2. Verify table or list content is visible.
3. Open an employee row or detail target if available.

Expected outcomes:
- Employees list loads successfully.
- Row content is readable.
- Detail navigation or row interaction works if supported.

### 3.2 Employee search and pagination

Assumption: dataset contains multiple employees.

1. Navigate to `/employees`.
2. Search by a known employee value.
3. Clear the search.
4. Change page size if paginator is present.
5. Move to the next page and back.

Expected outcomes:
- Search filters the list correctly.
- Clearing search restores the broader result set.
- Pagination controls work without broken state.

### 3.3 Employee create permissions

Assumption: run once for Employee, Manager, and HRAdmin.

1. Login as the target role.
2. Navigate to `/employees`.
3. Check whether Create is visible.
4. Attempt direct navigation to the create route if one exists.

Expected outcomes:
- Employee cannot create.
- Manager and HRAdmin can create if supported by the current app behavior.
- Hidden button and direct-URL behavior are both validated.

### 3.4 Employee edit and delete permissions

Assumption: dataset contains at least one employee row.

1. Login as each role.
2. Navigate to `/employees`.
3. Verify edit button visibility.
4. Verify delete button visibility.
5. Attempt direct navigation if edit routes are exposed.

Expected outcomes:
- Employee has no edit or delete actions.
- Manager can edit but should not delete.
- HRAdmin can edit and delete.

### 3.5 Employee form validation

Assumption: role with create permission.

1. Open the employee create form.
2. Submit with required fields empty.
3. Enter invalid values for email and any numeric or length-constrained fields.
4. Correct the values and submit valid data.

Expected outcomes:
- Required validation messages appear.
- Invalid formats are rejected.
- Valid submission succeeds.

## Scenario Suite 4: Department Management

### 4.1 Department list and search behavior

Assumption: authenticated session.

1. Navigate to `/departments`.
2. Verify the list loads.
3. Use the department search input.

Expected outcomes:
- Department list renders successfully.
- Search using the `Name` form control filters results correctly.

### 4.2 Department create and edit permissions

Assumption: run once for Employee, Manager, and HRAdmin.

1. Login as the target role.
2. Navigate to `/departments`.
3. Verify create button visibility.
4. Verify edit button visibility if rows exist.

Expected outcomes:
- Employee is read-only.
- Manager can create and edit departments.
- HRAdmin can create and edit departments.

### 4.3 Department validation and relationships

Assumption: role with create permission.

1. Open the create or edit department form.
2. Trigger required field validation.
3. Test parent or related department selection if present.
4. Submit valid data.

Expected outcomes:
- Required validation is visible.
- Parent-child or relationship selection behaves correctly.
- Valid data persists successfully.

## Scenario Suite 5: Position Management

### 5.1 Position list access by role

Assumption: run once for Employee, Manager, and HRAdmin.

1. Login as the target role.
2. Navigate to `/positions`.
3. Verify whether the table loads.

Expected outcomes:
- Employee can view the list without action buttons.
- Manager can view the list.
- HRAdmin can view the list.

### 5.2 Position route guards for create and edit

Assumption: run for Manager and Employee, then HRAdmin.

1. Attempt direct navigation to `/positions/create`.
2. Attempt direct navigation to `/positions/edit/<id>`.
3. Repeat as HRAdmin.

Expected outcomes:
- Manager and Employee are blocked from guarded routes.
- HRAdmin can access guarded create and edit routes.
- Any visible create or edit button that still leads to a blocked route is recorded as a UX defect.

### 5.3 Position action-button visibility

Assumption: rows exist in the list.

1. Login as Employee and inspect action buttons.
2. Repeat as Manager.
3. Repeat as HRAdmin.

Expected outcomes:
- Employee sees no create, edit, or delete actions.
- Manager may see create and edit affordances but must still be validated against route guards.
- HRAdmin has full action visibility.

## Scenario Suite 6: Salary Range Management

### 6.1 Salary range list access

Assumption: run once per role.

1. Login as the target role.
2. Navigate to `/salary-ranges`.
3. Verify page heading and table content.

Expected outcomes:
- HRAdmin access works.
- Manager and Employee behavior is validated against the current application rather than only the written permission model.

### 6.2 Salary range validation rules

Assumption: role with create permission.

1. Open the salary range create form.
2. Trigger required validation for range name.
3. Trigger required validation for min salary.
4. Trigger required validation for max salary.
5. Enter negative values.
6. Enter `min >= max`.
7. Enter `min = 0` with a valid max.
8. Enter an overlong name.

Expected outcomes:
- Required validation appears.
- Negative values are rejected.
- `min >= max` is rejected.
- `min = 0` is accepted.
- Max-length behavior is enforced by truncation or validation.

### 6.3 Salary range CRUD permissions

Assumption: run once per role.

1. Verify create, edit, and delete visibility.
2. Attempt direct navigation to create or edit routes if exposed.

Expected outcomes:
- HRAdmin has full access.
- Other roles are limited according to actual app behavior.

## Scenario Suite 7: Cross-Module Role-Based Access Control

### 7.1 Role matrix verification

Assumption: each role is tested in isolation.

1. Login as Employee and verify read-only behavior on Employees, Departments, Positions, and Salary Ranges.
2. Login as Manager and verify create/edit access for supported modules and lack of delete access.
3. Login as HRAdmin and verify full access across all modules.

Expected outcomes:
- The effective access model is documented accurately.
- Any mismatch between docs, menu visibility, button visibility, and route guards is surfaced.

## Scenario Suite 8: End-To-End Workflows

### 8.1 Manager creates and updates business data

Assumption: Manager session with clean test data namespace.

1. Login as Manager.
2. Create a Department.
3. Create an Employee associated with that Department.
4. Edit the Employee.
5. Verify list and detail views reflect the changes.

Expected outcomes:
- The workflow completes without role violations.
- Related data is visible across modules.

### 8.2 HRAdmin administers restricted modules

Assumption: HRAdmin session.

1. Login as HRAdmin.
2. Create or edit a Position.
3. Create or edit a Salary Range.
4. Verify the created entities appear in their lists.

Expected outcomes:
- Restricted-module administration succeeds for HRAdmin.

## Scenario Suite 9: Error Handling, Accessibility, And Responsive Behavior

### 9.1 Error handling

1. Simulate API failure or network interruption where feasible.
2. Navigate to an affected module.

Expected outcomes:
- User-friendly error states are shown.
- The page does not crash or hang indefinitely.

### 9.2 Accessibility smoke coverage

1. Verify core pages expose visible headings and navigable interactive controls.
2. Exercise keyboard navigation for menus, forms, and dialogs.
3. Validate critical ARIA labels where tests already exist.

Expected outcomes:
- Core flows are usable with keyboard navigation.
- Critical accessibility regressions are caught.

### 9.3 Responsive coverage

1. Run key flows on desktop and mobile-sized viewports.
2. Verify navigation remains usable.
3. Verify tables, forms, and dialogs remain operable.

Expected outcomes:
- No major layout break blocks key tasks.

## Scenario Suite 10: Performance And Large Datasets

### 10.1 Employee list performance

Assumption: seeded large employee dataset.

1. Navigate to `/employees` with a large dataset loaded.
2. Measure initial render time.
3. Measure search, sort, and pagination responsiveness.
4. Observe memory growth over repeated paging or scrolling.

Expected outcomes:
- Render, search, sort, and pagination stay within configured thresholds from `config/test-config.ts`.
- The UI remains interactive.

### 10.2 Department, Position, and Salary Range performance

Assumption: large datasets prepared for each module.

1. Repeat list-load, search, sort, and paging checks for `/departments`, `/positions`, and `/salary-ranges`.
2. Measure any module-specific behavior such as hierarchy expansion or numeric filtering.

Expected outcomes:
- Each module remains usable with large datasets.
- No module shows runaway memory growth or unusable interaction latency.

## Success Criteria For The Planner

1. The plan covers the actual modules present in the repo.
2. The plan distinguishes guest, Employee, Manager, and HRAdmin behavior.
3. The plan validates both visible UI behavior and direct URL access.
4. The plan covers functional, validation, workflow, accessibility, responsive, error, and performance areas.
5. The plan is structured so scenarios can be implemented independently in Playwright specs.
