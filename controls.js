import { Pane } from "https://cdn.jsdelivr.net/npm/tweakpane@4.0.3/dist/tweakpane.min.js";

export function createUI({ config, onUniformChange, onRebuild }) {
  if (!config.ui) return { pane: null, refresh: () => {} };

  const pane = new Pane({ title: "Topo Terrain" });

  const fTerrain = pane.addFolder({ title: "Terrain" });
  fTerrain.addBinding(config, "scale", { min: 0.0, max: 8.0, step: 0.01 }).on("change", onUniformChange);
  fTerrain.addBinding(config, "tileSize", { min: 2, max: 50, step: 0.5 }).on("change", onRebuild);
  fTerrain.addBinding(config, "tilesX", { min: 1, max: 6, step: 1 }).on("change", onRebuild);
  fTerrain.addBinding(config, "tilesZ", { min: 1, max: 12, step: 1 }).on("change", onRebuild);
  fTerrain.addBinding(config, "cols", { min: 16, max: 600, step: 1 }).on("change", onRebuild);
  fTerrain.addBinding(config, "rows", { min: 16, max: 600, step: 1 }).on("change", onRebuild);
  fTerrain.addBinding(config, "jitter", { min: 0, max: 1.0, step: 0.001 }).on("change", onUniformChange);
  fTerrain.addBinding(config, "baseColor").on("change", onUniformChange);

  const fContours = pane.addFolder({ title: "Contours" });
  fContours.addBinding(config, "minorStep", { min: 0.005, max: 1.0, step: 0.001 }).on("change", onUniformChange);
  fContours.addBinding(config, "majorEvery", { min: 2, max: 20, step: 1 }).on("change", onUniformChange);
  fContours.addBinding(config, "widthMinor", { min: 0.001, max: 0.2, step: 0.001 }).on("change", onUniformChange);
  fContours.addBinding(config, "widthMajor", { min: 0.001, max: 0.3, step: 0.001 }).on("change", onUniformChange);
  fContours.addBinding(config, "glowMinor", { min: 0.0, max: 3.0, step: 0.01 }).on("change", onUniformChange);
  fContours.addBinding(config, "glowMajor", { min: 0.0, max: 5.0, step: 0.01 }).on("change", onUniformChange);
  fContours.addBinding(config, "lineColor").on("change", onUniformChange);

    const fBands = pane.addFolder({ title: "Bands" });
  fBands.addBinding(config, "bandsEnabled");
  fBands.addBinding(config, "bandSteps", { min: 3, max: 80, step: 1 }).on("change", onUniformChange);
  fBands.addBinding(config, "bandStrength", { min: 0, max: 1, step: 0.01 }).on("change", onUniformChange);
  fBands.addBinding(config, "lowColor").on("change", onUniformChange);
  fBands.addBinding(config, "midColor").on("change", onUniformChange);
  fBands.addBinding(config, "highColor").on("change", onUniformChange);

  const fMask = pane.addFolder({ title: "Mask" });
  fMask.addBinding(config, "maskRadius", { min: 1, max: 60, step: 0.1 }).on("change", onUniformChange);
  fMask.addBinding(config, "maskFeather", { min: 0.0, max: 20, step: 0.1 }).on("change", onUniformChange);

  const fHover = pane.addFolder({ title: "Hover" });
  fHover.addBinding(config, "hR", { min: 0.1, max: 10, step: 0.05 }).on("change", onUniformChange);
  fHover.addBinding(config, "hS", { min: 0.0, max: 4, step: 0.05 }).on("change", onUniformChange);
  fHover.addBinding(config, "hSnap", { options: { off: 0, on: 1 } }).on("change", onUniformChange);

  const fCamera = pane.addFolder({ title: "Camera" });
  fCamera.addBinding(config, "yaw", { min: -180, max: 180, step: 0.1 });
  fCamera.addBinding(config, "pitch", { min: -85, max: -5, step: 0.1 });
  fCamera.addBinding(config, "fov", { min: 20, max: 100, step: 0.1 });
  fCamera.addBinding(config, "height", { min: 0.5, max: 25, step: 0.05 });
  fCamera.addBinding(config, "z", { min: 2, max: 60, step: 0.1 });

  const fAnim = pane.addFolder({ title: "Animation" });
  fAnim.addBinding(config, "animate");
  fAnim.addBinding(config, "scrollSpeed", { min: -5, max: 5, step: 0.01 });

  const fSpacing = pane.addFolder({ title: "Contour Spacing" });

fSpacing.addBinding(config, "minorStep", {
  label: "Line spacing",
  min: 0.01,
  max: 0.5,
  step: 0.005,
}).on("change", onUniformChange);

fSpacing.addBinding(config, "majorEvery", {
  label: "Lines per major",
  min: 2,
  max: 20,
  step: 1,
}).on("change", onUniformChange);

  // nice: a manual "copy URL" button
  pane.addButton({ title: "Copy URL (manual)" }).on("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // ignore
    }
  });

  const refresh = () => pane.refresh();
  return { pane, refresh };
}