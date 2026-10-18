export function prefersStillMotion() {
  if (typeof window === "undefined") return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return true;
  if (document.documentElement.dataset.a11yMotion === "true") return true;

  try {
    const saved = localStorage.getItem("a11y-preferences");
    return saved ? JSON.parse(saved).reduceMotion === true : false;
  } catch {
    return false;
  }
}

/** Includes changes made live in the accessibility panel, not just OS settings. */
export function observeMotionPreference(listener: (still: boolean) => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const update = () => listener(prefersStillMotion());
  const observer = new MutationObserver(update);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-a11y-motion"],
  });
  media.addEventListener("change", update);
  update();

  return () => {
    media.removeEventListener("change", update);
    observer.disconnect();
  };
}
