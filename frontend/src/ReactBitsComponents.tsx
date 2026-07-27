import React, { useEffect, useRef, useState } from 'react';

/* ─────────────────────────────────────────────────────────────
   GlitchText  — ReactBits-inspired pure CSS glitch animation
   Usage: <GlitchText>DASHBOARD</GlitchText>
   ───────────────────────────────────────────────────────────── */
export const GlitchText: React.FC<{
  children: string;
  className?: string;
  speed?: number;
  color?: string;
  enableOnHover?: boolean;
  fontSize?: string;
}> = ({ children, className = '', speed = 1, color = '#fff', enableOnHover = false, fontSize }) => {
  return (
    <span
      className={`rb-glitch ${enableOnHover ? 'rb-glitch-hover' : ''} ${className}`}
      data-text={children}
      style={{
        '--after-duration': `${speed * 3}s`,
        '--before-duration': `${speed * 2}s`,
        color,
        fontSize,
      } as React.CSSProperties}
    >
      {children}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────
   ShinyText  — animated shine sweep effect on text
   Usage: <ShinyText>ACTIVE</ShinyText>
   ───────────────────────────────────────────────────────────── */
export const ShinyText: React.FC<{
  children: React.ReactNode;
  className?: string;
  speed?: number;
  color?: string;
  shineColor?: string;
  disabled?: boolean;
}> = ({ children, className = '', speed = 3, color = '#b5b5b5', shineColor = '#ffffff', disabled = false }) => {
  return (
    <span
      className={`rb-shiny ${disabled ? 'rb-shiny-disabled' : ''} ${className}`}
      style={{
        backgroundImage: `linear-gradient(120deg, ${color} 40%, ${shineColor} 50%, ${color} 60%)`,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: disabled ? 'none' : `rb-shine ${speed}s linear infinite`,
        display: 'inline-block',
      } as React.CSSProperties}
    >
      {children}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────
   GradientText  — animated CSS gradient sweep on text
   ───────────────────────────────────────────────────────────── */
export const GradientText: React.FC<{
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  speed?: number;
  fontSize?: string;
  fontWeight?: string | number;
}> = ({
  children,
  className = '',
  colors = ['#00f2fe', '#9b51e0', '#00ff88', '#00f2fe'],
  speed = 5,
  fontSize,
  fontWeight = 700,
}) => {
  const gradient = colors.join(', ');
  return (
    <span
      className={`rb-gradient-text ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg, ${gradient})`,
        backgroundSize: '300% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: `rb-gradient-sweep ${speed}s linear infinite`,
        display: 'inline-block',
        fontWeight,
        fontSize,
      } as React.CSSProperties}
    >
      {children}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────
   CountUp — animates a number from 0 to target value
   ───────────────────────────────────────────────────────────── */
export const CountUp: React.FC<{
  target: number;
  duration?: number;
  className?: string;
  suffix?: string;
}> = ({ target, duration = 1200, className = '', suffix = '' }) => {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return <span className={`rb-countup ${className}`}>{value.toLocaleString()}{suffix}</span>;
};

/* ─────────────────────────────────────────────────────────────
   FloatingOrbs — ambient glowing animated background orbs
   ───────────────────────────────────────────────────────────── */
export const FloatingOrbs: React.FC<{ count?: number }> = ({ count = 4 }) => {
  const orbs = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: `${10 + (i * 22) % 80}%`,
    y: `${15 + (i * 17) % 70}%`,
    size: 200 + (i * 80) % 200,
    color: ['rgba(0,242,254,0.04)', 'rgba(155,81,224,0.05)', 'rgba(0,255,136,0.03)', 'rgba(0,242,254,0.06)'][i % 4],
    delay: i * 1.5,
    duration: 8 + i * 2,
  }));

  return (
    <div className="rb-orbs-container" aria-hidden="true">
      {orbs.map(orb => (
        <div
          key={orb.id}
          className="rb-orb"
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            animationDelay: `${orb.delay}s`,
            animationDuration: `${orb.duration}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   GlowCard — glass card with animated glow on hover
   ───────────────────────────────────────────────────────────── */
export const GlowCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glowColor?: string;
}> = ({ children, className = '', style, glowColor = 'rgba(0, 242, 254, 0.15)' }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      className={`glass-card rb-glow-card ${className}`}
      style={{
        transition: 'box-shadow 0.35s ease, border-color 0.35s ease, transform 0.2s ease',
        boxShadow: isHovered ? `0 0 24px ${glowColor}, 0 8px 32px rgba(0,0,0,0.3)` : '0 4px 20px rgba(0,0,0,0.2)',
        borderColor: isHovered ? 'rgba(0,242,254,0.2)' : undefined,
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        ...style,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MagneticButton — button with magnetic hover pull effect
   ───────────────────────────────────────────────────────────── */
export const MagneticButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  strength?: number;
}> = ({ children, className = '', style, onClick, type = 'button', strength = 0.4 }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setPos({ x: (e.clientX - cx) * strength, y: (e.clientY - cy) * strength });
  };

  const handleMouseLeave = () => setPos({ x: 0, y: 0 });

  return (
    <button
      ref={ref}
      type={type}
      className={className}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: pos.x === 0 && pos.y === 0 ? 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'transform 0.1s ease',
        ...style,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
