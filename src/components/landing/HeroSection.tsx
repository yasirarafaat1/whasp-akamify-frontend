import { useRef, Suspense, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, RoundedBox, Text } from "@react-three/drei";
import { motion } from "framer-motion";
import { useGSAP } from "./useGSAP";
import gsap from "gsap";
import * as THREE from "three";

// ─── 3D Phone Model ────────────────────────────────────────────────────────────
function PhoneModel({ active = false }: { active?: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    const hoverBoost = active ? 1 : 0.5;
    // Use negative X so it feels like you're "tilting" the phone (not mirrored).
    const targetY = Math.sin(t * 0.4) * 0.22 + state.pointer.x * -0.35 * hoverBoost;
    const targetX = Math.sin(t * 0.3) * 0.06 + state.pointer.y * 0.22 * hoverBoost;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetY,
      0.08
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetX,
      0.08
    );
  });

  return (
    <group ref={groupRef} rotation={[0.02, -0.12, 0]}>
      {/* Phone body */}
      <RoundedBox args={[1.8, 3.6, 0.18]} radius={0.22} smoothness={8}>
        <meshStandardMaterial color="#d7dbe0" roughness={0.35} metalness={0.25} />
      </RoundedBox>

      {/* Inner bezel (gives clearer "phone body" depth) */}
      <RoundedBox args={[1.68, 3.44, 0.12]} radius={0.20} smoothness={8} position={[0, 0, 0.035]}>
        <meshStandardMaterial color="#c7cbd0" roughness={0.55} metalness={0.12} />
      </RoundedBox>

      {/* Screen glass */}
      <mesh position={[0, 0, 0.105]}>
        <planeGeometry args={[1.42, 2.92]} />
        <meshStandardMaterial color="#0b1222" roughness={0.15} metalness={0.25} />
      </mesh>

      {/* WhatsApp demo UI layer (above glass) */}
      <group position={[0, 0, 0.118]}>
        {/* Chat background */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[1.38, 2.86]} />
          <meshBasicMaterial color="#efe8df" />
        </mesh>

        {/* Status bar */}
        <Text
          position={[-0.58, 1.40, 0.01]}
          fontSize={0.09}
          color="#ffffff"
          anchorX="left"
          anchorY="middle"
        >
          18:30
        </Text>
        <group position={[0.50, 1.40, 0.01]} scale={0.9}>
          <mesh position={[-0.10, 0, 0]}>
            <boxGeometry args={[0.05, 0.10, 0.01]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.04, 0, 0]}>
            <boxGeometry args={[0.05, 0.14, 0.01]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.02, 0, 0]}>
            <boxGeometry args={[0.05, 0.18, 0.01]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.12, 0, 0]}>
            <boxGeometry args={[0.16, 0.09, 0.01]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>

        {/* Header bar */}
        <mesh position={[0, 1.10, 0.002]}>
          <planeGeometry args={[1.38, 0.62]} />
          <meshBasicMaterial color="#075e54" />
        </mesh>

        {/* Back */}
        <Text position={[-0.60, 1.10, 0.01]} fontSize={0.15} color="#ffffff" anchorX="center" anchorY="middle">
          ←
        </Text>

        {/* DP */}
        <mesh position={[-0.40, 1.10, 0.01]}>
          <circleGeometry args={[0.14, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Name + subtitle */}
        <Text
          position={[-0.20, 1.14, 0.01]}
          fontSize={0.10}
          color="#ffffff"
          anchorX="left"
          anchorY="middle"
          maxWidth={0.78}
        >
          Waspakamify Biz
        </Text>
        <group position={[0.30, 1.14, 0.012]}>
          <mesh>
            <circleGeometry args={[0.05, 24]} />
            <meshBasicMaterial color="#34b7f1" />
          </mesh>
          <Text fontSize={0.07} color="#ffffff" anchorX="center" anchorY="middle" position={[0, -0.005, 0.01]}>
            ✓
          </Text>
        </group>
        <Text
          position={[-0.20, 1.02, 0.01]}
          fontSize={0.075}
          color="rgba(255,255,255,0.85)"
          anchorX="left"
          anchorY="middle"
        >
          Online
        </Text>

        {/* Right-side icons (camera, phone, menu) */}
        <group position={[0.46, 1.10, 0.01]} scale={0.78}>
          {/* video */}
          <mesh position={[-0.06, 0, 0]}>
            <boxGeometry args={[0.13, 0.10, 0.01]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.04, 0, 0]}>
            <boxGeometry args={[0.06, 0.06, 0.01]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* phone */}
          <mesh position={[0.19, 0, 0]}>
            <RoundedBox args={[0.12, 0.12, 0.01]} radius={0.04} smoothness={6}>
              <meshBasicMaterial color="#ffffff" />
            </RoundedBox>
          </mesh>
          {/* 3 dots */}
          <mesh position={[0.33, 0.04, 0]}>
            <circleGeometry args={[0.015, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.33, 0.0, 0]}>
            <circleGeometry args={[0.015, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.33, -0.04, 0]}>
            <circleGeometry args={[0.015, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>

        {/* Messages */}
        <ChatMessage3D
          align="in"
          y={0.62}
          text={'Hi! We got your enquiry about\n"Summer Combo Offer".'}
          time="10:24"
        />
        <ChatMessage3D
          align="out"
          y={0.14}
          text={"Great! What are today’s\ndiscounts for 10 units?"}
          time="10:25"
          ticks="double"
        />
        <ChatMessage3D
          align="in"
          y={-0.32}
          text={"✅ 15% off + free delivery\nTracked link shared."}
          time="10:26"
        />
        <ChatMessage3D
          align="out"
          y={-0.78}
          text={"Perfect. Please share invoice\n& delivery ETA."}
          time="10:27"
          ticks="double"
        />

        {/* Input area */}
        <RoundedBox args={[1.18, 0.24, 0.02]} radius={0.12} smoothness={10} position={[-0.08, -1.28, 0.01]}>
          <meshBasicMaterial color="#ffffff" />
        </RoundedBox>
        <Text position={[-0.56, -1.28, 0.03]} fontSize={0.065} color="#94a3b8" anchorX="left" anchorY="middle">
          Type a message
        </Text>
        <Text position={[-0.62, -1.28, 0.03]} fontSize={0.11} color="#94a3b8" anchorX="center" anchorY="middle">
          ☺
        </Text>
        <Text position={[0.34, -1.28, 0.03]} fontSize={0.12} color="#94a3b8" anchorX="center" anchorY="middle">
          📎
        </Text>
        <Text position={[0.48, -1.28, 0.03]} fontSize={0.12} color="#94a3b8" anchorX="center" anchorY="middle">
          📷
        </Text>
        <mesh position={[0.62, -1.28, 0.02]}>
          <circleGeometry args={[0.14, 32]} />
          <meshBasicMaterial color="#25D366" />
        </mesh>
        <Text position={[0.62, -1.285, 0.03]} fontSize={0.11} color="#ffffff" anchorX="center" anchorY="middle">
          🎤
        </Text>
      </group>

      {/* Camera notch */}
      <RoundedBox args={[0.70, 0.22, 0.06]} radius={0.11} smoothness={10} position={[0, 1.58, 0.10]}>
        <meshStandardMaterial color="#f3f4f6" roughness={0.35} metalness={0.05} />
      </RoundedBox>
      <RoundedBox args={[0.28, 0.05, 0.02]} radius={0.025} smoothness={8} position={[-0.06, 1.60, 0.135]}>
        <meshStandardMaterial color="#0a0a0a" roughness={0.25} metalness={0.2} />
      </RoundedBox>
      <mesh position={[0.18, 1.60, 0.135]}>
        <circleGeometry args={[0.04, 24]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.25} metalness={0.2} />
      </mesh>
      <mesh position={[0.18, 1.60, 0.145]}>
        <circleGeometry args={[0.018, 24]} />
        <meshStandardMaterial color="#2563eb" roughness={0.25} metalness={0.1} emissive="#0b1020" emissiveIntensity={0.2} />
      </mesh>

      {/* Side buttons */}
      <mesh position={[0.93, 0.4, 0]}>
        <boxGeometry args={[0.05, 0.35, 0.1]} />
        <meshStandardMaterial color="#2a3d2a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.93, 0.2, 0]}>
        <boxGeometry args={[0.05, 0.25, 0.1]} />
        <meshStandardMaterial color="#2a3d2a" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function ChatMessage3D({
  align,
  y,
  text,
  time,
  ticks,
}: {
  align: "in" | "out";
  y: number;
  text: string;
  time: string;
  ticks?: "none" | "single" | "double";
}) {
  const isOut = align === "out";
  const x = isOut ? 0.23 : -0.18;
  const bubbleColor = isOut ? "#d9fdd3" : "#ffffff";

  return (
    <group position={[x, y, 0.01]}>
      <RoundedBox args={[1.05, 0.34, 0.02]} radius={0.08} smoothness={10}>
        <meshBasicMaterial color={bubbleColor} />
      </RoundedBox>

      {/* Tail */}
      <mesh position={[isOut ? 0.49 : -0.49, -0.12, 0.011]} rotation={[0, 0, isOut ? -0.45 : 0.45]}>
        <circleGeometry args={[0.09, 3]} />
        <meshBasicMaterial color={bubbleColor} />
      </mesh>

      <Text
        position={[-0.47, 0.05, 0.03]}
        fontSize={0.065}
        color="#0b1020"
        anchorX="left"
        anchorY="middle"
        maxWidth={0.96}
        lineHeight={1.1}
      >
        {text}
      </Text>
      <Text
        position={[0.40, -0.11, 0.03]}
        fontSize={0.05}
        color="#64748b"
        anchorX="right"
        anchorY="middle"
      >
        {time}
      </Text>

      {isOut && ticks && ticks !== "none" ? (
        <Text
          position={[0.47, -0.11, 0.03]}
          fontSize={0.055}
          color={ticks === "double" ? "#34b7f1" : "#94a3b8"}
          anchorX="right"
          anchorY="middle"
        >
          {ticks === "double" ? "✓✓" : "✓"}
        </Text>
      ) : null}
    </group>
  );
}

// ─── Floating Orbs ─────────────────────────────────────────────────────────────
function FloatingOrb({ position, color, size, speed }: {
  position: [number, number, number];
  color: string;
  size: number;
  speed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock, pointer }) => {
    const t = clock.getElapsedTime() * speed;
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(t) * 0.3;
      meshRef.current.position.x = position[0] + pointer.x * 0.55;
      meshRef.current.position.z = position[2] + pointer.y * 0.35;
      meshRef.current.rotation.x = t * 0.5;
      meshRef.current.rotation.z = t * 0.3;
    }
  });
  return (
    <Float speed={speed} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef} position={position}>
        <icosahedronGeometry args={[size, 1]} />
        <meshStandardMaterial color={color} wireframe opacity={0.4} transparent />
      </mesh>
    </Float>
  );
}

