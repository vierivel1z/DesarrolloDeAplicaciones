import './bootstrap';
import '../css/app.css';

import React from 'react';
import ReactDOM from 'react-dom/client';

// OJO AQUÍ: Le decimos que salga de resources y busque en la carpeta src
import App from '../../src/App'; 

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);