import { useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

const isWeb = typeof window !== 'undefined';

// ─── Shared canvas instance mounted on document.body ───────────────────────
// We mount the canvas directly on document.body so it is always at the root
// stacking context and cannot be obscured by React Native Web's View hierarchy.
let bodyCanvas: HTMLCanvasElement | null = null;
let bodyCtx: CanvasRenderingContext2D | null = null;
let currentAnimId: number | null = null;

function stopAnimation() {
    if (currentAnimId !== null) {
        cancelAnimationFrame(currentAnimId);
        currentAnimId = null;
    }
}

function destroyCanvas() {
    stopAnimation();
    if (bodyCanvas && bodyCanvas.parentNode) {
        bodyCanvas.parentNode.removeChild(bodyCanvas);
    }
    bodyCanvas = null;
    bodyCtx = null;
    document.body.style.backgroundColor = '';
}

function ensureCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
    if (!bodyCanvas) {
        bodyCanvas = document.createElement('canvas');
        bodyCanvas.style.cssText = [
            'position:fixed',
            'top:0',
            'left:0',
            'width:100%',
            'height:100%',
            'z-index:-1',
            'pointer-events:none',
        ].join(';');
        document.body.appendChild(bodyCanvas);
    }
    // Ensure body background is black for universe/canvas backgrounds
    document.body.style.backgroundColor = '#000000';
    if (!bodyCtx) {
        bodyCtx = bodyCanvas.getContext('2d');
    }
    if (!bodyCtx) return null;
    return { canvas: bodyCanvas, ctx: bodyCtx };
}

// ─── Type definitions ──────────────────────────────────────────────────────
interface Particle {
    angle: number; radius: number; speed: number;
    offsetX: number; offsetY: number; offsetZ: number;
    vx: number; vy: number; vz: number;
    baseRadius: number; alpha: number; targetAlpha: number;
    isAmbient: boolean; layerY: number;
    finalX: number; finalY: number; finalZ: number;
    r: number; g: number; b: number;
}
interface ShootingStar {
    x: number; y: number; speed: number; angle: number;
    active: boolean; length: number; delay: number;
}

