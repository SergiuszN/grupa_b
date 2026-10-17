export function prefersStillMotion() {
  if (typeof window === "undefined") return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;

  try {
    const saved = localStorage.getItem("a11y-preferences");
    return saved ? JSON.parse(saved).reduceMotion === true : false;
  } catch {
    return false;
  }
}
