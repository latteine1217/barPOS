import { useEffect, useState } from 'react';

interface Bubble {
  id: number;
  size: number;
  x: number;
  y: number;
  opacity: number;
  duration: number;
}

const BubbleBackground = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    // 創建隨機位置的小泡泡
    const createBubbles = (): void => {
      const bubbleArray: Bubble[] = [];
      for (let i = 0; i < 20; i++) {
        bubbleArray.push({
          id: i,
          size: Math.random() * 80 + 30, // 30-110px
          x: Math.random() * 100, // 0-100%
          y: Math.random() * 100, // 0-100%
          opacity: Math.random() * 0.4 + 0.2, // 0.2-0.6
          duration: Math.random() * 25 + 15 // 15-40s
        });
      }
      setBubbles(bubbleArray);
    };

    createBubbles();
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
      {/* 主要漸層背景 - 增強對比 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-gray-950"></div>
      
      {/* 大型漸層泡泡 */}
      <div className="gradient-background">
        <div className="gradient-blob"></div>
        <div className="gradient-blob"></div>
        <div className="gradient-blob"></div>
        <div className="gradient-blob"></div>
      </div>
      
      {/* 小型浮動泡泡 - 增強可見度 */}
      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          className="floating-bubble animate-float"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.x}%`,
            top: `${bubble.y}%`,
            opacity: bubble.opacity,
            animationDuration: `${bubble.duration}s`,
            animationDelay: `${Math.random() * -20}s`,
            background: `radial-gradient(circle, rgba(255, 255, 255, ${bubble.opacity * 0.8}) 0%, rgba(255, 255, 255, ${bubble.opacity * 0.3}) 60%, transparent 100%)`,
            filter: 'blur(1.5px)'
          }}
        />
      ))}
      
      {/* 額外的漸層重疊效果 - 增強深度 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-purple-900/15 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/15 via-transparent to-pink-900/15"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-slate-800/10 to-slate-900/20"></div>
    </div>
  );
};

export default BubbleBackground;