# 🌌 Sci-Fi Topographic Terrain Engine

A real-time 3D terrain visualization built with **Three.js** and custom **GLSL shaders**.

This project renders heightmap-based terrain with dense sci-fi contour lines, elevation bands, infinite scrolling tiles, and fully tweakable parameters via Tweakpane.

> A shader-driven exploration of procedural topographic rendering in the browser.

---

## ✨ Features

### 🌍 Heightmap Displacement
- Grayscale texture → GPU vertex displacement
- Adjustable terrain height scaling
- Drag-and-drop heightmap replacement
- Real-time texture swapping

### 📈 Dense Sci-Fi Contours
- Fully shader-based contour generation
- Adjustable contour spacing
- Major/minor line differentiation
- Glow intensity controls
- No CPU marching-squares logic

### 🎨 Elevation Bands (Hypsometric Tint)
- Configurable band quantization
- Custom low / mid / high color ramps
- Adjustable band strength blending

### 🔁 Infinite Terrain Scroll
- Seamless tile wrapping in Z-direction
- Shared geometry for performance
- Continuous forward motion effect

### 🎛 Real-Time Parameter Control
- Tweakpane UI integration
- Live shader uniform updates
- Camera controls (yaw, pitch, zoom)

---

## 🧠 Technical Overview

### Rendering Pipeline

1. Load grayscale heightmap texture  
2. Generate subdivided plane geometry  
3. Displace vertices in vertex shader  
4. Generate contour lines procedurally in fragment shader  
5. Apply elevation band coloring  
6. Animate tile wrapping for infinite scroll  
7. Render frame  

All contour logic is computed on the GPU.

---

## 🗂 Project Structure

```
index.html
main.js
terrainTopo.js
shaders.js
controls.js
urlParams.js
dragDrop.js
assets/
```

### Key Modules

**main.js**  
Initializes renderer, camera, animation loop, and interaction handling.

**terrainTopo.js**  
Creates tiled terrain meshes and manages scroll wrapping.

**shaders.js**  
Contains custom vertex and fragment shaders for:
- Height displacement  
- Contour line generation  
- Elevation band rendering  
- Glow and hover effects  

**controls.js**  
Defines Tweakpane UI and config bindings.

**urlParams.js**  
Parses query parameters into a typed configuration object.

**dragDrop.js**  
Handles runtime heightmap replacement.

---

## 🎮 Interaction

### Mouse
- Drag → Rotate camera
- Scroll → Zoom
- Move → Hover highlight

### UI Controls
- Terrain scale
- Contour spacing
- Glow intensity
- Band quantization
- Color ramp customization
- Mask radius and feather

---

## 📘 Product Requirements Summary

### Goal
Build a browser-based terrain visualization engine that renders stylized topographic landscapes in real time with dense contour aesthetics and full visual parameter control.

### Core Requirements
- Real-time heightmap displacement
- Shader-based contour generation
- Adjustable contour spacing
- Infinite scroll tiling
- Interactive camera
- High performance on modern desktop hardware

### Non-Goals
- GIS-level geographic accuracy
- Real-world coordinate systems
- Terrain editing functionality

---

## 🚀 Performance Considerations

- GPU-based contour computation
- Shared geometry across tiles
- No CPU-side line generation
- Efficient fragment math
- Smooth animation at ~60 FPS on modern desktop systems

---


## 🛠 Running Locally

```bash
python3 -m http.server 8080
```

Open:

```
http://localhost:8080
```

---

## 📜 License

MIT License

---
