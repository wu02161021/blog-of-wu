import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Points, PointMaterial } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import { AdditiveBlending } from 'three'
import type { Group, Mesh } from 'three'
type SceneMode = 'login' | 'register'

type PlanetConfig = {
  name: string
  radius: number
  size: number
  speed: number
  rotationSpeed: number
  color: string
  emissive: string
  metalness: number
  roughness: number
}

const planets: PlanetConfig[] = [
  {
    name: 'Mercury',
    radius: 1.05,
    size: 0.08,
    speed: 1.85,
    rotationSpeed: 1.4,
    color: '#cbd5e1',
    emissive: '#334155',
    metalness: 0.45,
    roughness: 0.52,
  },
  {
    name: 'Venus',
    radius: 1.42,
    size: 0.12,
    speed: 1.5,
    rotationSpeed: 0.95,
    color: '#facc15',
    emissive: '#713f12',
    metalness: 0.3,
    roughness: 0.6,
  },
  {
    name: 'Earth',
    radius: 1.86,
    size: 0.13,
    speed: 1.18,
    rotationSpeed: 1.9,
    color: '#38bdf8',
    emissive: '#155e75',
    metalness: 0.28,
    roughness: 0.46,
  },
  {
    name: 'Mars',
    radius: 2.24,
    size: 0.11,
    speed: 0.96,
    rotationSpeed: 1.2,
    color: '#fb7185',
    emissive: '#881337',
    metalness: 0.2,
    roughness: 0.68,
  },
  {
    name: 'Jupiter',
    radius: 2.72,
    size: 0.23,
    speed: 0.7,
    rotationSpeed: 1.05,
    color: '#fb923c',
    emissive: '#7c2d12',
    metalness: 0.22,
    roughness: 0.54,
  },
  {
    name: 'Saturn',
    radius: 3.21,
    size: 0.2,
    speed: 0.54,
    rotationSpeed: 0.95,
    color: '#fde68a',
    emissive: '#854d0e',
    metalness: 0.24,
    roughness: 0.52,
  },
  {
    name: 'Uranus',
    radius: 3.7,
    size: 0.17,
    speed: 0.42,
    rotationSpeed: 0.85,
    color: '#67e8f9',
    emissive: '#164e63',
    metalness: 0.34,
    roughness: 0.45,
  },
  {
    name: 'Neptune',
    radius: 4.16,
    size: 0.17,
    speed: 0.33,
    rotationSpeed: 0.78,
    color: '#60a5fa',
    emissive: '#1d4ed8',
    metalness: 0.38,
    roughness: 0.43,
  },
]

