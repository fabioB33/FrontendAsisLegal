import React, { useState, useEffect } from 'react';
import '@/App.css';
import ComingSoonPage from '@/pages/ComingSoonPage';
import MainPage from '@/pages/MainPage';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const [hasAccess, setHasAccess] = useState(true); // Temporarily true for testing LiveAvatar
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Check if user already has access
    const access = localStorage.getItem('prados_access');
    if (access === 'true') {
      setHasAccess(true);
    }
    setIsChecking(false);
  }, []);

  const handlePasswordCorrect = () => {
    setHasAccess(true);
    
    // Recargar la página para que cargue el widget
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <>
        <ComingSoonPage onPasswordCorrect={handlePasswordCorrect} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="App">
      <MainPage />
      <Toaster />
    </div>
  );
}

export default App;