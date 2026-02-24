import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

function textureFromImageBitmap(bitmap) {
  const tex = new THREE.Texture(bitmap);
  tex.needsUpdate = true;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

export function setupDragDrop({ element, onTexture }) {
  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const onDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;

    try {
      const bitmap = await createImageBitmap(file);
      const tex = textureFromImageBitmap(bitmap);
      onTexture(tex);
    } catch (err) {
      console.error("Failed to load dropped image", err);
    }
  };

  element.addEventListener("dragover", onDragOver);
  element.addEventListener("drop", onDrop);

  return () => {
    element.removeEventListener("dragover", onDragOver);
    element.removeEventListener("drop", onDrop);
  };
}