function SolarSystem({ mode = 'login' }: { mode?: SceneMode }) {
  const activePlanets = mode === 'register' ? planets.filter((planet) => ['Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn'].includes(planet.name)) : planets
  const systemRef = useRef<Group>(null)
  const planetRefs = useRef<(Group | null)[]>([])
  const atmosphereRefs = useRef<(Mesh | null)[]>([])
  const orbitGlowRefs = useRef<(Mesh | null)[]>([])
  const registerSatelliteRef = useRef<Group>(null)
  const registerPulseRef = useRef<Mesh>(null)

  useFrame((state, delta) => {
    if (systemRef.current) {
      const drift = mode === 'register' ? 0.028 : 0.045
      systemRef.current.rotation.y += delta * drift
      systemRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * (mode === 'register' ? 0.035 : 0.05)
    }

    activePlanets.forEach((planet, index) => {
      const target = planetRefs.current[index]
      if (!target) return
      const registerSpeedScale = mode === 'register' ? 0.78 : 1
      const angle = state.clock.elapsedTime * planet.speed * registerSpeedScale + index * 0.6
      target.position.x = Math.cos(angle) * planet.radius
      target.position.z = Math.sin(angle) * planet.radius
      target.position.y = Math.sin(angle * 0.3 + index) * 0.02
      target.rotation.y += delta * planet.rotationSpeed * (mode === 'register' ? 0.7 : 1)

      const atmosphere = atmosphereRefs.current[index]
      if (atmosphere) {
        atmosphere.rotation.y += delta * 0.25
        atmosphere.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 1.5 + index) * 0.01)
      }

      const orbitGlow = orbitGlowRefs.current[index]
      if (orbitGlow) {
        orbitGlow.rotation.z += delta * 0.05
      }
    })

    if (mode === 'register') {
      if (registerSatelliteRef.current) {
        const angle = state.clock.elapsedTime * 0.72 + 0.85
        registerSatelliteRef.current.position.x = Math.cos(angle) * 2.56
        registerSatelliteRef.current.position.z = Math.sin(angle) * 2.56
        registerSatelliteRef.current.position.y = 0.06 + Math.sin(state.clock.elapsedTime * 0.45) * 0.025
        registerSatelliteRef.current.rotation.y += delta * 0.95
      }

      if (registerPulseRef.current) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.65) * 0.22
        registerPulseRef.current.scale.setScalar(pulse)
      }
    }
  })

  return (
    <group ref={systemRef}>
      <mesh>
        <sphereGeometry args={[0.38, 48, 48]} />
        <meshPhysicalMaterial
          color={mode === 'register' ? '#93c5fd' : '#fcd34d'}
          emissive={mode === 'register' ? '#1d4ed8' : '#fb923c'}
          emissiveIntensity={mode === 'register' ? 1.05 : 1.4}
          roughness={0.25}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.2}
          toneMapped={false}
        />
      </mesh>
      <mesh scale={1.55}>
        <sphereGeometry args={[0.38, 24, 24]} />
        <meshBasicMaterial
          color={mode === 'register' ? '#60a5fa' : '#fdba74'}
          transparent
          opacity={mode === 'register' ? 0.2 : 0.22}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {activePlanets.map((planet, index) => (
        <group key={planet.name}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.radius - 0.003, planet.radius + 0.003, 120]} />
            <meshBasicMaterial color="#334155" transparent opacity={0.35} side={2} depthWrite={false} />
          </mesh>
          <mesh ref={(element) => (orbitGlowRefs.current[index] = element)} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.radius - 0.018, planet.radius + 0.018, 120]} />
            <meshBasicMaterial
              color={index % 2 === 0 ? '#60a5fa' : '#a78bfa'}
              transparent
              opacity={0.12}
              side={2}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          <group ref={(element) => (planetRefs.current[index] = element)}>
            <mesh>
              <sphereGeometry args={[planet.size, 32, 32]} />
              <meshPhysicalMaterial
                color={planet.color}
                emissive={planet.emissive}
                emissiveIntensity={0.45}
                metalness={planet.metalness}
                roughness={planet.roughness}
                clearcoat={0.45}
                clearcoatRoughness={0.35}
              />
            </mesh>
            <mesh ref={(element) => (atmosphereRefs.current[index] = element)} scale={1.14}>
              <sphereGeometry args={[planet.size, 24, 24]} />
              <meshBasicMaterial
                color={planet.color}
                transparent
                opacity={0.11}
                blending={AdditiveBlending}
                depthWrite={false}
              />
            </mesh>

            {planet.name === 'Saturn' && (
              <mesh rotation={[-Math.PI / 2.9, 0.4, 0]}>
                <torusGeometry args={[planet.size * 1.62, planet.size * 0.13, 18, 120]} />
                <meshPhysicalMaterial
                  color="#fef3c7"
                  emissive="#92400e"
                  emissiveIntensity={0.28}
                  roughness={0.44}
                  metalness={0.25}
                  clearcoat={0.6}
                />
              </mesh>
            )}
          </group>
        </group>
      ))}

      {mode === 'register' && (
        <>
          <mesh rotation={[-Math.PI / 2.4, 0.45, 0]} position={[0.4, 0.1, -0.05]}>
            <torusGeometry args={[1.18, 0.026, 20, 160]} />
            <meshBasicMaterial
              color="#93c5fd"
              transparent
              opacity={0.33}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.54, 2.565, 120]} />
            <meshBasicMaterial color="#7dd3fc" transparent opacity={0.22} side={2} depthWrite={false} />
          </mesh>

          <group ref={registerSatelliteRef}>
            <mesh>
              <sphereGeometry args={[0.07, 26, 26]} />
              <meshPhysicalMaterial
                color="#a5f3fc"
                emissive="#155e75"
                emissiveIntensity={0.8}
                roughness={0.42}
                metalness={0.35}
                clearcoat={0.6}
              />
            </mesh>
            <mesh scale={1.75}>
              <sphereGeometry args={[0.07, 18, 18]} />
              <meshBasicMaterial
                color="#67e8f9"
                transparent
                opacity={0.2}
                blending={AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>

          <group position={[-1.55, 0.06, 1.9]}>
            <mesh>
              <sphereGeometry args={[0.04, 20, 20]} />
              <meshBasicMaterial color="#93c5fd" transparent opacity={0.9} />
            </mesh>
            <mesh ref={registerPulseRef} scale={1.1}>
              <sphereGeometry args={[0.06, 18, 18]} />
              <meshBasicMaterial
                color="#60a5fa"
                transparent
                opacity={0.24}
                blending={AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
        </>
      )}
    </group>
  )
}