// ─── Particle Ring ─────────────────────────────────────────────────────────────
function ParticleRing() {
  const points = useRef<THREE.Points>(null!);
  const count = 200;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const radius = 4.5 + Math.random() * 0.5;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  useFrame(({ clock }) => {
    if (points.current) points.current.rotation.y = clock.getElapsedTime() * 0.05;
  });
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#25D366" sizeAttenuation transparent opacity={0.6} />
    </points>
  );
}

// ─── Hero Scene ────────────────────────────────────────────────────────────────
function HeroScene({ active = false }: { active?: boolean }) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 3]} intensity={1.2} color="#ffffff" />
      <pointLight position={[4, 3.5, 4]} intensity={2.4} color="#25D366" />
      <pointLight position={[-4, -2.5, -4]} intensity={1.6} color="#7c3aed" />
      <pointLight position={[0, 8, 0]} intensity={0.9} color="#ffffff" />
      <Environment preset="city" />

      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.8}>
        <PhoneModel active={active} />
      </Float>

      <FloatingOrb position={[-3.5, 1.5, -2]} color="#25D366" size={0.25} speed={0.8} />
      <FloatingOrb position={[3.2, -1, -1]} color="#7c3aed" size={0.18} speed={1.2} />
      <FloatingOrb position={[-2.5, -2, 1]} color="#06b6d4" size={0.15} speed={1.0} />
      <FloatingOrb position={[2.8, 2.2, -2]} color="#f59e0b" size={0.2} speed={0.7} />

      <ParticleRing />
    </>
  );
}

