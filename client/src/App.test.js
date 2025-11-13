import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app header or brand (at least one occurrence)', () => {
  render(<App />);
  // There are multiple places that include the brand; ensure at least one is present
  const matches = screen.getAllByText(/freelanceconnect/i);
  expect(matches.length).toBeGreaterThan(0);
});
