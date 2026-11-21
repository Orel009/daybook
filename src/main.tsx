import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/nunito';
import '@fontsource-variable/shantell-sans';
// journal lettering styles (Latin only: the app is English-only for now)
import '@fontsource/caveat/latin-700.css';
import '@fontsource/dancing-script/latin-700.css';
import '@fontsource/pacifico/latin-400.css';
import '@fontsource/amatic-sc/latin-700.css';
import '@fontsource/permanent-marker/latin-400.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/playfair-display/latin-600.css';
import '@fontsource/special-elite/latin-400.css';
import '@fontsource/press-start-2p/latin-400.css';
import './styles.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
