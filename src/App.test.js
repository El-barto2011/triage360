import { render } from '@testing-library/react';
import App from './App';

// Smoke test: la app monta sin lanzar excepciones.
// Sin sesión guardada, App resuelve a la pantalla de Login.
test('la app monta sin errores', () => {
  const { container } = render(<App />);
  expect(container).toBeTruthy();
});
