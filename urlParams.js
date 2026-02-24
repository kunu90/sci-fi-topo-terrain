// urlParams.js

function toNum(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toInt(v, fallback) {
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(v, fallback) {
  if (v === undefined || v === null) return fallback;
  const s = String(v).toLowerCase();
  if (s === "1" || s === "true" || s === "yes" || s === "on") return true;
  if (s === "0" || s === "false" || s === "no" || s === "off") return false;
  return fallback;
}

function toColor(v, fallback) {
  if (!v) return fallback;
  const s = String(v).trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
  if (/^[0-9a-fA-F]{6}$/.test(s)) return "#" + s;
  return fallback;
}

export function defaultConfig() {
  return {
    // Terrain
    scale: 1.4,
    tileSize: 11,
    tilesX: 1,
    tilesZ: 3,
    cols: 220,
    rows: 220,
    jitter: 0.08,
    baseColor: "#0a0a1a",

    // Contours
    minorStep: 0.06,
    majorEvery: 5,
    widthMinor: 0.015,
    widthMajor: 0.03,
    glowMinor: 0.6,
    glowMajor: 1.2,
    lineColor: "#00ffff",

    // Mask
    maskRadius: 14,
    maskFeather: 2.5,

    // Hover
    hR: 1.6,
    hS: 0.9,
    hSnap: 0,

    // Camera
    yaw: 0,
    pitch: -35,
    fov: 55,
    height: 4.2,
    z: 10,

    // Animation
    scrollSpeed: 0.8,
    animate: true,

    // UI
    ui: true,

    // Bands (Option B)
    bandsEnabled: true,
    bandSteps: 18,
    bandStrength: 0.85,
    lowColor: "#1a0033",
    midColor: "#00ff88",
    highColor: "#ff00ff",
  };
}

export function readConfigFromURL() {
  const cfg = defaultConfig();
  const sp = new URLSearchParams(window.location.search);

  // Bands
  cfg.bandsEnabled = toBool(sp.get("bands"), cfg.bandsEnabled);
  cfg.bandSteps = toInt(sp.get("bandSteps"), cfg.bandSteps);
  cfg.bandStrength = toNum(sp.get("bandStrength"), cfg.bandStrength);
  cfg.lowColor = toColor(sp.get("lowColor"), cfg.lowColor);
  cfg.midColor = toColor(sp.get("midColor"), cfg.midColor);
  cfg.highColor = toColor(sp.get("highColor"), cfg.highColor);

  // Terrain
  cfg.scale = toNum(sp.get("scale"), cfg.scale);
  cfg.tileSize = toNum(sp.get("tileSize"), cfg.tileSize);
  cfg.tilesX = toInt(sp.get("tilesX"), cfg.tilesX);
  cfg.tilesZ = toInt(sp.get("tilesZ"), cfg.tilesZ);
  cfg.cols = toInt(sp.get("cols"), cfg.cols);
  cfg.rows = toInt(sp.get("rows"), cfg.rows);
  cfg.jitter = toNum(sp.get("jitter"), cfg.jitter);
  cfg.baseColor = toColor(sp.get("baseColor"), cfg.baseColor);

  // Contours
  cfg.minorStep = toNum(sp.get("minor"), cfg.minorStep);
  cfg.majorEvery = toInt(sp.get("majorEvery"), cfg.majorEvery);
  cfg.widthMinor = toNum(sp.get("wMinor"), cfg.widthMinor);
  cfg.widthMajor = toNum(sp.get("wMajor"), cfg.widthMajor);
  cfg.glowMinor = toNum(sp.get("glowMinor"), cfg.glowMinor);
  cfg.glowMajor = toNum(sp.get("glowMajor"), cfg.glowMajor);
  cfg.lineColor = toColor(sp.get("lineColor"), cfg.lineColor);

  // Mask
  cfg.maskRadius = toNum(sp.get("mask"), cfg.maskRadius);
  cfg.maskFeather = toNum(sp.get("feather"), cfg.maskFeather);

  // Hover
  cfg.hR = toNum(sp.get("hR"), cfg.hR);
  cfg.hS = toNum(sp.get("hS"), cfg.hS);
  cfg.hSnap = toBool(sp.get("hSnap"), !!cfg.hSnap) ? 1 : 0;

  // Camera
  cfg.yaw = toNum(sp.get("yaw"), cfg.yaw);
  cfg.pitch = toNum(sp.get("pitch"), cfg.pitch);
  cfg.fov = toNum(sp.get("fov"), cfg.fov);
  cfg.height = toNum(sp.get("height"), cfg.height);
  cfg.z = toNum(sp.get("z"), cfg.z);

  // Animation
  cfg.scrollSpeed = toNum(sp.get("scroll"), cfg.scrollSpeed);
  cfg.animate = toBool(sp.get("animate"), cfg.animate);

  // UI
  cfg.ui = toBool(sp.get("ui"), cfg.ui);

  // Safety clamps
  cfg.tilesX = Math.max(1, Math.min(6, cfg.tilesX));
  cfg.tilesZ = Math.max(1, Math.min(12, cfg.tilesZ));
  cfg.cols = Math.max(8, Math.min(600, cfg.cols));
  cfg.rows = Math.max(8, Math.min(600, cfg.rows));
  cfg.pitch = Math.max(-85, Math.min(-5, cfg.pitch));

  return cfg;
}