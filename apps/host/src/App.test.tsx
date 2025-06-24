import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('Host App', () => {
  it('renders screen share view', () => {
    render(<App />);
    expect(screen.getByText(/Screen Share View/i)).toBeInTheDocument();
  });
});
