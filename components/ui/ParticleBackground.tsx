import React, { useMemo, useEffect } from 'react';
import { Dimensions } from 'react-native';
import {
    Canvas,
    Circle,
    Group,
    Line,
    vec,
    LinearGradient
} from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, useDerivedValue, runOnJS, useFrameCallback } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const NUM_PARTICLES = 4000;
const NUM_SHOOTING_STARS = 5;
const GALAXY_ARMS = 2;
const TILT_ANGLE = Math.PI / 2.5;

export default function ParticleBackground() {
    const pAngle = useSharedValue(new Float32Array(NUM_PARTICLES));
    const pRadius = useSharedValue(new Float32Array(NUM_PARTICLES));
    const pSpeed = useSharedValue(new Float32Array(NUM_PARTICLES));
    const pOffsetX = useSharedValue(new Float32Array(NUM_PARTICLES));
    const pOffsetY = useSharedValue(new Float32Array(NUM_PARTICLES));
    const pOffsetZ = useSharedValue(new Float32Array(NUM_PARTICLES));
    const pVX = useSharedValue(new Float32Array(NUM_PARTICLES));
    const pVY = useSharedValue(new Float32Array(NUM_PARTICLES));
    const pVZ = useSharedValue(new Float32Array(NUM_PARTICLES));
    const pLayerY = useSharedValue(new Float32Array(NUM_PARTICLES));
    const pBaseRadius = useSharedValue(new Float32Array(NUM_PARTICLES));
    const pAlpha = useSharedValue(new Float32Array(NUM_PARTICLES));
    const pTargetAlpha = useSharedValue(new Float32Array(NUM_PARTICLES));
    const pIsAmbient = useSharedValue(new Int8Array(NUM_PARTICLES));

    // Final render calculations
    const pFinalX = useSharedValue(new Float32Array(NUM_PARTICLES));
    const pFinalY = useSharedValue(new Float32Array(NUM_PARTICLES));
    const pFinalZ = useSharedValue(new Float32Array(NUM_PARTICLES));

    // Shooting stars
    const ssX = useSharedValue(new Float32Array(NUM_SHOOTING_STARS));
    const ssY = useSharedValue(new Float32Array(NUM_SHOOTING_STARS));
    const ssSpeed = useSharedValue(new Float32Array(NUM_SHOOTING_STARS));
    const ssAngle = useSharedValue(new Float32Array(NUM_SHOOTING_STARS));
    const ssLength = useSharedValue(new Float32Array(NUM_SHOOTING_STARS));
    const ssDelay = useSharedValue(new Float32Array(NUM_SHOOTING_STARS));
    const ssActive = useSharedValue(new Int8Array(NUM_SHOOTING_STARS));

    const shockwaveActive = useSharedValue(0);
    const shockwaveX = useSharedValue(0);
    const shockwaveY = useSharedValue(0);
    const shockwaveTime = useSharedValue(0);
    const shockwavePush = useSharedValue(1);

    useEffect(() => {
        const initAngle = new Float32Array(NUM_PARTICLES);
        const initRadius = new Float32Array(NUM_PARTICLES);
        const initSpeed = new Float32Array(NUM_PARTICLES);
        const initOffsetX = new Float32Array(NUM_PARTICLES);
        const initOffsetY = new Float32Array(NUM_PARTICLES);
        const initOffsetZ = new Float32Array(NUM_PARTICLES);
        const initVX = new Float32Array(NUM_PARTICLES);
        const initVY = new Float32Array(NUM_PARTICLES);
        const initVZ = new Float32Array(NUM_PARTICLES);
        const initLayerY = new Float32Array(NUM_PARTICLES);
        const initBaseRadius = new Float32Array(NUM_PARTICLES);
        const initAlpha = new Float32Array(NUM_PARTICLES);
        const initTargetAlpha = new Float32Array(NUM_PARTICLES);
        const initIsAmbient = new Int8Array(NUM_PARTICLES);

        const initFinalX = new Float32Array(NUM_PARTICLES);
        const initFinalY = new Float32Array(NUM_PARTICLES);
        const initFinalZ = new Float32Array(NUM_PARTICLES);

        const initSSX = new Float32Array(NUM_SHOOTING_STARS);
        const initSSY = new Float32Array(NUM_SHOOTING_STARS);
        const initSSSpeed = new Float32Array(NUM_SHOOTING_STARS);
        const initSSAngle = new Float32Array(NUM_SHOOTING_STARS);
        const initSSLength = new Float32Array(NUM_SHOOTING_STARS);
        const initSSDelay = new Float32Array(NUM_SHOOTING_STARS);
        const initSSActive = new Int8Array(NUM_SHOOTING_STARS);

        const w = SCREEN_WIDTH;
        const h = SCREEN_HEIGHT;
        const PARTICLE_BASE_RADIUS = 0.8;

        for (let i = 0; i < NUM_PARTICLES; i++) {
            const isAmbient = Math.random() < 0.35;
            initIsAmbient[i] = isAmbient ? 1 : 0;

            // Tighter core
            const radDist = isAmbient ? Math.random() : Math.pow(Math.random(), 3.5);
            // Reduce maximum radius for the spiral arms to keep it tighter
            const maxRadius = Math.max(w, h) * 0.45;

            const radius = isAmbient ? (radDist * maxRadius * 2.5) : (radDist * maxRadius);

            // Much tighter spiral, more winding
            const spiralOffset = radius * 0.015;
            const armOffset = isAmbient ? Math.random() * Math.PI * 2 : (Math.floor(Math.random() * GALAXY_ARMS) * (Math.PI * 2) / GALAXY_ARMS);

            // Very tight lines for the arms
            const scatterBase = isAmbient ? Math.PI : 0.15;
            const scatter = (Math.random() - 0.5) * scatterBase * (1 + radius / (maxRadius * 0.4));

            initAngle[i] = armOffset + spiralOffset + scatter;
            initRadius[i] = radius;

            const baseRotSpeed = 0.0008;
            const speedObj = isAmbient
                ? (0.0001 + Math.random() * 0.0003)
                : (baseRotSpeed + Math.max(0, (maxRadius - radius) / maxRadius) * 0.0004);
            initSpeed[i] = speedObj * (Math.random() < 0.05 && isAmbient ? -1 : 1);

            const maxLayerY = isAmbient ? 800 : (100 * Math.max(0, 1 - Math.pow(radius / maxRadius, 0.5)));
            initLayerY[i] = (Math.random() - 0.5) * maxLayerY;

            initBaseRadius[i] = PARTICLE_BASE_RADIUS + (Math.random() > 0.95 ? Math.random() * 3.5 : Math.random() * 1.5);
            initAlpha[i] = 0;
            initTargetAlpha[i] = isAmbient ? (0.1 + Math.random() * 0.3) : (0.2 + Math.random() * 0.8);

            initOffsetX[i] = 0;
            initOffsetY[i] = 0;
            initOffsetZ[i] = 0;
        }

        for (let i = 0; i < NUM_SHOOTING_STARS; i++) {
            initSSX[i] = w + Math.random() * w;
            initSSY[i] = -Math.random() * h;
            initSSSpeed[i] = 15 + Math.random() * 20;
            initSSAngle[i] = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
            initSSLength[i] = 80 + Math.random() * 100;
            initSSDelay[i] = Math.random() * 500;
            initSSActive[i] = 0; // false
        }

        pAngle.value = initAngle;
        pRadius.value = initRadius;
        pSpeed.value = initSpeed;
        pOffsetX.value = initOffsetX;
        pOffsetY.value = initOffsetY;
        pOffsetZ.value = initOffsetZ;
        pVX.value = initVX;
        pVY.value = initVY;
        pVZ.value = initVZ;
        pLayerY.value = initLayerY;
        pBaseRadius.value = initBaseRadius;
        pAlpha.value = initAlpha;
        pTargetAlpha.value = initTargetAlpha;
        pIsAmbient.value = initIsAmbient;

        pFinalX.value = initFinalX;
        pFinalY.value = initFinalY;
        pFinalZ.value = initFinalZ;

        ssX.value = initSSX;
        ssY.value = initSSY;
        ssSpeed.value = initSSSpeed;
        ssAngle.value = initSSAngle;
        ssLength.value = initSSLength;
        ssDelay.value = initSSDelay;
        ssActive.value = initSSActive;
    }, []);

    useFrameCallback(() => {
        const w = SCREEN_WIDTH;
        const h = SCREEN_HEIGHT;
        const centerX = w / 2;
        const centerY = h / 2;

        const angle = new Float32Array(pAngle.value);
        const radius = new Float32Array(pRadius.value);
        const speed = new Float32Array(pSpeed.value);
        const offsetX = new Float32Array(pOffsetX.value);
        const offsetY = new Float32Array(pOffsetY.value);
        const offsetZ = new Float32Array(pOffsetZ.value);
        const vx = new Float32Array(pVX.value);
        const vy = new Float32Array(pVY.value);
        const vz = new Float32Array(pVZ.value);
        const layerY = new Float32Array(pLayerY.value);
        const alpha = new Float32Array(pAlpha.value);
        const targetAlpha = new Float32Array(pTargetAlpha.value);
        const isAmbient = new Int8Array(pIsAmbient.value);

        const finalX = new Float32Array(pFinalX.value);
        const finalY = new Float32Array(pFinalY.value);
        const finalZ = new Float32Array(pFinalZ.value);

        const tX = new Float32Array(ssX.value);
        const tY = new Float32Array(ssY.value);
        const tDelay = new Float32Array(ssDelay.value);
        const tActive = new Int8Array(ssActive.value);
        const tSpeed = new Float32Array(ssSpeed.value);
        const tAngle = new Float32Array(ssAngle.value);
        const tLength = new Float32Array(ssLength.value);

        const cosT = Math.cos(TILT_ANGLE);
        const sinT = Math.sin(TILT_ANGLE);

        for (let i = 0; i < NUM_PARTICLES; i++) {
            angle[i] -= speed[i];

            const bx = Math.cos(angle[i]) * radius[i];
            const bz = Math.sin(angle[i]) * radius[i];
            const by = layerY[i];

            const ry = by * cosT - bz * sinT;
            const rz = by * sinT + bz * cosT;

            if (shockwaveActive.value === 1) {
                const perspectiveScale = 800 / (800 + (rz + offsetZ[i]));
                const sxScreen = centerX + (bx + offsetX[i]) * perspectiveScale;
                const syScreen = centerY + ry + offsetY[i];

                const diffX = sxScreen - shockwaveX.value;
                const diffY = syScreen - shockwaveY.value;
                const sDist = Math.max(Math.sqrt(diffX * diffX + diffY * diffY), 1);

                const maxDist = 600;
                if (sDist < maxDist) {
                    const force = (maxDist - sDist) / maxDist; // Linear falloff
                    const impact = (isAmbient[i] === 1 ? 2 : 5) * force; // Much smaller impulse
                    const dirMult = shockwavePush.value;

                    vx[i] += (diffX / sDist) * impact * dirMult;
                    vy[i] += (diffY / sDist) * impact * dirMult;
                    vz[i] += ((Math.random() - 0.5) * 2) * impact * dirMult;
                }
            }

            // Spring dynamics for offset slowly over minutes
            vx[i] -= offsetX[i] * 0.0001;
            vy[i] -= offsetY[i] * 0.0001;
            vz[i] -= offsetZ[i] * 0.0001;

            vx[i] *= 0.95;
            vy[i] *= 0.95;
            vz[i] *= 0.95;

            offsetX[i] += vx[i];
            offsetY[i] += vy[i];
            offsetZ[i] += vz[i];

            finalX[i] = centerX + bx + offsetX[i];
            finalY[i] = centerY + ry + offsetY[i];
            finalZ[i] = rz + offsetZ[i];

            if (alpha[i] < targetAlpha[i]) {
                alpha[i] += 0.01;
            }
        }

        if (shockwaveActive.value === 1) {
            shockwaveActive.value = 0;
        }

        // Shooting Stars updates
        for (let i = 0; i < NUM_SHOOTING_STARS; i++) {
            if (tActive[i] === 0) {
                if (tDelay[i] > 0) {
                    tDelay[i]--;
                } else {
                    tActive[i] = 1;
                    tX[i] = w + Math.random() * w * 0.5;
                    tY[i] = -Math.random() * h * 0.5;
                    tDelay[i] = 200 + Math.random() * 800;
                }
            } else {
                tX[i] -= Math.cos(tAngle[i]) * tSpeed[i];
                tY[i] += Math.sin(tAngle[i]) * tSpeed[i];

                if (tX[i] < -tLength[i] || tY[i] > h + tLength[i]) {
                    tActive[i] = 0;
                }
            }
        }

        // Commit back values that changed
        pAngle.value = angle;
        pOffsetX.value = offsetX;
        pOffsetY.value = offsetY;
        pOffsetZ.value = offsetZ;
        pVX.value = vx;
        pVY.value = vy;
        pVZ.value = vz;
        pAlpha.value = alpha;

        pFinalX.value = finalX;
        pFinalY.value = finalY;
        pFinalZ.value = finalZ;

        ssX.value = tX;
        ssY.value = tY;
        ssDelay.value = tDelay;
        ssActive.value = tActive;
    });

    const gesture = Gesture.Tap()
        .onStart((e) => {
            shockwaveActive.value = 1;
            shockwaveX.value = e.absoluteX;
            shockwaveY.value = e.absoluteY;
            shockwaveTime.value = 0;
            shockwavePush.value = Math.random() > 0.5 ? 1 : -1;
        });

    const particles = useMemo(() => {
        const p = [];
        for (let i = 0; i < NUM_PARTICLES; i++) {
            p.push(<ParticleNode key={i} index={i} pFinalX={pFinalX} pFinalY={pFinalY} pFinalZ={pFinalZ} pBaseRadius={pBaseRadius} pAlpha={pAlpha} pRadius={pRadius} pIsAmbient={pIsAmbient} />);
        }
        return p;
    }, []);

    const shootingStarsElements = useMemo(() => {
        const p = [];
        for (let i = 0; i < NUM_SHOOTING_STARS; i++) {
            p.push(<ShootingStarNode key={`ss-${i}`} index={i} ssX={ssX} ssY={ssY} ssAngle={ssAngle} ssLength={ssLength} ssActive={ssActive} />);
        }
        return p;
    }, []);

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={{ flex: 1, backgroundColor: '#000', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
                <Canvas style={{ flex: 1 }}>
                    <Group blendMode="screen">
                        {particles}
                        {shootingStarsElements}
                    </Group>
                </Canvas>
            </Animated.View>
        </GestureDetector>
    );
}

const ShootingStarNode = ({ index, ssX, ssY, ssAngle, ssLength, ssActive }: any) => {

    const p1 = useDerivedValue(() => {
        if (ssActive.value[index] === 0) return vec(-1000, -1000); // hide
        return vec(ssX.value[index], ssY.value[index]);
    });

    const p2 = useDerivedValue(() => {
        if (ssActive.value[index] === 0) return vec(-1000, -1000);
        const x = ssX.value[index];
        const y = ssY.value[index];
        const angle = ssAngle.value[index];
        const len = ssLength.value[index];
        return vec(x + Math.cos(angle) * len, y - Math.sin(angle) * len);
    });

    return (
        <Line p1={p1} p2={p2} color="rgba(255,255,255,1)" strokeWidth={1.5}>
            <LinearGradient
                start={p1}
                end={p2}
                colors={['rgba(255, 255, 255, 0.8)', 'rgba(200, 200, 255, 0.4)', 'rgba(255, 255, 255, 0)']}
            />
        </Line>
    );
};

const ParticleNode = ({ index, pFinalX, pFinalY, pFinalZ, pBaseRadius, pAlpha, pRadius, pIsAmbient }: any) => {

    const cx = useDerivedValue(() => {
        const x = pFinalX.value[index];
        const z = pFinalZ.value[index];
        const perspective = 800 / (800 + z);
        return (SCREEN_WIDTH / 2) + (x - (SCREEN_WIDTH / 2)) * perspective;
    });

    const cy = useDerivedValue(() => {
        const y = pFinalY.value[index];
        const z = pFinalZ.value[index];
        const perspective = 800 / (800 + z);
        return (SCREEN_HEIGHT / 2) + (y - (SCREEN_HEIGHT / 2)) * perspective;
    });

    const r = useDerivedValue(() => {
        const z = pFinalZ.value[index];
        const rad = pBaseRadius.value[index];
        const perspective = 800 / (800 + z);
        return (perspective > 0.1 && z > -700) ? Math.max(rad * perspective, 0.1) : 0;
    });

    const color = useDerivedValue(() => {
        const z = pFinalZ.value[index];
        if (z <= -700) return `rgba(0,0,0,0)`;

        let colorA = 255;
        let colorB = 255;
        let colorC = 255;

        if (pIsAmbient.value[index] === 0) {
            const rad = pRadius.value[index];
            const baseRad = pBaseRadius.value[index];
            const maxRadius = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.7;
            const centerBlend = Math.max(0, 1 - rad / (maxRadius * 0.35));

            const endR = 150, endG = 20, endB = 220;
            const coreR = 255, coreG = 210, coreB = 255;

            if (baseRad > 2.5 && rad > maxRadius * 0.1) {
                colorA = 255; colorB = 50; colorC = 120; // Magenta cluster
            } else if (rad > maxRadius * 0.5 && index % 3 === 0) {
                colorA = 30; colorB = 80; colorC = 255; // Deep blue
            } else {
                colorA = Math.floor(endR + (coreR - endR) * centerBlend);
                colorB = Math.floor(endG + (coreG - endG) * centerBlend);
                colorC = Math.floor(endB + (coreB - endB) * centerBlend);
            }
        } else {
            if (index % 4 === 0) {
                colorA = 30; colorB = 60; colorC = 200; // Ambient blue
            } else {
                colorA = 120; colorB = 30; colorC = 210; // Ambient purple
            }
        }

        const alpha = Math.max(0, pAlpha.value[index]);
        return `rgba(${colorA}, ${colorB}, ${colorC}, ${alpha})`;
    });

    return (
        <Circle cx={cx} cy={cy} r={r} color={color} />
    );
};

