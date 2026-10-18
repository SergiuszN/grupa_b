import { observeMotionPreference } from "@/lib/motion";

/** Stop decorative work when the hero is hidden or motion has been disabled. */
export function observeHeroActivity(
  root: HTMLElement,
  listener: (active: boolean) => void,
) {
  let visible = true;
  let still = false;
  let previous: boolean | undefined;

  const update = () => {
    const active = visible && !document.hidden && !still;
    if (active === previous) return;
    previous = active;
    listener(active);
  };

  const stopMotion = observeMotionPreference((value) => {
    still = value;
    update();
  });
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    update();
  });
  observer.observe(root);
  document.addEventListener("visibilitychange", update);

  return () => {
    stopMotion();
    observer.disconnect();
    document.removeEventListener("visibilitychange", update);
  };
}