// ─── Galaxy renderer ───────────────────────────────────────────────────────
function startUniverse() {
    const result = ensureCanvas();
    if (!result) return;
    const { canvas, ctx } = result;

    const NUM = 1200; // Reduced from 4000 for performance
    const TILT = Math.PI / 2.5;
    const ARMS = 2;

    const nebulaCanvas = document.createElement('canvas');
    const nebulaCtx = nebulaCanvas.getContext('2d');

    const buildNebula = (w: number, h: number) => {
        if (!nebulaCtx) return;
        nebulaCanvas.width = w; nebulaCanvas.height = h;
        nebulaCtx.clearRect(0, 0, w, h);
        const cx = w / 2, cy = h / 2, maxR = Math.max(w, h);
        const bg = nebulaCtx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.8);
        bg.addColorStop(0, 'rgba(20,0,50,1)'); bg.addColorStop(0.4, 'rgba(8,0,28,1)'); bg.addColorStop(1, 'rgba(0,0,0,1)');
        nebulaCtx.fillStyle = bg; nebulaCtx.fillRect(0, 0, w, h);
        nebulaCtx.globalCompositeOperation = 'screen';
        const arm1 = nebulaCtx.createRadialGradient(cx - w * 0.15, cy + h * 0.05, 0, cx - w * 0.1, cy, maxR * 0.55);
        arm1.addColorStop(0, 'rgba(120,20,220,0.28)'); arm1.addColorStop(0.35, 'rgba(80,10,160,0.14)'); arm1.addColorStop(1, 'rgba(0,0,0,0)');
        nebulaCtx.fillStyle = arm1; nebulaCtx.fillRect(0, 0, w, h);
        const arm2 = nebulaCtx.createRadialGradient(cx + w * 0.18, cy - h * 0.05, 0, cx + w * 0.12, cy, maxR * 0.5);
        arm2.addColorStop(0, 'rgba(40,80,255,0.22)'); arm2.addColorStop(0.35, 'rgba(20,40,180,0.10)'); arm2.addColorStop(1, 'rgba(0,0,0,0)');
        nebulaCtx.fillStyle = arm2; nebulaCtx.fillRect(0, 0, w, h);
        const accent = nebulaCtx.createRadialGradient(cx + w * 0.05, cy - h * 0.12, 0, cx, cy - h * 0.1, maxR * 0.3);
        accent.addColorStop(0, 'rgba(255,60,180,0.14)'); accent.addColorStop(0.5, 'rgba(200,30,120,0.06)'); accent.addColorStop(1, 'rgba(0,0,0,0)');
        nebulaCtx.fillStyle = accent; nebulaCtx.fillRect(0, 0, w, h);
        nebulaCtx.globalCompositeOperation = 'source-over';
    };

    const makeParticle = (w: number, h: number, idx: number): Particle => {
        const isAmbient = Math.random() < 0.35;
        const radDist = isAmbient ? Math.random() : Math.pow(Math.random(), 3.5);
        const maxRad = Math.max(w, h) * 0.45;
        const radius = isAmbient ? radDist * maxRad * 2.5 : radDist * maxRad;
        const spiralOffset = radius * 0.015;
        const armOffset = isAmbient ? Math.random() * Math.PI * 2 : Math.floor(Math.random() * ARMS) * (Math.PI * 2 / ARMS);
        const scatterBase = isAmbient ? Math.PI : 0.15;
        const scatter = (Math.random() - 0.5) * scatterBase * (1 + radius / (maxRad * 0.4));
        const angle = armOffset + spiralOffset + scatter;
        const baseRotSpeed = 0.0008;
        const speed = (isAmbient ? 0.0001 + Math.random() * 0.0003 : baseRotSpeed + Math.max(0, (maxRad - radius) / maxRad) * 0.0004)
            * (Math.random() < 0.05 && isAmbient ? -1 : 1);
        const maxLayerY = isAmbient ? 800 : 100 * Math.max(0, 1 - Math.pow(radius / maxRad, 0.5));
        const layerY = (Math.random() - 0.5) * maxLayerY;
        const baseR = 0.8 + (Math.random() > 0.95 ? Math.random() * 3.5 : Math.random() * 1.5);
        const maxRFull = Math.max(w, h) * 0.7;
        const blend = Math.max(0, 1 - radius / (maxRFull * 0.35));
        let r = 255, g = 255, b = 255;
        if (!isAmbient) {
            if (baseR > 2.5 && radius > maxRFull * 0.1) { r = 255; g = 60; b = 140; }
            else if (radius > maxRFull * 0.5 && idx % 3 === 0) { r = 40; g = 100; b = 255; }
            else { r = Math.floor(160 + 95 * blend); g = Math.floor(10 + 190 * blend); b = Math.floor(240 + 15 * blend); }
        } else {
            if (idx % 5 === 0) { r = 0; g = 150; b = 255; }
            else if (idx % 5 === 1) { r = 180; g = 0; b = 255; }
            else if (idx % 5 === 2) { r = 255; g = 30; b = 160; }
            else { r = 80; g = 20; b = 200; }
        }
        return { angle, radius, speed, offsetX: 0, offsetY: 0, offsetZ: 0, vx: 0, vy: 0, vz: 0, baseRadius: baseR, alpha: 0, targetAlpha: isAmbient ? 0.35 + Math.random() * 0.5 : 0.55 + Math.random() * 0.45, isAmbient, layerY, finalX: 0, finalY: 0, finalZ: 0, r, g, b };
    };

    let particles: Particle[] = [];
    let stars: ShootingStar[] = [];

    const init = (w: number, h: number) => {
        buildNebula(w, h);
        particles = Array.from({ length: NUM }, (_, i) => makeParticle(w, h, i));
        stars = Array.from({ length: 5 }, () => ({ x: w + Math.random() * w, y: -Math.random() * h, speed: 15 + Math.random() * 20, angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2, active: false, length: 80 + Math.random() * 100, delay: Math.random() * 500 }));
    };

    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init(canvas.width, canvas.height);
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
        const w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2;
        const cosT = Math.cos(TILT), sinT = Math.sin(TILT);

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.drawImage(nebulaCanvas, 0, 0);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.angle -= p.speed;
            const bx = Math.cos(p.angle) * p.radius;
            const bz = Math.sin(p.angle) * p.radius;
            const ry = p.layerY * cosT - bz * sinT;
            const rz = p.layerY * sinT + bz * cosT;
            p.vx -= p.offsetX * 0.0001; p.vy -= p.offsetY * 0.0001; p.vz -= p.offsetZ * 0.0001;
            p.vx *= 0.95; p.vy *= 0.95; p.vz *= 0.95;
            p.offsetX += p.vx; p.offsetY += p.vy; p.offsetZ += p.vz;
            p.finalX = cx + bx + p.offsetX;
            p.finalY = cy + ry + p.offsetY;
            p.finalZ = rz + p.offsetZ;
            if (p.alpha < p.targetAlpha) p.alpha = Math.min(p.targetAlpha, p.alpha + 0.015);
        }

        // Sorting removed for performance - visuals are fine without it in 2D
        // particles.sort((a, b) => b.finalZ - a.finalZ);
        ctx.globalCompositeOperation = 'screen';

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            if (p.finalZ <= -700) continue;
            const persp = 800 / (800 + p.finalZ);
            const sx = cx + (p.finalX - cx) * persp;
            const sy = cy + (p.finalY - cy) * persp;
            const sr = Math.max(0.3, p.baseRadius * persp);
            if (sr < 0.1) continue;
            const a = Math.max(0, p.alpha);
            if (p.baseRadius > 1.8) {
                const gr = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 2.5);
                gr.addColorStop(0, `rgba(255,255,255,${a})`);
                gr.addColorStop(0.3, `rgba(${p.r},${p.g},${p.b},${a * 0.9})`);
                gr.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
                ctx.beginPath(); ctx.arc(sx, sy, sr * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = gr; ctx.fill();
            } else {
                // Optimisation: use fillRect for very small particles
                ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
                if (sr < 0.8) {
                    ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
                } else {
                    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Core bloom
        const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.18);
        bloom.addColorStop(0, 'rgba(255,230,255,0.55)'); bloom.addColorStop(0.15, 'rgba(220,100,255,0.30)');
        bloom.addColorStop(0.45, 'rgba(140,20,220,0.12)'); bloom.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bloom; ctx.fillRect(0, 0, w, h);

        // Shooting stars
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];
            if (!s.active) { if (s.delay > 0) { s.delay--; } else { s.active = true; s.x = w + Math.random() * w * 0.5; s.y = -Math.random() * h * 0.5; s.delay = 200 + Math.random() * 800; } }
            else {
                s.x -= Math.cos(s.angle) * s.speed; s.y += Math.sin(s.angle) * s.speed;
                ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + Math.cos(s.angle) * s.length, s.y - Math.sin(s.angle) * s.length);
                const sg = ctx.createLinearGradient(s.x, s.y, s.x + Math.cos(s.angle) * s.length, s.y - Math.sin(s.angle) * s.length);
                sg.addColorStop(0, 'rgba(255,255,255,0.95)'); sg.addColorStop(0.08, 'rgba(200,180,255,0.5)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.strokeStyle = sg; ctx.lineWidth = 2; ctx.stroke();
                if (s.x < -s.length || s.y > h + s.length) s.active = false;
            }
        }

        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        currentAnimId = requestAnimationFrame(render);
    };
    render();

    return () => {
        stopAnimation();
        window.removeEventListener('resize', resize);
    };
}

