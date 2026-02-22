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
    const TILT_ANGLE = Math.PI / 2.5; // ~72 degrees tilt
    const GALAXY_ARMS = 2; // Classic 2-arm spiral

    useEffect(() => {
        if (!isWeb || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles(canvas.width, canvas.height);
        };

        const createParticle = (width: number, height: number, forceAmbient = false): Particle => {
            const isAmbient = forceAmbient || Math.random() < 0.35;

            // Tighter core, most particles in the center 40%
            const radDist = isAmbient ? Math.random() : Math.pow(Math.random(), 3.5);
            // Reduce maximum radius for the spiral arms to keep it tighter
            const maxRadius = Math.max(width, height) * 0.45;

            const radius = isAmbient ? (radDist * maxRadius * 2.5) : (radDist * maxRadius);

            // Much tighter spiral, more winding
            const spiralOffset = radius * 0.015;
            const armOffset = isAmbient ? Math.random() * Math.PI * 2 : (Math.floor(Math.random() * GALAXY_ARMS) * (Math.PI * 2) / GALAXY_ARMS);

            // Very tight lines for the arms, expanding only slightly outward
            const scatterBase = isAmbient ? Math.PI : 0.15;
            const scatter = (Math.random() - 0.5) * scatterBase * (1 + radius / (maxRadius * 0.4));

            const angle = armOffset + spiralOffset + scatter;

            // More uniform rotation so the galaxy doesn't wind up too quickly into a blur
            const baseRotSpeed = 0.0008;
            const speedObj = isAmbient
                ? (0.0001 + Math.random() * 0.0003)
                : (baseRotSpeed + Math.max(0, (maxRadius - radius) / maxRadius) * 0.0004);
            const speed = speedObj * (Math.random() < 0.05 && isAmbient ? -1 : 1);

            // Thickness of the disk
            const maxLayerY = isAmbient ? 800 : (100 * Math.max(0, 1 - Math.pow(radius / maxRadius, 0.5)));
            const layerY = (Math.random() - 0.5) * maxLayerY;

            return {
                angle,
                radius,
                speed,
                offsetX: 0,
                offsetY: 0,
                offsetZ: 0,
                vx: 0,
                vy: 0,
                vz: 0,
                baseRadius: PARTICLE_BASE_RADIUS + (Math.random() > 0.95 ? Math.random() * 3.5 : Math.random() * 1.5),
                alpha: 0,
                targetAlpha: isAmbient ? (0.1 + Math.random() * 0.3) : (0.2 + Math.random() * 0.8),
                isAmbient,
                layerY,
                finalX: 0,
                finalY: 0,
                finalZ: 0
            };
        };

        const initParticles = (width: number, height: number) => {
            particlesRef.current = [];
            for (let i = 0; i < NUM_PARTICLES; i++) {
                particlesRef.current.push(createParticle(width, height));
            }

            shootingStarsRef.current = [];
            for (let i = 0; i < 5; i++) {
                shootingStarsRef.current.push(createShootingStar(width, height));
            }
        };

        const createShootingStar = (w: number, h: number): ShootingStar => {
            return {
                x: w + Math.random() * w,
                y: -Math.random() * h,
                speed: 15 + Math.random() * 20,
                angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2, // roughly 45 degrees down-left
                active: false,
                length: 80 + Math.random() * 100,
                delay: Math.random() * 500 // frames to wait before launching
            };
        };

        let shockwave = { active: false, x: 0, y: 0, time: 0, push: true };

        const handlePointerDown = (e: PointerEvent) => {
            shockwave = {
                active: true,
                x: e.clientX,
                y: e.clientY,
                time: 0,
                push: Math.random() > 0.5
            };
        };

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('pointerdown', handlePointerDown);
        resizeCanvas();

        const render = () => {
            if (!ctx) return;
            const w = canvas.width;
            const h = canvas.height;
            const centerX = w / 2;
            const centerY = h / 2;

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, w, h);

            const cosT = Math.cos(TILT_ANGLE);
            const sinT = Math.sin(TILT_ANGLE);

            // First pass: update physics and compute 3D positions
            for (let i = 0; i < particlesRef.current.length; i++) {
                const p = particlesRef.current[i];

                p.angle -= p.speed; // Rotation

                // Flat disk coords
                const bx = Math.cos(p.angle) * p.radius;
                const bz = Math.sin(p.angle) * p.radius;
                const by = p.layerY;

                // 3D Tilt around X axis
                const ry = by * cosT - bz * sinT;
                const rz = by * sinT + bz * cosT;

                if (shockwave.active) {
                    const scale = 800 / (800 + (rz + p.offsetZ));
                    const sxScreen = centerX + (bx + p.offsetX) * scale;
                    const syScreen = centerY + ry + p.offsetY;

                    const sx = sxScreen - shockwave.x;
                    const sy = syScreen - shockwave.y;
                    const sDist = Math.max(Math.sqrt(sx * sx + sy * sy), 1);

                    const maxDist = 600;
                    if (sDist < maxDist) {
                        const force = (maxDist - sDist) / maxDist; // Linear falloff
                        const impact = (p.isAmbient ? 2 : 5) * force; // Much smaller impulse
                        const dirMult = shockwave.push ? 1 : -1;

                        p.vx += (sx / sDist) * impact * dirMult;
                        p.vy += (sy / sDist) * impact * dirMult;
                        p.vz += ((Math.random() - 0.5) * 2) * impact * dirMult;
                    }
                }

                // Spring back to orbit very slowly (over minutes)
                p.vx -= p.offsetX * 0.0001;
                p.vy -= p.offsetY * 0.0001;
                p.vz -= p.offsetZ * 0.0001;

                // Friction
                p.vx *= 0.95;
                p.vy *= 0.95;
                p.vz *= 0.95;

                p.offsetX += p.vx;
                p.offsetY += p.vy;
                p.offsetZ += p.vz;

                p.finalX = centerX + bx + p.offsetX;
                p.finalY = centerY + ry + p.offsetY;
                p.finalZ = rz + p.offsetZ;

                if (p.alpha < p.targetAlpha) {
                    p.alpha += 0.01;
                }
            }

            if (shockwave.active) {
                shockwave.active = false;
            }

            // Depth sorting for correct additive blending
            particlesRef.current.sort((a, b) => b.finalZ - a.finalZ);

            ctx.globalCompositeOperation = 'screen';

            // Second pass: render
            for (let i = 0; i < particlesRef.current.length; i++) {
                const p = particlesRef.current[i];

                const perspective = 800 / (800 + p.finalZ);
                const screenX = centerX + (p.finalX - centerX) * perspective;
                const screenY = centerY + (p.finalY - centerY) * perspective;
                const screenRadius = Math.max(0.1, p.baseRadius * perspective);

                if (screenRadius > 0.1 && p.finalZ > -700) {
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);

                    const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, screenRadius);

                    // Core brightness is higher for galaxy center, and drops off
                    let colorA = 255;
                    let colorB = 255;
                    let colorC = 255;

                    if (!p.isAmbient) {
                        const maxRadius = Math.max(w, h) * 0.7;
                        const centerBlend = Math.max(0, 1 - p.radius / (maxRadius * 0.35));

                        const endR = 150; const endG = 20; const endB = 220; // Deep purple
                        const coreR = 255; const coreG = 210; const coreB = 255; // White/magenta core

                        if (p.baseRadius > 2.5 && p.radius > maxRadius * 0.1) {
                            colorA = 255; colorB = 50; colorC = 120; // Magenta cluster
                        } else if (p.radius > maxRadius * 0.5 && i % 3 === 0) {
                            colorA = 30; colorB = 80; colorC = 255; // Deep blue fringes
                        } else {
                            colorA = Math.floor(endR + (coreR - endR) * centerBlend);
                            colorB = Math.floor(endG + (coreG - endG) * centerBlend);
                            colorC = Math.floor(endB + (coreB - endB) * centerBlend);
                        }
                    } else {
                        if (i % 4 === 0) {
                            colorA = 30; colorB = 60; colorC = 200; // Ambient blue
                        } else {
                            colorA = 120; colorB = 30; colorC = 210; // Ambient purple
                        }
                    }

                    gradient.addColorStop(0, `rgba(255, 255, 255, ${Math.max(0, p.alpha)})`);
                    gradient.addColorStop(0.2, `rgba(${colorA}, ${colorB}, ${colorC}, ${Math.max(0, p.alpha * 0.8)})`);
                    gradient.addColorStop(1, `rgba(${colorA}, ${colorB}, ${colorC}, 0)`);

                    ctx.fillStyle = gradient;
                    ctx.fill();
                }
            }

            // Third pass: shooting stars
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
                        star.delay = 200 + Math.random() * 800; // Reset delay for next time
                    }
                } else {
                    star.x -= Math.cos(star.angle) * star.speed;
                    star.y += Math.sin(star.angle) * star.speed;

                    // Draw shooting star line (tail)
                    ctx.beginPath();
                    ctx.moveTo(star.x, star.y);
                    ctx.lineTo(star.x + Math.cos(star.angle) * star.length, star.y - Math.sin(star.angle) * star.length);

                    const starGrad = ctx.createLinearGradient(
                        star.x, star.y,
                        star.x + Math.cos(star.angle) * star.length, star.y - Math.sin(star.angle) * star.length
                    );
                    starGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                    starGrad.addColorStop(0.1, 'rgba(200, 200, 255, 0.4)');
                    starGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

                    ctx.strokeStyle = starGrad;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    // Check bounds to respawn
                    if (star.x < -star.length || star.y > h + star.length) {
                        star.active = false;
                    }
                }
            }

            ctx.globalCompositeOperation = 'source-over';
            animationFrameId.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('pointerdown', handlePointerDown);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []);

    if (!isWeb) return null;

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: '#000000',
                zIndex: 0
            }}
        />
    );
}
