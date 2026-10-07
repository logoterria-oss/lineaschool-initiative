import * as React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { captureUtm } from './lib/utm'

// Запоминаем UTM-метки рекламной кампании до того, как роутер изменит адрес
captureUtm();

createRoot(document.getElementById("root")!).render(<App />);