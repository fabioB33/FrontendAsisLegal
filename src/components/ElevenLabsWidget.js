import { useEffect } from 'react';

const ElevenLabsWidget = () => {
  useEffect(() => {
    // Cargar el script de ElevenLabs
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed@beta';
    script.async = true;
    script.type = 'text/javascript';
    
    script.onload = () => {
      console.log('✅ ElevenLabs script loaded');
      
      // Crear el elemento del widget
      const widgetElement = document.createElement('elevenlabs-convai');
      widgetElement.setAttribute('agent-id', 'agent_0501kbssqc9yecrszw9egnyr29xx');
      
      // Agregar al body
      document.body.appendChild(widgetElement);
      
      console.log('✅ ElevenLabs widget element added');
    };
    
    script.onerror = () => {
      console.error('❌ Error loading ElevenLabs script');
    };
    
    document.head.appendChild(script);
    
    // Cleanup al desmontar el componente
    return () => {
      // Remover widget
      const widget = document.querySelector('elevenlabs-convai');
      if (widget) {
        widget.remove();
      }
      
      // Remover script
      const scriptElement = document.querySelector('script[src*="elevenlabs"]');
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, []);

  return null; // Este componente no renderiza nada visible
};

export default ElevenLabsWidget;
