import React, { useEffect, useRef } from 'react';

const BubbleBackground: React.FC = () => {
  const interactiveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = interactiveRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      el.style.setProperty('--pointer-x', `${x}px`);
      el.style.setProperty('--pointer-y', `${y}px`);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove as any);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none gradient-bg">
      <svg xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
      <div className="gradients-container">
        <div className="g1" />
        <div className="g2" />
        <div className="g3" />
        <div className="g4" />
        <div className="g5" />
        <div ref={interactiveRef} className="interactive" />
      </div>
    </div>
  );
};

export default BubbleBackground;
