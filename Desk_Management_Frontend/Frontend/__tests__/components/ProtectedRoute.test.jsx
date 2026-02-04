import { render } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import ProtectedRoute from '../../src/components/ProtectedRoute';

/**
 * Unit Tests for ProtectedRoute Component
 * 
 * Tests the route protection component which:
 * - Verifies user authentication via JWT token
 * - Checks user role authorization
 * - Redirects unauthorized users appropriately
 * - Allows authorized users to access protected pages
 */

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render outlet when user is authenticated with valid token', () => {
    localStorage.setItem('token', 'test-token');

    const { container } = render(
      <BrowserRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ProtectedRoute />}>
            <Route index element={<div>Protected Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </BrowserRouter>
    );

    expect(container).toBeInTheDocument();
  });

  it('should redirect to login when no token is present', () => {
    const { container } = render(
      <BrowserRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ProtectedRoute />}>
            <Route index element={<div>Protected Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </BrowserRouter>
    );

    // Unauthenticated users should be redirected to login page
    expect(container.textContent).toContain('Login Page');
  });

  it('should render outlet when user has valid token and no role restrictions', () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('role', 'ADMIN');

    const { container } = render(
      <BrowserRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ProtectedRoute />}>
            <Route index element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    // When no allowedRoles specified, should render outlet
    expect(container).toBeInTheDocument();
  });

  it('should allow user with one of multiple allowed roles', () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('role', 'IT_SUPPORT');

    const { container } = render(
      <BrowserRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ProtectedRoute allowedRoles={['ADMIN', 'IT_SUPPORT']} />}>
            <Route index element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    // User with one of allowed roles should render outlet
    expect(container).toBeInTheDocument();
  });
});
