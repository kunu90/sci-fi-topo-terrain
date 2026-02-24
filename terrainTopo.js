import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { vertexShader, fragmentShader } from "./shaders.js";

function makeJitterAttribute(geom) {
  const count = geom.attributes.position.count;
  const arr = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    // small random [-1..1]
    arr[i * 2 + 0] = (Math.random() * 2 - 1);
    arr[i * 2 + 1] = (Math.random() * 2 - 1);
  }
  geom.setAttribute("aJitter", new THREE.BufferAttribute(arr, 2));
}

export class TerrainTopo {
  constructor({ scene, config, heightmapTex }) {
    this.scene = scene;
    this.config = config;
    this.heightmapTex = heightmapTex;

    this.group = new THREE.Group();
    scene.add(this.group);

    this.tiles = [];
    this.material = null;
    this.geometry = null;

    this.scrollOffset = 0;

    this._build();
  }

  dispose() {
    this.group.remove(...this.group.children);
    for (const m of this.tiles) {
      m.geometry?.dispose?.();
    }
    this.geometry?.dispose?.();
    this.material?.dispose?.();
    this.tiles = [];
    this.material = null;
    this.geometry = null;
  }

  _buildMaterial() {
    const cfg = this.config;

    const uniforms = {
      uHeightmap: { value: this.heightmapTex },
      uScale: { value: cfg.scale },
      uJitter: { value: cfg.jitter },

      uBaseColor: { value: new THREE.Color(cfg.baseColor) },
      uLineColor: { value: new THREE.Color(cfg.lineColor) },
            // Bands (Option B)
      uBandsEnabled: { value: cfg.bandsEnabled ? 1 : 0 },
      uBandSteps: { value: cfg.bandSteps },
      uBandStrength: { value: cfg.bandStrength },
      uLowColor: { value: new THREE.Color(cfg.lowColor) },
      uMidColor: { value: new THREE.Color(cfg.midColor) },
      uHighColor: { value: new THREE.Color(cfg.highColor) },

      uMinorStep: { value: cfg.minorStep },
      uMajorEvery: { value: cfg.majorEvery },
      uWidthMinor: { value: cfg.widthMinor },
      uWidthMajor: { value: cfg.widthMajor },
      uGlowMinor: { value: cfg.glowMinor },
      uGlowMajor: { value: cfg.glowMajor },

      uMaskRadius: { value: cfg.maskRadius },
      uMaskFeather: { value: cfg.maskFeather },

      uHoverCenter: { value: new THREE.Vector3(0, 0, 0) },
      uHoverRadius: { value: cfg.hR },
      uHoverStrength: { value: cfg.hS },
      uHoverSnap: { value: cfg.hSnap ? 1 : 0 },
    };

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthTest: true,
      depthWrite: true,
      side: THREE.DoubleSide,
    });

    return mat;
  }

  _buildGeometry() {
    const cfg = this.config;

    // PlaneGeometry is in XY by default; rotate to XZ.
    const geom = new THREE.PlaneGeometry(
      cfg.tileSize,
      cfg.tileSize,
      cfg.cols - 1,
      cfg.rows - 1
    );
    geom.rotateX(-Math.PI / 2);

    makeJitterAttribute(geom);

    return geom;
  }

  _buildTiles() {
    const cfg = this.config;
    const tiles = [];

    const halfX = (cfg.tilesX - 1) * 0.5;
    const halfZ = (cfg.tilesZ - 1) * 0.5;

    for (let ix = 0; ix < cfg.tilesX; ix++) {
      for (let iz = 0; iz < cfg.tilesZ; iz++) {
        const mesh = new THREE.Mesh(this.geometry, this.material);

        mesh.userData.baseX = (ix - halfX) * cfg.tileSize;
        mesh.userData.baseZ = (iz - halfZ) * cfg.tileSize;

        mesh.position.set(mesh.userData.baseX, 0, mesh.userData.baseZ);

        this.group.add(mesh);
        tiles.push(mesh);
      }
    }

    return tiles;
  }

  _build() {
    this.dispose();

    this.material = this._buildMaterial();
    this.geometry = this._buildGeometry();
    this.tiles = this._buildTiles();
  }

  rebuildIfNeeded(prevCfg) {
    // If any of these changed, geometry/tiles must be rebuilt.
    const cfg = this.config;
    const needsRebuild =
      cfg.tileSize !== prevCfg.tileSize ||
      cfg.tilesX !== prevCfg.tilesX ||
      cfg.tilesZ !== prevCfg.tilesZ ||
      cfg.cols !== prevCfg.cols ||
      cfg.rows !== prevCfg.rows;

    if (needsRebuild) {
      this._build();
    }
  }

  setHeightmapTexture(tex) {
    this.heightmapTex = tex;
    if (this.material) {
      this.material.uniforms.uHeightmap.value = tex;
    }
  }

  setHoverCenter(worldPoint) {
    if (!this.material) return;
    this.material.uniforms.uHoverCenter.value.copy(worldPoint);
  }

  syncUniformsFromConfig() {
    if (!this.material) return;
    const u = this.material.uniforms;
    const cfg = this.config;

    u.uScale.value = cfg.scale;
    u.uJitter.value = cfg.jitter;

    u.uBaseColor.value.set(cfg.baseColor);
    u.uLineColor.value.set(cfg.lineColor);

    u.uMinorStep.value = cfg.minorStep;
    u.uMajorEvery.value = cfg.majorEvery;
    u.uWidthMinor.value = cfg.widthMinor;
    u.uWidthMajor.value = cfg.widthMajor;
    u.uGlowMinor.value = cfg.glowMinor;
    u.uGlowMajor.value = cfg.glowMajor;

    u.uMaskRadius.value = cfg.maskRadius;
    u.uMaskFeather.value = cfg.maskFeather;

    u.uHoverRadius.value = cfg.hR;
    u.uHoverStrength.value = cfg.hS;
    u.uHoverSnap.value = cfg.hSnap ? 1 : 0;
        u.uBandsEnabled.value = cfg.bandsEnabled ? 1 : 0;
    u.uBandSteps.value = cfg.bandSteps;
    u.uBandStrength.value = cfg.bandStrength;
    u.uLowColor.value.set(cfg.lowColor);
    u.uMidColor.value.set(cfg.midColor);
    u.uHighColor.value.set(cfg.highColor);
  }

  updateScroll(scrollOffset) {
    const cfg = this.config;
    const span = cfg.tileSize * cfg.tilesZ;

    // Normalize offset so it doesn't grow forever
    const o = ((scrollOffset % span) + span) % span;

    for (const mesh of this.tiles) {
      // Move tiles backward as offset increases
      let z = mesh.userData.baseZ - o;

      // Wrap into range centered around base positions
      // Keep z in [-span/2 .. +span/2] around group center:
      const centerZ = 0;
      const dz = z - centerZ;
      z = centerZ + ((((dz + span * 0.5) % span) + span) % span) - span * 0.5;

      mesh.position.z = z;
      mesh.position.x = mesh.userData.baseX;
    }
  }
}