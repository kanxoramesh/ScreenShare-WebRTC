import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('Client App', () => {
  it('renders screen share button', () => {
    render(<App />);
    expect(screen.getByText(/Start Screen Share/i)).toBeInTheDocument();
  });

  it('shows logs area', () => {
    render(<App />);
    expect(screen.getByText(/Communication Logs/i)).toBeInTheDocument();
  });
});
