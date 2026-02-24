// main.js
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

import { readConfigFromURL /*, writeConfigToURL*/ } from "./urlParams.js";
import { TerrainTopo } from "./terrainTopo.js";
import { createUI } from "./controls.js";
import { setupDragDrop } from "./dragDrop.js";

/* --------------------------
   Helpers
   -------------------------- */

function makeDefaultHeightmapTexture() {
  // Small procedural dome so the demo is visible without external assets.
  const w = 128, h = 128;
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const nx = (x / (w - 1)) * 2 - 1;
      const ny = (y / (h - 1)) * 2 - 1;
      const r = Math.sqrt(nx * nx + ny * ny);
      const v = Math.max(0, 1 - r); // dome
      const g = Math.floor(v * 255);
      data[i + 0] = g;
      data[i + 1] = g;
      data[i + 2] = g;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  tex.needsUpdate = true;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function degreesToRadians(d) { return (d * Math.PI) / 180; }

function cameraFromYawPitch({ yaw, pitch, height, z }) {
  const yawR = degreesToRadians(yaw);
  const pitchR = degreesToRadians(pitch);
  const cx = Math.sin(yawR) * z;
  const cz = Math.cos(yawR) * z;
  const py = height + Math.sin(-pitchR) * (z * 0.15);
  return new THREE.Vector3(cx, py, cz);
}

/* --------------------------
   Pointer hover (ray -> Y=0 plane)
   -------------------------- */
function setupPointerHover(canvas, camera, onPoint) {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  const onMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    ndc.x = x * 2 - 1;
    ndc.y = -(y * 2 - 1);
    raycaster.setFromCamera(ndc, camera);
    const p = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, p)) {
      onPoint(p);
    }
  };

  canvas.addEventListener("pointermove", onMove);
  return () => canvas.removeEventListener("pointermove", onMove);
}

/* --------------------------
   Simple mouse orbit (yaw/pitch) + wheel zoom
   -------------------------- */
function setupMouseOrbit(canvas, config) {
  let dragging = false;
  let lastX = 0, lastY = 0;

  const onDown = (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
  };

  const onUp = (e) => {
    dragging = false;
    canvas.releasePointerCapture?.(e.pointerId);
  };

  const onMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    config.yaw += dx * 0.2;
    config.pitch += dy * 0.2;
    config.pitch = clamp(config.pitch, -85, -5);
  };

  const onWheel = (e) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    config.z = clamp(config.z + delta * 0.8, 2, 60);
  };

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  return () => {
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointerup", onUp);
    canvas.removeEventListener("pointercancel", onUp);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("wheel", onWheel);
  };
}

/* --------------------------
   Main
   -------------------------- */
async function main() {
  const canvas = document.getElementById("c");
  if (!canvas) {
    console.error("Canvas #c not found in DOM");
    return;
  }

  const config = readConfigFromURL();

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  // Scene + camera
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#070a0f");
  const camera = new THREE.PerspectiveCamera(config.fov, window.innerWidth / window.innerHeight, 0.1, 500);

  // Heightmap: start with fallback procedural texture
  let heightmapTex = makeDefaultHeightmapTexture();

  // Create terrain with fallback texture - we'll replace it when real one loads
  const terrain = new TerrainTopo({ scene, config, heightmapTex });

  // Load the user's file from ./assets/heightmap_512x512.png if present
  const loader = new THREE.TextureLoader();
  loader.load(
    "./assets/heightmap_512x512.png",
    (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      heightmapTex = tex;
      terrain.setHeightmapTexture(tex);
      console.log("Loaded assets/heightmap_512x512.png and applied as heightmap.");
    },
    undefined,
    (err) => {
      console.warn("Could not load ./assets/heightmap_512x512.png — continuing with fallback. Error:", err);
    }
  );

  // UI (Tweakpane)
  let prevRebuildConfig = { ...config };
  const onUniformChange = () => terrain.syncUniformsFromConfig();
  const onRebuild = () => {
    terrain.rebuildIfNeeded(prevRebuildConfig);
    prevRebuildConfig = { ...config };
    terrain.syncUniformsFromConfig();
  };
  const { pane, refresh } = createUI({ config, onUniformChange, onRebuild });

  // Mouse orbit + hover
  const disposeOrbit = setupMouseOrbit(canvas, config);
  const disposeHover = setupPointerHover(canvas, camera, (p) => {
    terrain.setHoverCenter(p);
  });

  // Drag & drop support (allows replacing heightmap dynamically)
  const disposeDD = setupDragDrop({
    element: canvas,
    onTexture: (tex) => {
      // tex returned by dragDrop already has wrapping/filter set
      heightmapTex = tex;
      terrain.setHeightmapTexture(tex);
      console.log("Dropped texture applied as heightmap.");
    },
  });

  // Resize handling
  const onResize = () => {
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", onResize);

  // Animation loop
  const clock = new THREE.Clock();
  let scrollOffset = 0;

  function frame() {
    const dt = Math.min(0.05, clock.getDelta());

    // Update camera projection and position from config
    camera.fov = config.fov;
    camera.updateProjectionMatrix();
    const camPos = cameraFromYawPitch(config);
    camera.position.copy(camPos);

    // Look at a point slightly forward for nicer perspective
    const target = new THREE.Vector3(0, 0, -config.tileSize * 0.25);
    camera.lookAt(target);

    // Scroll update
    if (config.animate) scrollOffset += config.scrollSpeed * dt;
    terrain.updateScroll(scrollOffset);

    // Keep UI in sync (pane refresh for live updates)
    if (pane) refresh();

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  frame();

  // Clean up on unload
  window.addEventListener("beforeunload", () => {
    disposeOrbit();
    disposeHover();
    disposeDD();
    window.removeEventListener("resize", onResize);
    terrain.dispose();
    renderer.dispose();
  });
}

main().catch((err) => {
  console.error("Main error:", err);
});