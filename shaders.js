export const vertexShader = /* glsl */ `
precision highp float;

uniform sampler2D uHeightmap;
uniform float uScale;
uniform float uJitter;

attribute vec2 aJitter;

varying vec2 vUv;
varying float vH01;       // raw heightmap value [0..1]
varying float vHWorld;    // displaced height in world units
varying vec3 vWorldPos;

void main() {
  vUv = uv;

  float h = texture2D(uHeightmap, vUv).r;
  vH01 = h;
  vHWorld = h * uScale;

  vec3 p = position;

  // small random jitter in XZ
  p.x += aJitter.x * uJitter;
  p.z += aJitter.y * uJitter;

  // displace Y
  p.y += vHWorld;

  vec4 world = modelMatrix * vec4(p, 1.0);
  vWorldPos = world.xyz;

  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;

uniform vec3 uLineColor;

// Bands (Option B)
uniform float uBandsEnabled;     // 0/1
uniform float uBandSteps;        // e.g. 10..40
uniform float uBandStrength;     // 0..1
uniform vec3 uLowColor;
uniform vec3 uMidColor;
uniform vec3 uHighColor;

// Contours
uniform float uMinorStep;     // in world height units
uniform float uMajorEvery;    // e.g. 5
uniform float uWidthMinor;    // thickness in height units
uniform float uWidthMajor;
uniform float uGlowMinor;
uniform float uGlowMajor;

// Base + mask
uniform vec3 uBaseColor;
uniform float uMaskRadius;
uniform float uMaskFeather;

// Hover
uniform vec3 uHoverCenter;
uniform float uHoverRadius;
uniform float uHoverStrength;
uniform float uHoverSnap; // 0/1

varying vec2 vUv;
varying float vH01;
varying float vHWorld;
varying vec3 vWorldPos;

float lineFactor(float height, float stepSize, float width) {
  float m = mod(height, stepSize);
  float d = min(m, stepSize - m);
  return 1.0 - smoothstep(0.0, width, d);
}

vec3 topoRamp(float t) {
  // t in [0..1] -> low->mid->high
  if (t < 0.5) {
    return mix(uLowColor, uMidColor, t * 2.0);
  }
  return mix(uMidColor, uHighColor, (t - 0.5) * 2.0);
}

void main() {
  // Radial mask in XZ
  float dist = length(vWorldPos.xz);
  float alpha = 1.0 - smoothstep(uMaskRadius, uMaskRadius + uMaskFeather, dist);
  if (alpha <= 0.001) discard;

  // --- Bands (hypsometric tint) ---
  // Quantize height into discrete bands
  float steps = max(2.0, uBandSteps);
  float bandIdx = floor(vH01 * (steps - 1.0));
  float bandT = bandIdx / (steps - 1.0);

  vec3 bandColor = topoRamp(bandT);

  // Blend between modern dark base and topo bands
  vec3 col = mix(uBaseColor, bandColor, clamp(uBandStrength, 0.0, 1.0) * uBandsEnabled);

  // --- Contours ---
  float minorLine = lineFactor(vHWorld, max(uMinorStep, 1e-6), uWidthMinor);

  // Determine if this height falls on a "major" interval
  float minorIndex = floor(vHWorld / max(uMinorStep, 1e-6) + 1e-4);
  float m = mod(minorIndex, max(uMajorEvery, 1.0));
  float isMajor = 1.0 - step(0.5, m); // 1 if m < 0.5 else 0

  // Major lines are thicker and usually aligned with multiples of (minorStep * majorEvery)
  float majorStep = uMinorStep * max(uMajorEvery, 1.0);
  float majorLine = lineFactor(vHWorld, max(majorStep, 1e-6), uWidthMajor);

  // Use majorLine where major, else minorLine
  float line = max(minorLine * (1.0 - isMajor), majorLine);

  // Glow amounts
  float glow = max(uGlowMinor * minorLine * (1.0 - isMajor), uGlowMajor * majorLine);

  // Hover
  float hd = length(vWorldPos.xz - uHoverCenter.xz);
  float hover = 1.0 - smoothstep(uHoverRadius, uHoverRadius * 1.25, hd);

  if (uHoverSnap > 0.5) {
    // Boost hover more where minor lines exist (feels "snapped")
    hover *= mix(0.55, 1.0, minorLine);
  }

  // Add contour glow + a tiny brightness lift along line
  col += uLineColor * glow;
  col += vec3(0.06) * line;

  // Hover boost
  col += uLineColor * (hover * uHoverStrength);

  gl_FragColor = vec4(col, alpha);
}
`;