// ─── Floating Chat Bubble (2D overlay) ─────────────────────────────────────────
function ChatBubble({ text, delay, className }: { text: string; delay: number; className: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.6, type: "spring", stiffness: 200 }}
      className={`absolute z-20 max-w-[min(320px,82vw)] backdrop-blur-md bg-white/85 border border-ink-900/12 rounded-2xl px-4 py-2.5 text-sm font-medium shadow-[0_18px_50px_rgba(11,16,32,0.14)] pointer-events-none ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
        <span className="text-ink-900/80">{text}</span>
      </div>
    </motion.div>
  );
}

// ─── Hero Section ──────────────────────────────────────────────────────────────
export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroHover, setHeroHover] = useState(false);

  useGSAP(() => {
    gsap.from(".hero-badge", { opacity: 0, y: 30, duration: 0.8, delay: 0.2 });
    gsap.from(".hero-title", { opacity: 0, y: 50, duration: 1, delay: 0.4, stagger: 0.1 });
    gsap.from(".hero-sub", { opacity: 0, y: 30, duration: 0.8, delay: 0.7 });
    gsap.from(".hero-ctas", { opacity: 0, y: 20, duration: 0.8, delay: 0.9 });
    gsap.from(".hero-stats", { opacity: 0, y: 20, duration: 0.8, delay: 1.1, stagger: 0.1 });
  }, []);

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(6,183,126,0.16) 0%, #f7f6f2 62%)",
      }}
    >
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxMSwxNiwzMiwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 w-full pt-25 md:pt-15 pb-5 md:pb-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text Content */}
          <div className="flex flex-col gap-6 z-10">
            {/* <div className="hero-badge inline-flex w-fit items-center gap-2 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 px-4 py-1.5 text-xs font-semibold text-[#25D366] tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
              WhatsApp Marketing Platform
            </div> */}

            <div>
              <h1 className="hero-title text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.05] tracking-tight">
                <span className="block text-ink-900">Send Smarter.</span>
                <span className="block bg-gradient-to-r from-[#25D366] via-[#11d593] to-[#06b6d4] bg-clip-text text-transparent">
                  Convert Faster.
                </span>
                <span className="block text-ink-900/70">Scale Bigger.</span>
              </h1>
            </div>

            <p className="hero-sub text-lg text-ink-900/70 leading-relaxed max-w-md">
              The all-in-one WhatsApp Business API platform. Automate campaigns, manage contacts, and drive real revenue — all from one beautiful dashboard.
            </p>

            <div className="hero-ctas flex flex-wrap items-center gap-4">
              <a
                href="/register"
                className="group relative flex items-center gap-2 bg-gradient-to-r from-[#25D366] to-[#06b77e] text-white font-bold px-8 py-4 rounded-2xl text-base shadow-2xl shadow-[#25D366]/30 hover:shadow-[#25D366]/50 hover:scale-105 transition-all duration-300"
              >
                Start Free Trial
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a
                href="#how-it-works"
                className="flex items-center gap-2 border border-ink-900/12 text-ink-900/80 hover:text-ink-900 hover:border-ink-900/18 font-semibold px-8 py-4 rounded-2xl text-base transition-all duration-300 hover:bg-white/60"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch Demo
              </a>
            </div>

            {/* Stats */}
            <div className="hero-stats flex items-center gap-8 pt-2">
              {[
                { val: "50K+", label: "Active Users" },
                { val: "2B+", label: "Messages Sent" },
                { val: "99.9%", label: "Uptime SLA" },
              ].map(({ val, label }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-2xl font-extrabold text-ink-900">{val}</span>
                  <span className="text-xs text-ink-900/55 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: 3D Canvas */}
          <div className="relative h-[440px] sm:h-[520px] lg:h-[620px]">
            <Canvas
              camera={{ position: [0, 0, 6], fov: 45 }}
              dpr={[1, 1.75]}
              performance={{ min: 0.5 }}
              gl={{ antialias: true, alpha: true }}
              onPointerEnter={() => setHeroHover(true)}
              onPointerLeave={() => setHeroHover(false)}
            >
              <Suspense fallback={null}>
                <HeroScene active={heroHover} />
              </Suspense>
            </Canvas>

            {/* Floating overlays */}
            <ChatBubble
              text="Campaign sent to 10,420 users!"
              delay={1.5}
              className="top-2 left-1/2 -translate-x-1/2 sm:top-10 sm:left-6 sm:translate-x-0 lg:left-6"
            />
            <ChatBubble
              text="94% delivery rate"
              delay={1.9}
              className="bottom-20 left-2 sm:bottom-24 sm:left-6 lg:left-6"
            />
            <ChatBubble
              text="3.2x conversion boost"
              delay={2.3}
              className="top-1/3 right-2 sm:right-6 lg:right-6"
            />
            <ChatBubble
              text="Auto-reply active"
              delay={2.7}
              className="bottom-10 right-1 sm:right-6"
            />

            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none rounded-3xl" style={{
              background: "radial-gradient(circle at 50% 50%, rgba(37,211,102,0.08) 0%, transparent 70%)"
            }} />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      {/* <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-ink-900/45 tracking-widest uppercase">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-ink-900/35 to-transparent" />
      </motion.div> */}
    </section>
  );
}
