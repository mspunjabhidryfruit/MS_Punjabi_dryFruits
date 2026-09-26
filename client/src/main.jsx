import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { SiteProvider } from './context/site.jsx';
import { AuthProvider } from './context/auth.jsx';
import { CartProvider } from './context/cart.jsx';
import './styles/global.css';

class Boundary extends React.Component {
  state = { err: null };
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err) { console.error(err); }
  render() {
    if (!this.state.err) return this.props.children;
    return <div style={{ padding: 60, textAlign: 'center', fontFamily: 'sans-serif' }}><h2>Something went wrong</h2><p>Please refresh the page. If the problem continues, contact support.</p><button onClick={() => window.location.reload()} style={{ padding: '10px 24px', borderRadius: 20, border: 0, background: '#ffd02b', fontWeight: 700 }}>Reload</button></div>;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Boundary>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SiteProvider><AuthProvider><CartProvider><App /></CartProvider></AuthProvider></SiteProvider>
      <Toaster position="top-center" toastOptions={{ style: { fontSize: 13 }, duration: 2800 }} />
    </BrowserRouter>
  </Boundary>
);
