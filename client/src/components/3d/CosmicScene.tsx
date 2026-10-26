import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface CosmicSceneProps {
  isButtonHovered?: boolean;
  className?: string;
  showEntityMesh?: boolean;
}

export const CosmicScene: React.FC<CosmicSceneProps> = ({
  isButtonHovered = false,
  className = '',
  showEntityMesh = false
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const mainGroupRef = useRef<THREE.Group | null>(null);
  const energyCoreRef = useRef<THREE.Group | null>(null);
  const coreMeshRef = useRef<THREE.Mesh | null>(null);
  const coreLightRef = useRef<THREE.PointLight | null>(null);
  const magentaLightRef = useRef<THREE.PointLight | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const innerStarsRef = useRef<THREE.Points | null>(null);

  const [webGlSupported, setWebGlSupported] = useState(true);

  // Mouse & drag interaction coordinates
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. WebGL Support Detection
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
        return;
      }
    } catch {
      setWebGlSupported(false);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 2. Setup Three.js Scene, Camera, and Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x020204, 0.035);

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 100);
    camera.position.set(0, 0, 9.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Central Group for the Celestial Cosmic Entity
    const mainGroup = new THREE.Group();
    mainGroup.visible = showEntityMesh;
    scene.add(mainGroup);
    mainGroupRef.current = mainGroup;

    // ==============================================================
    // 4. CELESTIAL HOODED CLOAK / DRAPERY (Pale Pearl-White with Purple Sheen)
    // Directly inspired by the reference artwork's silk-draped cowl
    // ==============================================================
    const hoodPoints: THREE.Vector2[] = [];
    hoodPoints.push(new THREE.Vector2(0.12, 3.4));  // Apex fold
    hoodPoints.push(new THREE.Vector2(0.85, 3.25)); // Crown curve
    hoodPoints.push(new THREE.Vector2(1.7, 2.65));  // Upper temple curve
    hoodPoints.push(new THREE.Vector2(2.35, 1.6));  // Shoulder sweep
    hoodPoints.push(new THREE.Vector2(2.7, 0.3));   // Chest drape spread
    hoodPoints.push(new THREE.Vector2(2.9, -1.2));  // Mid flowing cloth
    hoodPoints.push(new THREE.Vector2(3.1, -2.7));  // Lower torso drape
    hoodPoints.push(new THREE.Vector2(3.3, -4.2));  // Cascade base

    const hoodGeometry = new THREE.LatheGeometry(hoodPoints, 64, 0, Math.PI * 1.55);
    hoodGeometry.center();
    // Open aperture facing forward toward the viewer
    hoodGeometry.rotateY(-Math.PI * 0.78);

    // Luxurious pearl-white silk material with clearcoat & violet rim sheen
    const cloakMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xede8ff,
      roughness: 0.28,
      metalness: 0.08,
      clearcoat: 0.55,
      clearcoatRoughness: 0.12,
      sheen: 1.0,
      sheenColor: new THREE.Color(0xa855f7),
      sheenRoughness: 0.25,
      side: THREE.DoubleSide
    });

    const hoodMesh = new THREE.Mesh(hoodGeometry, cloakMaterial);
    hoodMesh.scale.set(1.18, 1.18, 1.05);
    hoodMesh.position.set(0, 0.35, -0.2);
    mainGroup.add(hoodMesh);

    // ==============================================================
    // 5. INNER COSMIC FACE VOID (Deep space cavity with starry vortex)
    // ==============================================================
    const faceVoidGeom = new THREE.SphereGeometry(1.22, 32, 32);
    const faceVoidMat = new THREE.MeshBasicMaterial({
      color: 0x000000
    });
    const faceVoidMesh = new THREE.Mesh(faceVoidGeom, faceVoidMat);
    faceVoidMesh.scale.set(0.85, 1.35, 0.75);
    faceVoidMesh.position.set(0, 0.65, -0.32);
    mainGroup.add(faceVoidMesh);

    // Dense inner starfield inside the face cavity (glittering celestial core)
    const innerStarCount = 280;
    const innerStarPos = new Float32Array(innerStarCount * 3);
    const innerStarCols = new Float32Array(innerStarCount * 3);
    const colMagenta = new THREE.Color(0xff2df7);
    const colViolet = new THREE.Color(0xa855f7);
    const colWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < innerStarCount; i++) {
      const i3 = i * 3;
      const r = Math.random() * 0.75;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.45) * 1.4;

      innerStarPos[i3] = Math.cos(theta) * r * 0.65;
      innerStarPos[i3 + 1] = 0.65 + y;
      innerStarPos[i3 + 2] = -0.15 + (Math.random() - 0.5) * 0.3;

      const c = Math.random() > 0.5 ? colWhite : (Math.random() > 0.5 ? colMagenta : colViolet);
      innerStarCols[i3] = c.r;
      innerStarCols[i3 + 1] = c.g;
      innerStarCols[i3 + 2] = c.b;
    }

    const innerStarsGeom = new THREE.BufferGeometry();
    innerStarsGeom.setAttribute('position', new THREE.BufferAttribute(innerStarPos, 3));
    innerStarsGeom.setAttribute('color', new THREE.BufferAttribute(innerStarCols, 3));

    const innerStarsMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const innerStars = new THREE.Points(innerStarsGeom, innerStarsMat);
    mainGroup.add(innerStars);
    innerStarsRef.current = innerStars;

    // ==============================================================
    // 6. LIQUID NEBULA MAGENTA ENERGY CORE
    // Organic flowing cascade pouring down from the chest cavity (NO rigid cylinder)
    // ==============================================================
    const energyGroup = new THREE.Group();
    energyGroup.position.set(0, -0.25, 0.25);
    mainGroup.add(energyGroup);
    energyCoreRef.current = energyGroup;

    // Outer Cascading Liquid Flare: Smooth teardrop lathe expanding downward
    const flarePoints: THREE.Vector2[] = [];
    flarePoints.push(new THREE.Vector2(0.12, 1.6));  // Top neck origin
    flarePoints.push(new THREE.Vector2(0.45, 1.1));  // Upper throat bloom
    flarePoints.push(new THREE.Vector2(0.85, 0.3));  // Mid chest flare
    flarePoints.push(new THREE.Vector2(1.15, -0.6)); // Lower torso cascade spread
    flarePoints.push(new THREE.Vector2(1.35, -1.8)); // Flowing bottom skirt
    flarePoints.push(new THREE.Vector2(0.9, -2.8));  // Tapering tail

    const flareGeom = new THREE.LatheGeometry(flarePoints, 48, 0, Math.PI * 1.7);
    flareGeom.center();
    flareGeom.rotateY(-Math.PI * 0.85);

    const flareMat = new THREE.MeshPhysicalMaterial({
      color: 0xff2df7,
      emissive: 0xff2df7,
      emissiveIntensity: 3.8,
      transparent: true,
      opacity: 0.72,
      roughness: 0.15,
      metalness: 0.2,
      transmission: 0.35,
      ior: 1.4,
      side: THREE.DoubleSide
    });

    const flareMesh = new THREE.Mesh(flareGeom, flareMat);
    flareMesh.position.set(0, -0.3, 0.05);
    energyGroup.add(flareMesh);

    // Inner Glowing Core Orb (the intense radiant heart of the nebula)
    const coreOrbGeom = new THREE.SphereGeometry(0.55, 32, 32);
    const coreOrbMat = new THREE.MeshStandardMaterial({
      color: 0xff4df9,
      emissive: 0xff2df7,
      emissiveIntensity: 6.0,
      roughness: 0.1
    });
    const coreOrb = new THREE.Mesh(coreOrbGeom, coreOrbMat);
    coreOrb.position.set(0, 0.1, 0.15);
    energyGroup.add(coreOrb);
    coreMeshRef.current = coreOrb;

    // Concentric Energy Torus Ring around the heart
    const energyRingGeom = new THREE.TorusGeometry(0.95, 0.08, 20, 64);
    const energyRingMat = new THREE.MeshStandardMaterial({
      color: 0x9b5cff,
      emissive: 0x9b5cff,
      emissiveIntensity: 3.5,
      roughness: 0.2
    });
    const energyRing = new THREE.Mesh(energyRingGeom, energyRingMat);
    energyRing.rotation.x = Math.PI * 0.38;
    energyRing.position.set(0, 0.1, 0.15);
    energyGroup.add(energyRing);

    // ==============================================================
    // 7. GLOSSY OBSIDIAN HANDS & SLENDER FINGERS
    // Replicating the glossy black humanoid hands framing the glowing magenta core
    // ==============================================================
    const handMat = new THREE.MeshPhysicalMaterial({
      color: 0x050408,
      metalness: 0.95,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      reflectivity: 1.0
    });

    const createHand = (isLeft: boolean) => {
      const handGroup = new THREE.Group();

      // Palm base
      const palmGeom = new THREE.SphereGeometry(0.28, 16, 16);
      palmGeom.scale(1.0, 1.4, 0.45);
      const palm = new THREE.Mesh(palmGeom, handMat);
      handGroup.add(palm);

      // 4 Slender delicate fingers curved upwards around the glowing core
      const fingerCount = 4;
      for (let f = 0; f < fingerCount; f++) {
        const fingerGroup = new THREE.Group();
        const length = 0.65 - Math.abs(f - 1.5) * 0.08;
        const fingerGeom = new THREE.CylinderGeometry(0.04, 0.055, length, 12);
        fingerGeom.translate(0, length / 2, 0);

        const fingerMesh = new THREE.Mesh(fingerGeom, handMat);
        fingerGroup.add(fingerMesh);

        // Tip curvature
        const tipGeom = new THREE.SphereGeometry(0.042, 10, 10);
        tipGeom.translate(0, length, 0);
        const tipMesh = new THREE.Mesh(tipGeom, handMat);
        fingerGroup.add(tipMesh);

        fingerGroup.position.set((f - 1.5) * 0.12, 0.28, 0.05);
        fingerGroup.rotation.z = (f - 1.5) * -0.15;
        fingerGroup.rotation.x = -0.35 - (f * 0.08);

        handGroup.add(fingerGroup);
      }

      // Thumb
      const thumbGeom = new THREE.CylinderGeometry(0.045, 0.06, 0.45, 10);
      thumbGeom.translate(0, 0.22, 0);
      const thumb = new THREE.Mesh(thumbGeom, handMat);
      thumb.position.set(isLeft ? 0.25 : -0.25, -0.05, 0.08);
      thumb.rotation.z = isLeft ? -0.8 : 0.8;
      thumb.rotation.x = -0.2;
      handGroup.add(thumb);

      // Position hand framing the central energy core
      if (isLeft) {
        handGroup.position.set(-1.15, -0.65, 0.7);
        handGroup.rotation.set(0.35, 0.55, -0.45);
      } else {
        handGroup.position.set(1.15, -0.65, 0.7);
        handGroup.rotation.set(0.35, -0.55, 0.45);
        handGroup.scale.set(-1, 1, 1);
      }

      return handGroup;
    };

    const leftHand = createHand(true);
    const rightHand = createHand(false);
    mainGroup.add(leftHand);
    mainGroup.add(rightHand);

    // ==============================================================
    // 8. FLOATING COSMIC STARDUST PARTICLES (1,600 sparkling points)
    // ==============================================================
    const particleCount = 1600;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = 0.6 + Math.random() * 5.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      particlePositions[i3] = radius * Math.cos(theta) * Math.cos(phi);
      particlePositions[i3 + 1] = radius * Math.sin(phi) + (Math.random() - 0.5) * 2.0;
      particlePositions[i3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      const color = i % 3 === 0 ? colMagenta : (i % 2 === 0 ? colViolet : colWhite);
      particleColors[i3] = color.r;
      particleColors[i3 + 1] = color.g;
      particleColors[i3 + 2] = color.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.048,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // ==============================================================
    // 9. CINEMATIC COSMIC LIGHTING
    // ==============================================================
    const ambientLight = new THREE.AmbientLight(0x221038, 0.85);
    scene.add(ambientLight);

    // Intense Vibrant Magenta Core Light
    const magentaLight = new THREE.PointLight(0xff2df7, 6.0, 15, 1.4);
    magentaLight.position.set(0, -0.1, 1.3);
    scene.add(magentaLight);
    magentaLightRef.current = magentaLight;

    // Deep Neon Violet Rim Light
    const violetLight = new THREE.PointLight(0x9b5cff, 4.5, 16, 1.2);
    violetLight.position.set(0, 1.8, 1.6);
    scene.add(violetLight);
    coreLightRef.current = violetLight;

    // Backlight for dramatic edge silhouettes
    const backRimLight = new THREE.DirectionalLight(0xa855f7, 2.5);
    backRimLight.position.set(0, 3, -4);
    scene.add(backRimLight);

    // ==============================================================
    // 10. POINTER & INTERACTION EVENT LISTENERS
    // ==============================================================
    const handlePointerMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      mouse.current.targetX = normX;
      mouse.current.targetY = normY;

      if (isDragging.current) {
        const deltaX = e.clientX - previousMousePosition.current.x;
        const deltaY = e.clientY - previousMousePosition.current.y;
        targetRotation.current.y += deltaX * 0.005;
        targetRotation.current.x += deltaY * 0.005;
        // Restrict vertical pitch to prevent flipping upside down
        targetRotation.current.x = Math.max(-0.4, Math.min(0.4, targetRotation.current.x));
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Only drag when interacting with canvas background (avoid button clicks)
      if ((e.target as HTMLElement).tagName !== 'BUTTON') {
        isDragging.current = true;
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('resize', handleResize);

    // ==============================================================
    // 11. REAL-TIME ANIMATION LOOP (Using standard THREE.Clock)
    // ==============================================================
    const clock = new THREE.Clock();

    let animationFrameId: number;
    const animate = () => {
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse interpolation
      mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.05;
      mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.05;

      if (mainGroupRef.current) {
        // Slow organic floating breathing motion
        mainGroupRef.current.position.y = Math.sin(elapsedTime * 0.75) * 0.12;

        // Apply drag rotation with inertia damping
        mainGroupRef.current.rotation.y += (targetRotation.current.y + mouse.current.x * 0.35 - mainGroupRef.current.rotation.y) * 0.06;
        mainGroupRef.current.rotation.x += (targetRotation.current.x - mouse.current.y * 0.2 - mainGroupRef.current.rotation.x) * 0.06;
      }

      // Dynamic liquid energy core pulsation
      if (coreMeshRef.current) {
        const pulse = Math.sin(elapsedTime * 2.4) * 0.09 + 1;
        coreMeshRef.current.scale.set(pulse, pulse * 1.05, pulse);
      }

      if (energyRing) {
        energyRing.rotation.z += delta * 0.45;
      }

      // Rotate stardust particles slowly
      if (particlesRef.current) {
        particlesRef.current.rotation.y += delta * 0.035;
      }

      // Subtle twinkling of inner face stars
      if (innerStarsRef.current) {
        innerStarsRef.current.rotation.y = Math.sin(elapsedTime * 0.5) * 0.08;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Clean up on component unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);

      scene.clear();
      renderer.dispose();
      hoodGeometry.dispose();
      cloakMaterial.dispose();
      faceVoidGeom.dispose();
      faceVoidMat.dispose();
      flareGeom.dispose();
      flareMat.dispose();
      coreOrbGeom.dispose();
      coreOrbMat.dispose();
      energyRingGeom.dispose();
      energyRingMat.dispose();
      handMat.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      innerStarsGeom.dispose();
      innerStarsMat.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Responsive button hover feedback on core light
  useEffect(() => {
    if (coreLightRef.current && magentaLightRef.current) {
      if (isButtonHovered) {
        magentaLightRef.current.intensity = 9.0;
        coreLightRef.current.intensity = 7.0;
      } else {
        magentaLightRef.current.intensity = 6.0;
        coreLightRef.current.intensity = 4.5;
      }
    }
  }, [isButtonHovered]);

  // Responsive entity mesh visibility update
  useEffect(() => {
    if (mainGroupRef.current) {
      mainGroupRef.current.visible = showEntityMesh;
    }
  }, [showEntityMesh]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {webGlSupported ? (
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing select-none" />
      ) : (
        /* Graceful WebGL Fallback */
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-[#08070D] to-[#020204]">
          <div className="w-32 h-32 rounded-full bg-brand-magenta/30 blur-2xl animate-pulse" />
          <p className="text-xs text-text-secondary mt-4 font-mono">
            WebGL acceleration unavailable — running simplified visual fallback.
          </p>
        </div>
      )}
    </div>
  );
};
