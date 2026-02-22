# Test Configuration

This directory contains centralized configuration files for the Playwright test suite.

## Files

### test-config.ts

Central configuration for all test settings. Import from this file instead of hardcoding values.

**Benefits:**
- Single source of truth for all configuration
- Easy to update settings across all tests
- Better maintainability
- Consistent values across test suites

## Usage Examples

### Importing Configuration

```typescript
import {
  APP_URLS,
  TIMEOUTS,
  VIEWPORTS,
  SELECTORS,
  TEXT_PATTERNS,
  VISUAL_THRESHOLDS,
  PERFORMANCE,
} from '../config/test-config';
```

### Using URLs

```typescript
// ❌ Before (hardcoded)
await page.goto('http://localhost:4200/dashboard');

// ✅ After (centralized)
import { APP_URLS, getUrl } from '../config/test-config';
await page.goto(getUrl('/dashboard'));
```

### Using Timeouts

```typescript
// ❌ Before (hardcoded)
await page.waitForTimeout(1000);

// ✅ After (centralized)
import { TIMEOUTS } from '../config/test-config';
await page.waitForTimeout(TIMEOUTS.afterNavigation);
```

### Using Viewports

```typescript
// ❌ Before (hardcoded)
await page.setViewportSize({ width: 375, height: 667 });

// ✅ After (centralized)
import { VIEWPORTS } from '../config/test-config';
await page.setViewportSize(VIEWPORTS.mobile);
```

## Configuration Categories

- **APP_URLS**: Application URLs
- **TIMEOUTS**: Standard timeouts (30s, 5s, etc.)
- **VIEWPORTS**: Mobile, tablet, laptop, desktop sizes
- **VISUAL_THRESHOLDS**: Max pixel differences for visual tests
- **SELECTORS**: Common CSS selectors
- **TEXT_PATTERNS**: Regular expressions for text matching
- **PERFORMANCE**: Performance thresholds
- **FEATURES**: Feature flags

See test-config.ts for complete documentation.
