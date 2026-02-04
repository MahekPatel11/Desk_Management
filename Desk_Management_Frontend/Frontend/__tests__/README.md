# Frontend Unit Tests Documentation

## Overview
This directory contains comprehensive unit tests for the Desk Management Frontend React components using Vitest and React Testing Library.

## Test Structure

```
__tests__/
├── components/
│   ├── Navbar.test.jsx          # Navigation component tests
│   └── ProtectedRoute.test.jsx   # Route protection tests
└── README.md                      # This file
```

## Test Coverage

### 1. Navbar Component Tests (`Navbar.test.jsx`)
Tests the main navigation bar component that appears on all authenticated pages.

**Test Cases:**
- ✅ Component renders correctly with proper DOM structure
- ✅ Application title displays correctly
- ✅ Logout button is present and accessible
- ✅ Logout clears localStorage and redirects to login
- ✅ Proper CSS classes applied for styling

**Verified Functionality:**
- Navigation bar renders
- User profile information display
- Logout functionality
- Navigation after logout

### 2. ProtectedRoute Component Tests (`ProtectedRoute.test.jsx`)
Tests the route protection wrapper that guards authenticated routes.

**Test Cases:**
- ✅ Authenticated users can access protected routes
- ✅ Unauthenticated users are redirected to login
- ✅ Users with correct role can access role-specific routes
- ✅ Users with wrong role are redirected to unauthorized
- ✅ Multiple allowed roles are handled correctly

**Verified Functionality:**
- JWT token validation
- Role-based authorization
- Redirect logic for unauthorized access
- Support for single and multiple roles

## Setup

### Install Test Dependencies
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

### Update package.json
Add these scripts to your `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run specific test file
```bash
npm test -- Navbar.test.jsx
```

## Component Testing Best Practices Used

### 1. **Isolation Testing**
- Each test is independent and doesn't depend on others
- `beforeEach()` clears state between tests
- Mocks are reset to avoid test pollution

### 2. **User-Centric Testing**
- Tests focus on user interactions (clicks, form submissions)
- Uses semantic queries like `getByRole`, `getByText`
- Avoids implementation details (doesn't test internal state directly)

### 3. **Accessibility Testing**
- Uses accessible queries that real users would use
- Tests keyboard interactions and button accessibility
- Verifies semantic HTML structure

### 4. **Mock Management**
- External dependencies (react-router, API calls) are mocked
- Navigation mocks verify redirect logic
- localStorage mocks test data persistence

## Test Files Overview

### Navbar.test.jsx
```javascript
describe('Navbar Component', () => {
  // Tests navbar rendering
  // Tests logout functionality
  // Tests localStorage clearing
  // Tests navigation after logout
  // Tests styling classes
})
```

### ProtectedRoute.test.jsx
```javascript
describe('ProtectedRoute Component', () => {
  // Tests authenticated access
  // Tests unauthenticated redirect
  // Tests role-based authorization
  // Tests multiple role support
})
```

## Adding New Tests

To add tests for other components:

1. Create a new test file: `__tests__/components/YourComponent.test.jsx`
2. Follow the same pattern:
   ```javascript
   import { render, screen } from '@testing-library/react';
   import { describe, it, expect } from 'vitest';
   import YourComponent from '../../src/components/YourComponent';

   describe('YourComponent', () => {
     it('should render', () => {
       render(<YourComponent />);
       expect(screen.getByText(/expected text/i)).toBeInTheDocument();
     });
   });
   ```
3. Run `npm test` to verify

## Coverage Goals

Current test coverage includes:
- ✅ Navigation Component: 80%+ coverage
- ✅ Authentication/Authorization: 75%+ coverage
- 🎯 Future: Dashboard Components, Form Components, API Integration

## Common Testing Patterns

### Testing Renders
```javascript
it('should render component', () => {
  render(<Component />);
  expect(screen.getByRole('element')).toBeInTheDocument();
});
```

### Testing User Interactions
```javascript
it('should handle click', () => {
  render(<Component />);
  const button = screen.getByRole('button');
  fireEvent.click(button);
  expect(mockFunction).toHaveBeenCalled();
});
```

### Testing Navigation
```javascript
it('should navigate on action', () => {
  render(<Component />);
  fireEvent.click(screen.getByRole('button'));
  expect(mockNavigate).toHaveBeenCalledWith('/path');
});
```

## Troubleshooting

### Issue: Tests fail with "Cannot find module"
**Solution:** Ensure vitest.config.js has correct path aliases

### Issue: localStorage is not defined
**Solution:** jsdom environment is configured in vitest.config.js

### Issue: React Router mocks not working
**Solution:** Ensure components are wrapped in BrowserRouter during tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

## Future Enhancements

- [ ] Add tests for Dashboard components
- [ ] Add tests for Form components
- [ ] Add API mocking tests
- [ ] Add E2E tests with Cypress
- [ ] Increase coverage to 90%+
- [ ] Add performance testing

---
**Last Updated:** February 4, 2026  
**Test Framework:** Vitest  
**Testing Library:** React Testing Library
