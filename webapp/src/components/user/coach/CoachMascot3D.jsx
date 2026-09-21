import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

function PenguinMascotScene({ mood, onReady }) {
    const groupRef = useRef(null);
    const upperBeakRef = useRef(null);
    const lowerBeakRef = useRef(null);

    useEffect(() => {
        onReady?.(true);
    }, [onReady]);

    useFrame(({ clock }) => {
        if (!groupRef.current) return;
        const time = clock.elapsedTime;
        const isTalking = mood === "talking" || mood === "thinking";
        const talkPulse = Math.abs(Math.sin(time * 12));

        groupRef.current.rotation.y = Math.sin(time * 0.85) * 0.13;
        groupRef.current.rotation.z = Math.sin(time * 1.1) * 0.025;
        groupRef.current.position.y = Math.sin(time * (isTalking ? 2.2 : 1.2)) * 0.045;

        if (upperBeakRef.current && lowerBeakRef.current) {
            const openAmount = isTalking ? 0.012 + talkPulse * 0.035 : 0.006;
            upperBeakRef.current.position.y = 0.35 + openAmount;
            lowerBeakRef.current.position.y = 0.325 - openAmount;
            upperBeakRef.current.rotation.x = Math.PI / 2 - openAmount * 3.5;
            lowerBeakRef.current.rotation.x = Math.PI / 2 + openAmount * 3.5;
        }
    });

    return (
        <group ref={groupRef} position={[0, -0.6, 0]} scale={1.14}>
            <mesh position={[0, -0.16, 0]} scale={[0.72, 0.88, 0.48]}>
                <sphereGeometry args={[1, 48, 32]} />
                <meshStandardMaterial color="#08243f" roughness={0.48} metalness={0.03} />
            </mesh>

            <mesh position={[0, 0.17, 0.35]} scale={[0.5, 0.62, 0.09]}>
                <sphereGeometry args={[1, 48, 24]} />
                <meshStandardMaterial color="#fffaf0" roughness={0.6} />
            </mesh>

            <mesh position={[0, -0.36, 0.39]} scale={[0.46, 0.44, 0.08]}>
                <sphereGeometry args={[1, 40, 20]} />
                <meshStandardMaterial color="#fffaf0" roughness={0.62} />
            </mesh>

            <group position={[-0.64, -0.1, 0.04]} rotation={[0.12, -0.25, 0.32]}>
                <mesh scale={[0.13, 0.48, 0.08]}>
                    <sphereGeometry args={[1, 32, 16]} />
                    <meshStandardMaterial color="#0f3858" roughness={0.58} />
                </mesh>
            </group>

            <group position={[0.64, -0.1, 0.04]} rotation={[0.12, 0.25, -0.32]}>
                <mesh scale={[0.13, 0.48, 0.08]}>
                    <sphereGeometry args={[1, 32, 16]} />
                    <meshStandardMaterial color="#0f3858" roughness={0.58} />
                </mesh>
            </group>

            <group position={[0, 0.46, 0.565]}>
                <mesh position={[-0.17, 0, 0]} scale={[0.052, 0.052, 0.01]}>
                    <circleGeometry args={[1, 32]} />
                    <meshStandardMaterial color="#111827" roughness={0.25} />
                </mesh>
                <mesh position={[0.17, 0, 0]} scale={[0.052, 0.052, 0.01]}>
                    <circleGeometry args={[1, 32]} />
                    <meshStandardMaterial color="#111827" roughness={0.25} />
                </mesh>
                <mesh position={[-0.155, 0.018, 0.006]} scale={[0.015, 0.015, 0.004]}>
                    <circleGeometry args={[1, 18]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.15} />
                </mesh>
                <mesh position={[0.185, 0.018, 0.006]} scale={[0.015, 0.015, 0.004]}>
                    <circleGeometry args={[1, 18]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.15} />
                </mesh>
            </group>

            <mesh ref={upperBeakRef} position={[0, 0.36, 0.53]} rotation={[Math.PI / 2, 0, 0]} scale={[0.13, 0.16, 0.07]}>
                <coneGeometry args={[1, 1.15, 32]} />
                <meshStandardMaterial color="#f59e0b" roughness={0.42} />
            </mesh>
            <mesh ref={lowerBeakRef} position={[0, 0.32, 0.53]} rotation={[Math.PI / 2, 0, 0]} scale={[0.11, 0.12, 0.045]}>
                <coneGeometry args={[1, 0.9, 32]} />
                <meshStandardMaterial color="#fb923c" roughness={0.45} />
            </mesh>

            <mesh position={[-0.33, 0.24, 0.48]} scale={[0.045, 0.028, 0.012]}>
                <sphereGeometry args={[1, 18, 10]} />
                <meshStandardMaterial color="#fb7185" roughness={0.55} />
            </mesh>
            <mesh position={[0.33, 0.24, 0.48]} scale={[0.045, 0.028, 0.012]}>
                <sphereGeometry args={[1, 18, 10]} />
                <meshStandardMaterial color="#fb7185" roughness={0.55} />
            </mesh>

            <group position={[0, -0.6, 0.54]} rotation={[0.08, 0, 0]}>
                <mesh position={[-0.15, 0, 0]} rotation={[0, 0.18, 0]} scale={[0.2, 0.26, 0.025]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#63d5ff" roughness={0.55} />
                </mesh>
                <mesh position={[0.15, 0, 0]} rotation={[0, -0.18, 0]} scale={[0.2, 0.26, 0.025]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#7dd3fc" roughness={0.55} />
                </mesh>
                <mesh position={[0, 0.02, 0.022]} scale={[0.026, 0.28, 0.018]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#0ea5e9" roughness={0.5} />
                </mesh>
                <mesh position={[0, 0.06, 0.055]} rotation={[0, 0, Math.PI / 4]} scale={[0.055, 0.055, 0.01]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#f59e0b" roughness={0.35} />
                </mesh>
            </group>

            <mesh position={[-0.32, -0.91, 0.24]} rotation={[0.1, 0.15, 0.12]} scale={[0.2, 0.075, 0.12]}>
                <sphereGeometry args={[1, 28, 14]} />
                <meshStandardMaterial color="#f59e0b" roughness={0.5} />
            </mesh>
            <mesh position={[0.32, -0.91, 0.24]} rotation={[0.1, -0.15, -0.12]} scale={[0.2, 0.075, 0.12]}>
                <sphereGeometry args={[1, 28, 14]} />
                <meshStandardMaterial color="#f59e0b" roughness={0.5} />
            </mesh>
        </group>
    );
}

function CoachMascot3D({ mood, onReady }) {
    return (
        <Canvas
            camera={{ position: [0, 1.1, 4.2], fov: 32 }}
            dpr={[1, 1.5]}
            gl={{ alpha: true, antialias: true }}
        >
            <ambientLight intensity={1.6} />
            <directionalLight position={[3, 4, 5]} intensity={2.8} />
            <directionalLight position={[-3, 2, 2]} intensity={0.9} />
            <PenguinMascotScene mood={mood} onReady={onReady} />
        </Canvas>
    );
}

export default CoachMascot3D;
