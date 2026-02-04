import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import Navbar from '../../src/components/Navbar';

/**
 * Unit Tests for Navbar Component
 * 
 * Tests the navigation bar component which displays:
 * - Navigation links to main sections
 * - Links to desk list, assign desk, and history pages
 * 
 * These tests verify:
 * 1. Component renders correctly with navigation element
 * 2. All navigation links are present and have correct hrefs
 * 3. Links are properly set up for routing
 */

describe('Navbar Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render the Navbar component', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const navElement = screen.getByRole('navigation');
    expect(navElement).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Desk List')).toBeInTheDocument();
    expect(screen.getByText('Assign Desk')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('should have correct link hrefs', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const deskLink = screen.getByRole('link', { name: /Desk List/i });
    const assignLink = screen.getByRole('link', { name: /Assign Desk/i });
    const historyLink = screen.getByRole('link', { name: /History/i });

    expect(deskLink).toHaveAttribute('href', '/desks');
    expect(assignLink).toHaveAttribute('href', '/assign');
    expect(historyLink).toHaveAttribute('href', '/history');
  });

  it('should render all navigation links as anchor elements', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const links = screen.getAllByRole('link');
    expect(links.length).toBe(3);
  });

  it('should display navigation in a nav element', () => {
    const { container } = render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const nav = container.querySelector('nav');
    expect(nav).not.toBeNull();
    expect(nav.querySelectorAll('a').length).toBe(3);
  });
});
