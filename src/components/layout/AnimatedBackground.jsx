import { useEffect, useRef, useState } from 'react';

// ── STAR FIELD + MOON (midnight theme) ───────────────────────────────────
function StarField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId, width, height;
    const NUM_STARS = 180;
    const stars = [];

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    function initStars() {
      stars.length = 0;
      for (let i = 0; i < NUM_STARS; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.4 + 0.3,
          speed: Math.random() * 0.12 + 0.03,
          opacity: Math.random() * 0.6 + 0.2,
          twinkleSpeed: Math.random() * 0.008 + 0.003,
          twinkleOffset: Math.random() * Math.PI * 2,
          dx: (Math.random() - 0.5) * 0.04,
        });
      }
    }

    let shootingStar = null;
    let nextShoot = Date.now() + 3000 + Math.random() * 5000;

    function spawnShootingStar() {
      shootingStar = {
        x: Math.random() * width * 0.7,
        y: Math.random() * height * 0.3,
        len: 120 + Math.random() * 80,
        speed: 6 + Math.random() * 4,
        angle: Math.PI / 5 + (Math.random() - 0.5) * 0.3,
        progress: 0,
      };
      nextShoot = Date.now() + 4000 + Math.random() * 6000;
    }

    // Moon properties — fixed position top-right
    const moon = { x: 0, y: 0, r: 38 };

    let t = 0;
    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Moon position
      moon.x = width * 0.82;
      moon.y = 70;

      // Moon glow
      const glowGrad = ctx.createRadialGradient(moon.x, moon.y, moon.r, moon.x, moon.y, moon.r * 3);
      glowGrad.addColorStop(0, 'rgba(200, 220, 255, 0.15)');
      glowGrad.addColorStop(1, 'rgba(200, 220, 255, 0)');
      ctx.beginPath();
      ctx.arc(moon.x, moon.y, moon.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // Moon body
      const moonGrad = ctx.createRadialGradient(moon.x - 8, moon.y - 8, 2, moon.x, moon.y, moon.r);
      moonGrad.addColorStop(0, 'rgba(240, 248, 255, 0.95)');
      moonGrad.addColorStop(0.6, 'rgba(200, 220, 255, 0.85)');
      moonGrad.addColorStop(1, 'rgba(160, 190, 240, 0.7)');
      ctx.beginPath();
      ctx.arc(moon.x, moon.y, moon.r, 0, Math.PI * 2);
      ctx.fillStyle = moonGrad;
      ctx.fill();

      // Crescent shadow — gives it the classic crescent moon look
      ctx.beginPath();
      ctx.arc(moon.x + 14, moon.y - 6, moon.r * 0.82, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(10, 15, 30, 0.88)';
      ctx.fill();

      // Moon craters (subtle)
      [[moon.x - 10, moon.y + 8, 4], [moon.x - 18, moon.y - 5, 3], [moon.x - 8, moon.y + 20, 2.5]].forEach(([cx, cy, cr]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(150, 175, 220, 0.25)';
        ctx.fill();
      });

      // Stars
      stars.forEach(s => {
        const twinkle = Math.sin(t * s.twinkleSpeed * 60 + s.twinkleOffset);
        const alpha = s.opacity + twinkle * 0.25;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.05, Math.min(1, alpha))})`;
        ctx.fill();
        s.x += s.dx;
        s.y -= s.speed * 0.3;
        if (s.y < -2) { s.y = height + 2; s.x = Math.random() * width; }
        if (s.x < -2) s.x = width + 2;
        if (s.x > width + 2) s.x = -2;
      });

      // Shooting star
      if (Date.now() > nextShoot && !shootingStar) spawnShootingStar();
      if (shootingStar) {
        const ss = shootingStar;
        ss.progress += ss.speed;
        const ex = ss.x + Math.cos(ss.angle) * ss.progress;
        const ey = ss.y + Math.sin(ss.angle) * ss.progress;
        const sx = ex - Math.cos(ss.angle) * ss.len;
        const sy = ey - Math.sin(ss.angle) * ss.len;
        const fade = Math.max(0, 1 - ss.progress / (ss.len * 2.5));
        const grad = ctx.createLinearGradient(sx, sy, ex, ey);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(1, `rgba(255,255,255,${fade * 0.9})`);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if (ss.progress > ss.len * 3 || fade <= 0) shootingStar = null;
      }

      t++;
      animId = requestAnimationFrame(draw);
    }

    resize();
    initStars();
    draw();
    window.addEventListener('resize', () => { resize(); initStars(); });
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.75 }} />;
}

// ── SUN (sunrise/light theme) ─────────────────────────────────────────────
function SunBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #fef3c7 0%, #fde68a 30%, #fed7aa 60%, #fecaca 100%)', opacity: 0.45 }} />
      <div className="absolute" style={{ top: '-80px', right: '10%', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, #fef08a 0%, #fde047 35%, #fb923c 65%, transparent 100%)', opacity: 0.35, animation: 'sunPulse 4s ease-in-out infinite' }} />
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="absolute" style={{ top: '20px', right: 'calc(10% + 110px)', width: '2px', height: '80px', background: 'linear-gradient(to bottom, #fde047, transparent)', transformOrigin: 'top center', transform: `rotate(${i * 30}deg) translateY(-130px)`, opacity: 0.4, animation: 'sunRays 8s linear infinite', animationDelay: `${i * 0.2}s` }} />
      ))}
      <div className="absolute bottom-0 left-0 right-0 h-64" style={{ background: 'linear-gradient(to top, rgba(251,146,60,0.08), transparent)' }} />
      <style>{`
        @keyframes sunPulse { 0%,100%{transform:scale(1);opacity:0.35} 50%{transform:scale(1.08);opacity:0.45} }
        @keyframes sunRays { 0%{opacity:0.2} 50%{opacity:0.5} 100%{opacity:0.2} }
      `}</style>
    </div>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────
export default function AnimatedBackground() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('xfit-theme') || 'midnight';
    return saved;
  });

  useEffect(() => {
    const getTheme = () => {
      const cls = document.documentElement.className;
      if (cls.includes('theme-sunrise')) return 'sunrise';
      return 'midnight';
    };
    setTheme(getTheme());
    const observer = new MutationObserver(() => setTheme(getTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (theme === 'sunrise') return <SunBackground />;
  return <StarField />;
}
