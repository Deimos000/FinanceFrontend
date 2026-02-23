import React, { useEffect, useRef } from 'react';

const isWeb = typeof window !== 'undefined';

interface Particle {
    angle: number;
    radius: number;
    speed: number;
    offsetX: number;
    offsetY: number;
    offsetZ: number;
    vx: number;
    vy: number;
    vz: number;
    baseRadius: number;
    alpha: number;
    targetAlpha: number;
    isAmbient: boolean;
    layerY: number;
    // Cached render positions
    finalX: number;
    finalY: number;
    finalZ: number;
    // Pre-computed color
    r: number;
    g: number;
    b: number;
}

interface ShootingStar {
    x: number;
    y: number;
    speed: number;
    angle: number;
    active: boolean;
    length: number;
    delay: number;
}

export default function ParticleBackgroundWeb() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const shootingStarsRef = useRef<ShootingStar[]>([]);

    // Config
    const NUM_PARTICLES = 4000;
    const PARTICLE_BASE_RADIUS = 0.8;
    const TILT_ANGLE = Math.PI / 2.5;
    const GALAXY_ARMS = 2;

    useEffect(() => {
        if (!isWeb || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Off-screen canvas for the static nebula glow layer
        const nebulaCanvas = document.createElement('canvas');
        const nebulaCtx = nebulaCanvas.getContext('2d');

        const buildNebulaLayer = (w: number, h: number) => {
            nebulaCanvas.width = w;
            nebulaCanvas.height = h;
            if (!nebulaCtx) return;

            nebulaCtx.clearRect(0, 0, w, h);
            nebulaCtx.globalCompositeOperation = 'source-over';

            const cx = w / 2;
            const cy = h / 2;
            const maxR = Math.max(w, h);

            // Deep space radial background
            const bg = nebulaCtx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.8);
            bg.addColorStop(0, 'rgba(20, 0, 50, 1)');
            bg.addColorStop(0.4, 'rgba(8, 0, 28, 1)');
            bg.addColorStop(1, 'rgba(0, 0, 0, 1)');
            nebulaCtx.fillStyle = bg;
            nebulaCtx.fillRect(0, 0, w, h);

            nebulaCtx.globalCompositeOperation = 'screen';

            // Large deep-purple arm nebula
            const arm1 = nebulaCtx.createRadialGradient(cx - w * 0.15, cy + h * 0.05, 0, cx - w * 0.1, cy, maxR * 0.55);
            arm1.addColorStop(0, 'rgba(120, 20, 220, 0.28)');
            arm1.addColorStop(0.35, 'rgba(80, 10, 160, 0.14)');
            arm1.addColorStop(1, 'rgba(0, 0, 0, 0)');
            nebulaCtx.fillStyle = arm1;
            nebulaCtx.fillRect(0, 0, w, h);

            // Opposing blue arm
            const arm2 = nebulaCtx.createRadialGradient(cx + w * 0.18, cy - h * 0.05, 0, cx + w * 0.12, cy, maxR * 0.5);
            arm2.addColorStop(0, 'rgba(40, 80, 255, 0.22)');
            arm2.addColorStop(0.35, 'rgba(20, 40, 180, 0.10)');
            arm2.addColorStop(1, 'rgba(0, 0, 0, 0)');
            nebulaCtx.fillStyle = arm2;
            nebulaCtx.fillRect(0, 0, w, h);

            // Magenta accent cloud
            const accent = nebulaCtx.createRadialGradient(cx + w * 0.05, cy - h * 0.12, 0, cx, cy - h * 0.1, maxR * 0.3);
            accent.addColorStop(0, 'rgba(255, 60, 180, 0.14)');
            accent.addColorStop(0.5, 'rgba(200, 30, 120, 0.06)');
            accent.addColorStop(1, 'rgba(0, 0, 0, 0)');
            nebulaCtx.fillStyle = accent;
            nebulaCtx.fillRect(0, 0, w, h);

            // Teal fringe wisp
            const teal = nebulaCtx.createRadialGradient(cx - w * 0.2, cy - h * 0.1, 0, cx - w * 0.15, cy - h * 0.05, maxR * 0.25);
            teal.addColorStop(0, 'rgba(0, 200, 220, 0.09)');
            teal.addColorStop(1, 'rgba(0, 0, 0, 0)');
            nebulaCtx.fillStyle = teal;
            nebulaCtx.fillRect(0, 0, w, h);

            nebulaCtx.globalCompositeOperation = 'source-over';
        };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            buildNebulaLayer(canvas.width, canvas.height);
            initParticles(canvas.width, canvas.height);
        };

        const createParticle = (width: number, height: number, index: number): Particle => {
            const isAmbient = Math.random() < 0.35;
            const radDist = isAmbient ? Math.random() : Math.pow(Math.random(), 3.5);
            const maxRadius = Math.max(width, height) * 0.45;
            const radius = isAmbient ? (radDist * maxRadius * 2.5) : (radDist * maxRadius);
            const spiralOffset = radius * 0.015;
            const armOffset = isAmbient
                ? Math.random() * Math.PI * 2
                : (Math.floor(Math.random() * GALAXY_ARMS) * (Math.PI * 2) / GALAXY_ARMS);
            const scatterBase = isAmbient ? Math.PI : 0.15;
            const scatter = (Math.random() - 0.5) * scatterBase * (1 + radius / (maxRadius * 0.4));
            const angle = armOffset + spiralOffset + scatter;
            const baseRotSpeed = 0.0008;
            const speedObj = isAmbient
                ? (0.0001 + Math.random() * 0.0003)
                : (baseRotSpeed + Math.max(0, (maxRadius - radius) / maxRadius) * 0.0004);
            const speed = speedObj * (Math.random() < 0.05 && isAmbient ? -1 : 1);
            const maxLayerY = isAmbient ? 800 : (100 * Math.max(0, 1 - Math.pow(radius / maxRadius, 0.5)));
            const layerY = (Math.random() - 0.5) * maxLayerY;

            // Pre-compute vivid color for each particle
            let r = 255, g = 255, b = 255;
            const maxR = Math.max(width, height) * 0.7;
            const centerBlend = Math.max(0, 1 - radius / (maxR * 0.35));

            if (!isAmbient) {
                const baseR = PARTICLE_BASE_RADIUS + (Math.random() > 0.95 ? Math.random() * 3.5 : Math.random() * 1.5);
                if (baseR > 2.5 && radius > maxR * 0.1) {
                    // Bright magenta clusters — very vivid
                    r = 255; g = 60; b = 140;
                } else if (radius > maxR * 0.5 && index % 3 === 0) {
                    // Electric blue outer arms
                    r = 40; g = 100; b = 255;
                } else {
                    // Interpolate from deep violet (outer) to white-magenta (core)
                    const endR = 160, endG = 10, endB = 240;
                    const coreR = 255, coreG = 200, coreB = 255;
                    r = Math.floor(endR + (coreR - endR) * centerBlend);
                    g = Math.floor(endG + (coreG - endG) * centerBlend);
                    b = Math.floor(endB + (coreB - endB) * centerBlend);
                }
            } else {
                if (index % 5 === 0) {
                    r = 0; g = 150; b = 255; // Cyan ambient
                } else if (index % 5 === 1) {
                    r = 180; g = 0; b = 255; // Vivid purple
                } else if (index % 5 === 2) {
                    r = 255; g = 30; b = 160; // Hot pink
                } else {
                    r = 80; g = 20; b = 200; // Indigo
                }
            }

            const bR = PARTICLE_BASE_RADIUS + (Math.random() > 0.95 ? Math.random() * 3.5 : Math.random() * 1.5);

            return {
                angle,
                radius,
                speed,
                offsetX: 0, offsetY: 0, offsetZ: 0,
                vx: 0, vy: 0, vz: 0,
                baseRadius: bR,
                alpha: 0,
                targetAlpha: isAmbient ? (0.35 + Math.random() * 0.5) : (0.55 + Math.random() * 0.45),
                isAmbient,
                layerY,
                finalX: 0, finalY: 0, finalZ: 0,
                r, g, b,
            };
        };

        const initParticles = (width: number, height: number) => {
            particlesRef.current = [];
            for (let i = 0; i < NUM_PARTICLES; i++) {
                particlesRef.current.push(createParticle(width, height, i));
            }
            shootingStarsRef.current = [];
            for (let i = 0; i < 5; i++) {
                shootingStarsRef.current.push(createShootingStar(width, height));
            }
        };

        const createShootingStar = (w: number, h: number): ShootingStar => ({
            x: w + Math.random() * w,
            y: -Math.random() * h,
            speed: 15 + Math.random() * 20,
            angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
            active: false,
            length: 80 + Math.random() * 100,
            delay: Math.random() * 500,
        });

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const render = () => {
            if (!ctx) return;
            const w = canvas.width;
            const h = canvas.height;
            const centerX = w / 2;
            const centerY = h / 2;

            // Draw the pre-rendered nebula background
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            ctx.drawImage(nebulaCanvas, 0, 0);

            const cosT = Math.cos(TILT_ANGLE);
            const sinT = Math.sin(TILT_ANGLE);

            // Physics update
            for (let i = 0; i < particlesRef.current.length; i++) {
                const p = particlesRef.current[i];
                p.angle -= p.speed;

                const bx = Math.cos(p.angle) * p.radius;
                const bz = Math.sin(p.angle) * p.radius;
                const by = p.layerY;
                const ry = by * cosT - bz * sinT;
                const rz = by * sinT + bz * cosT;

                p.vx -= p.offsetX * 0.0001;
                p.vy -= p.offsetY * 0.0001;
                p.vz -= p.offsetZ * 0.0001;
                p.vx *= 0.95; p.vy *= 0.95; p.vz *= 0.95;
                p.offsetX += p.vx; p.offsetY += p.vy; p.offsetZ += p.vz;

                p.finalX = centerX + bx + p.offsetX;
                p.finalY = centerY + ry + p.offsetY;
                p.finalZ = rz + p.offsetZ;

                // Fast fade in
                if (p.alpha < p.targetAlpha) {
                    p.alpha = Math.min(p.targetAlpha, p.alpha + 0.015);
                }
            }

            // Depth sort
            particlesRef.current.sort((a, b) => b.finalZ - a.finalZ);

            // ── Render particles with screen blending ──
            ctx.globalCompositeOperation = 'screen';

            for (let i = 0; i < particlesRef.current.length; i++) {
                const p = particlesRef.current[i];
                const perspective = 800 / (800 + p.finalZ);
                const screenX = centerX + (p.finalX - centerX) * perspective;
                const screenY = centerY + (p.finalY - centerY) * perspective;
                const screenRadius = Math.max(0.3, p.baseRadius * perspective);

                if (p.finalZ <= -700 || screenRadius < 0.1) continue;

                const a = Math.max(0, p.alpha);

                // Use a tiny radial gradient only for the larger/important particles
                if (p.baseRadius > 1.8) {
                    const gr = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, screenRadius * 2.5);
                    gr.addColorStop(0, `rgba(255, 255, 255, ${a})`);
                    gr.addColorStop(0.3, `rgba(${p.r}, ${p.g}, ${p.b}, ${a * 0.9})`);
                    gr.addColorStop(1, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, screenRadius * 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = gr;
                    ctx.fill();
                } else {
                    // Simple solid circle for small particles — very fast, bright
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${a})`;
                    ctx.fill();
                }
            }

            // ── Galaxy core bloom ──
            ctx.globalCompositeOperation = 'screen';
            const coreGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(w, h) * 0.18);
            coreGlow.addColorStop(0, 'rgba(255, 230, 255, 0.55)');
            coreGlow.addColorStop(0.15, 'rgba(220, 100, 255, 0.30)');
            coreGlow.addColorStop(0.45, 'rgba(140, 20, 220, 0.12)');
            coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = coreGlow;
            ctx.fillRect(0, 0, w, h);

            // ── Shooting stars ──
            ctx.globalCompositeOperation = 'screen';
            for (let i = 0; i < shootingStarsRef.current.length; i++) {
                const star = shootingStarsRef.current[i];
                if (!star.active) {
                    if (star.delay > 0) {
                        star.delay--;
                    } else {
                        star.active = true;
                        star.x = w + Math.random() * w * 0.5;
                        star.y = -Math.random() * h * 0.5;
                        star.delay = 200 + Math.random() * 800;
                    }
                } else {
                    star.x -= Math.cos(star.angle) * star.speed;
                    star.y += Math.sin(star.angle) * star.speed;

                    ctx.beginPath();
                    ctx.moveTo(star.x, star.y);
                    ctx.lineTo(
                        star.x + Math.cos(star.angle) * star.length,
                        star.y - Math.sin(star.angle) * star.length
                    );
                    const starGrad = ctx.createLinearGradient(
                        star.x, star.y,
                        star.x + Math.cos(star.angle) * star.length,
                        star.y - Math.sin(star.angle) * star.length
                    );
                    starGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
                    starGrad.addColorStop(0.08, 'rgba(200, 180, 255, 0.5)');
                    starGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    ctx.strokeStyle = starGrad;
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    if (star.x < -star.length || star.y > h + star.length) {
                        star.active = false;
                    }
                }
            }

            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            animationFrameId.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, []);

    if (!isWeb) return null;

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
            }}
        />
    );
}
