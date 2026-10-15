export const MIN_SCALE = 0.25;
export const MAX_SCALE = 8;

// 每個滾輪刻度的縮放倍率；指數形式讓放大再縮小能回到原值
const WHEEL_SENSITIVITY = 0.0015;

export function initialView() {
  return { scale: 1, x: 0, y: 0 };
}

export function clampScale(scale) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

export function applyWheel(view, deltaY) {
  return { ...view, scale: clampScale(view.scale * Math.exp(-deltaY * WHEEL_SENSITIVITY)) };
}

export function applyDrag(view, dx, dy) {
  return { ...view, x: view.x + dx, y: view.y + dy };
}

// px/py 是游標相對舞台中心的位置；內容以中心為變形原點，讓游標下的那一點縮放後仍在原處
export function applyWheelAt(view, deltaY, px, py) {
  const next = applyWheel(view, deltaY);
  const ratio = next.scale / view.scale;
  return { scale: next.scale, x: px - (px - view.x) * ratio, y: py - (py - view.y) * ratio };
}
