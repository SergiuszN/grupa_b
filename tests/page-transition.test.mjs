import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { URL } from "node:url";
import { transformAsync } from "@babel/core";

const source = await readFile(
  new URL("../components/flow/page-transition.tsx", import.meta.url),
  "utf8",
);
const { code } = await transformAsync(source, {
  filename: "page-transition.tsx",
  configFile: false,
  babelrc: false,
  presets: [
    "@babel/preset-typescript",
    ["@babel/preset-react", { runtime: "classic", pragma: "createElement" }],
  ],
  plugins: [
    () => ({
      visitor: {
        ImportDeclaration(path) {
          path.remove();
        },
        ExportNamedDeclaration(path) {
          path.replaceWith(path.node.declaration);
        },
      },
    }),
  ],
});

// Minimal effect/ref lifecycle using the existing Babel dependency. No router,
// document click handlers or timers are available: this must be decorative only.
function harness() {
  const refs = [];
  const animations = [];
  let refIndex = 0;
  let pathname = "/pl";
  let still = false;
  let dependencies;
  let effect;
  let cleanup;
  const veil = {
    animate(keyframes, options) {
      const animation = {
        keyframes,
        options,
        cancelled: false,
        cancel() {
          this.cancelled = true;
        },
      };
      animations.push(animation);
      return animation;
    },
  };
  const component = new Function(
    "useEffect",
    "useRef",
    "usePathname",
    "prefersStillMotion",
    "createElement",
    `${code}\nreturn PageTransition;`,
  )(
    (callback, next) => {
      if (!dependencies || next.some((value, i) => value !== dependencies[i])) {
        dependencies = next;
        effect = callback;
      }
    },
    (value) => (refs[refIndex++] ??= { current: value }),
    () => pathname,
    () => still,
    (type, props) => ({ type, props }),
  );

  return {
    animations,
    reduceMotion(value) {
      still = value;
    },
    render(nextPathname = pathname) {
      pathname = nextPathname;
      refIndex = 0;
      effect = undefined;
      const element = component();
      element.props.ref.current = veil;
      if (effect) {
        cleanup?.();
        cleanup = effect();
      }
      assert.ok(element.props.className.includes("pointer-events-none"));
      assert.equal(element.props["aria-hidden"], "true");
    },
    unmount() {
      cleanup?.();
    },
  };
}

test("initial render does not cover the landing", () => {
  const view = harness();
  view.render();
  assert.equal(view.animations.length, 0);
});

test("only a committed route change starts the brief, non-blocking fade", () => {
  const view = harness();
  view.render();
  view.render("/pl/visit");
  assert.equal(view.animations.length, 1);
  assert.deepEqual(view.animations[0].keyframes, [
    { opacity: 0.35 },
    { opacity: 0 },
  ]);
  assert.ok(view.animations[0].options.duration <= 160);
  view.render("/pl/visit");
  assert.equal(view.animations.length, 1);
});

test("rapid navigation and unmount cancel the previous animation", () => {
  const view = harness();
  view.render();
  view.render("/pl/visit");
  view.render("/pl/history");
  assert.equal(view.animations[0].cancelled, true);
  assert.equal(view.animations[1].cancelled, false);
  view.unmount();
  assert.equal(view.animations[1].cancelled, true);
});

test("reduced motion skips the fade without preventing later navigation", () => {
  const view = harness();
  view.render();
  view.reduceMotion(true);
  view.render("/pl/calendar");
  assert.equal(view.animations.length, 0);
  view.reduceMotion(false);
  view.render("/pl/history");
  assert.equal(view.animations.length, 1);
});