// ─── Aurora renderer ─────────────────────────────────────────────────────
function startAurora(primaryColor: string, secondaryColor: string, darkBackground: string) {
    const result = ensureCanvas();
    if (!result) return;
    const { canvas, ctx } = result;

    interface Circle { x: number; y: number; r: number; color: string; opacity: number; phase: number; }
    let circles: Circle[] = [];

    const initCircles = (w: number, h: number) => {
        circles = [
            { x: w * 0.2, y: h * 0.3, r: w * 0.6, color: primaryColor, opacity: 0.15, phase: 0 },
            { x: w * 0.8, y: h * 0.7, r: w * 0.7, color: secondaryColor, opacity: 0.12, phase: Math.PI / 3 },
            { x: w * 0.5, y: h * 0.5, r: w * 0.5, color: '#3b82f6', opacity: 0.08, phase: Math.PI / 2 },
        ];
    };

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initCircles(canvas.width, canvas.height); };
    window.addEventListener('resize', resize);
    resize();

    const render = () => {
        const w = canvas.width, h = canvas.height;
        ctx.fillStyle = darkBackground; ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'screen'; ctx.filter = 'blur(100px)';
        circles.forEach(c => {
            c.phase += 0.005;
            const ox = Math.sin(c.phase) * 50, oy = Math.cos(c.phase) * 50;
            const grad = ctx.createRadialGradient(c.x + ox, c.y + oy, 0, c.x + ox, c.y + oy, c.r);
            grad.addColorStop(0, c.color); grad.addColorStop(1, 'transparent');
            ctx.globalAlpha = c.opacity; ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(c.x + ox, c.y + oy, c.r, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
        currentAnimId = requestAnimationFrame(render);
    };
    render();

    return () => { stopAnimation(); window.removeEventListener('resize', resize); };
}

// ─── Component ────────────────────────────────────────────────────────────
export default function DynamicBackgroundWeb() {
    const { theme, backgroundStyle, colorScheme } = useTheme();
    const isDark = theme === 'dark';
    const isUniverse = backgroundStyle === 'universe';
    const isAurora = backgroundStyle === 'aurora';

    useEffect(() => {
        if (!isWeb || !isDark) {
            destroyCanvas();
            return;
        }

        stopAnimation(); // Stop any existing animation before starting a new one

        if (isUniverse) {
            const cleanup = startUniverse();
            return () => { cleanup?.(); destroyCanvas(); };
        }

        if (isAurora) {
            const primaryColor = colorScheme.primary;
            const secondaryColor = colorScheme.id === 'persian-indigo' ? '#7F5AF0' : colorScheme.primaryLight;
            const cleanup = startAurora(primaryColor, secondaryColor, colorScheme.darkBackground);
            return () => { cleanup?.(); destroyCanvas(); };
        }

        // Plain background styles — no canvas needed
        destroyCanvas();
    }, [isDark, backgroundStyle, colorScheme]);

    // This component renders nothing into the React tree — the canvas lives on document.body
    return null;
}