function StarField() {
  const positions = useMemo(() => {
    const points = new Float32Array(1600 * 3)
    for (let i = 0; i < points.length; i += 3) {
      points[i] = (Math.random() - 0.5) * 28
      points[i + 1] = (Math.random() - 0.5) * 18
      points[i + 2] = (Math.random() - 0.5) * 26
    }
    return points
  }, [])
  const pointsRef = useRef<Group>(null)

  useFrame((state) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.01
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.04
  })

  return (
    <group ref={pointsRef}>
      <Points positions={positions} stride={3} frustumCulled>
        <PointMaterial
          color="#c4b5fd"
          size={0.03}
          transparent
          opacity={0.75}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </Points>
      <Points positions={positions} stride={3} frustumCulled rotation={[0.18, 0.24, 0]}>
        <PointMaterial
          color="#7dd3fc"
          size={0.018}
          transparent
          opacity={0.42}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </Points>
    </group>
  )
}

export function LoginScene({ mode = 'login' }: { mode?: SceneMode }) {
  return (
    <Canvas
      camera={mode === 'register' ? { position: [0.7, 0.85, 7.6], fov: 46 } : { position: [0, 1.05, 7.2], fov: 50 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={[mode === 'register' ? '#02091f' : '#030712']} />
      <fog attach="fog" args={[mode === 'register' ? '#020617' : '#020617', 6, mode === 'register' ? 20 : 18]} />
      <ambientLight intensity={mode === 'register' ? 0.34 : 0.4} />
      <pointLight position={[0, 0, 0]} intensity={mode === 'register' ? 13 : 20} color={mode === 'register' ? '#60a5fa' : '#fb923c'} distance={12} />
      <pointLight position={[0, 0, 0]} intensity={mode === 'register' ? 12 : 9} color="#60a5fa" distance={16} />
      <directionalLight position={[2.2, 3.2, 1.2]} intensity={mode === 'register' ? 0.55 : 0.68} color={mode === 'register' ? '#93c5fd' : '#c4b5fd'} />
      <mesh position={[0, 1.6, -5.2]} rotation={[-0.35, 0, 0]}>
        <planeGeometry args={[16, 8]} />
        <meshBasicMaterial
          color={mode === 'register' ? '#1d4ed8' : '#7c3aed'}
          transparent
          opacity={mode === 'register' ? 0.09 : 0.12}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, -1.4, -5]} rotation={[0.2, 0, 0]}>
        <planeGeometry args={[18, 7]} />
        <meshBasicMaterial
          color={mode === 'register' ? '#38bdf8' : '#0ea5e9'}
          transparent
          opacity={mode === 'register' ? 0.08 : 0.1}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <SolarSystem mode={mode} />
      <StarField />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={mode === 'register' ? 0.08 : 0.12}
        minPolarAngle={Math.PI / 2.45}
        maxPolarAngle={Math.PI / 1.88}
      />
    </Canvas>
  )
}
