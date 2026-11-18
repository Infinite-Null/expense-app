// Sakuga Button and Input reactions adapted for the tracker's native form controls.
// The upstream effects, springs, and shared canvas come from core.js.
import './core.js';

const fx = window.SakugaFX;
const { Spring, at, burst, donut, later, puff, rnd, sfx, shards, ticks, wob } = fx;
const actions = 'button, a:is(.btn-primary, .btn-secondary, .btn-ghost, .btn-destructive)';
const textTypes = ['text', 'search', 'email', 'password', 'tel', 'url', 'number'];
const springs = new WeakMap();
let measure;

function action(event) {
  const element = event.target instanceof Element && event.target.closest(actions);
  if (!element || element.matches(':disabled, [aria-disabled="true"]') || fx.calm) return null;
  return element;
}

function animate(element, state, apply) {
  if (state.stop) return;
  state.stop = fx.animate((dt) => {
    if (fx.calm || !element.isConnected || !apply(dt)) {
      element.style.removeProperty('scale');
      element.style.removeProperty('rotate');
      state.stop();
      state.stop = null;
    }
  });
}

function buttonSpring(element) {
  if (!springs.has(element)) {
    springs.set(element, {
      squeeze: new Spring(1, 520, 19),
      pop: new Spring(1, 300, 18),
      tilt: new Spring(0, 260, 16),
    });
  }
  return springs.get(element);
}

function animateButton(element, state) {
  animate(element, state, (dt) => {
    const y = state.squeeze.step(dt);
    const pop = state.pop.step(dt);
    const tilt = state.tilt.step(dt);
    element.style.scale = `${(1 + (1 - y) * 0.24) * pop} ${y * pop}`;
    element.style.rotate = `${tilt}deg`;
    return state.squeeze.to !== 1 || !settled(state.squeeze) || !settled(state.pop) || !settled(state.tilt);
  });
}

function settled(spring) {
  return Math.abs(spring.x - spring.to) < 0.001 && Math.abs(spring.v) < 0.01;
}

let pressed;
function release() {
  if (!pressed) return;
  const state = buttonSpring(pressed);
  state.squeeze.to = 1;
  animateButton(pressed, state);
  pressed = null;
}

document.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || !event.isPrimary) return;
  release();
  const element = action(event);
  if (!element) return;
  pressed = element;
  const state = buttonSpring(element);
  const primary = element.classList.contains('btn-primary');
  state.squeeze.to = primary ? 0.76 : 0.88;
  animateButton(element, state);
  if (primary) {
    const c = at(element);
    ticks(c.x, c.y - c.h / 2 - 4, { dir: -Math.PI / 2, n: 3, r: 4, len: 13 });
  }
}, true);

for (const event of ['pointerup', 'pointercancel']) {
  window.addEventListener(event, release, true);
}
window.addEventListener('blur', release);

document.addEventListener('click', (event) => {
  const element = action(event);
  if (!element) return;
  const state = buttonSpring(element);
  const primary = element.classList.contains('btn-primary');
  const c = at(element);
  state.squeeze.x = primary ? 0.79 : 0.9;
  state.pop.x = primary ? 1.12 : 1.04;
  state.tilt.x = primary ? -3 : 0;
  animateButton(element, state);

  if (!primary) {
    const x = c.x + c.w / 2 - 8;
    const y = c.y - c.h / 2 - 4;
    ticks(x, y, { dir: -1.05, n: 3, r: 5, len: 15, fan: 0.36, life: 0.5 });
    puff(x + 4, y + 7, { size: 5, n: 2, vx: 14, vy: -12, life: 0.4 });
    return;
  }

  element.dataset.sakugaImpact = '';
  clearTimeout(state.flash);
  state.flash = setTimeout(() => delete element.dataset.sakugaImpact, 125);
  burst(c.x, c.y, { r: 43, spikes: 17, life: 0.42 });
  shards(c.x, c.y, { n: 9, speed: 190, size: 7, life: 0.8, arc: 6.28, grav: 300 });
  for (const dir of [-1, 1]) {
    puff(c.x + dir * (c.w / 2 + 5), c.y, { size: rnd(9, 12), n: 4, vx: dir * 32, life: 0.7 });
    wob(c.x + dir * (c.w / 2 + 7), c.y, { dir, r: 9 });
  }
  // Put lettering below controls that are too close to the top of the viewport.
  const above = c.y - window.scrollY >= 75;
  sfx('don', c.x, c.y + (above ? -58 : 59), { size: 102, rot: -0.12, life: 0.9 });
  later(180, () => donut(c.x + 14, c.y - 20, { r: 18, vx: 22, vy: -38, life: 0.8 }));
}, true);

function field(event) {
  const element = event.target;
  if (fx.calm || !(element instanceof HTMLElement) || element.matches(':disabled, [readonly]')) return null;
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) return element;
  if (element instanceof HTMLInputElement && (textTypes.includes(element.type) || element.type === 'date')) return element;
  return null;
}

function hasTextCaret(element) {
  return element instanceof HTMLTextAreaElement || textTypes.includes(element.type);
}

const wrapProperties = [
  'font', 'letter-spacing', 'word-spacing', 'text-align', 'text-indent', 'text-transform',
  'tab-size', 'direction', 'padding', 'white-space', 'overflow-wrap',
];
let mirror;

function textareaCaret(textarea, style) {
  if (!mirror) {
    mirror = document.createElement('div');
    mirror.setAttribute('aria-hidden', 'true');
    mirror.style.cssText = 'position:fixed;inset:0 auto auto 0;visibility:hidden;pointer-events:none;box-sizing:border-box';
  }
  for (const property of wrapProperties) {
    mirror.style.setProperty(property, style.getPropertyValue(property));
  }
  mirror.style.width = `${textarea.clientWidth}px`;
  const caret = textarea.selectionStart;
  const marker = document.createElement('span');
  marker.textContent = textarea.value.slice(caret) || '\u200b';
  mirror.replaceChildren(textarea.value.slice(0, caret), marker);
  document.body.append(mirror);
  const rect = marker.getClientRects()[0] ?? marker.getBoundingClientRect();
  const offset = {
    x: (style.direction === 'rtl' ? rect.right : rect.left) - textarea.scrollLeft + textarea.clientLeft,
    y: rect.top + rect.height / 2 - textarea.scrollTop + textarea.clientTop,
  };
  mirror.remove();
  return offset;
}

function caretPosition(input) {
  const style = getComputedStyle(input);
  const c = at(input, 0, 0);
  if (input instanceof HTMLTextAreaElement) {
    const offset = textareaCaret(input, style);
    return {
      x: c.x + fx.clamp(offset.x, 0, c.w),
      y: c.y + fx.clamp(offset.y, 0, c.h),
    };
  }
  measure ??= document.createElement('canvas').getContext('2d');
  measure.font = style.font;
  const caret = input.selectionStart ?? input.value.length;
  const shown = input.type === 'password' ? '•'.repeat(caret) : input.value.slice(0, caret);
  const left = parseFloat(style.paddingLeft);
  const right = parseFloat(style.paddingRight);
  return {
    x: c.x + fx.clamp(left + measure.measureText(shown).width - input.scrollLeft, left, c.w - right),
    y: c.y + c.h / 2,
  };
}

function animateInput(input, scale) {
  if (!springs.has(input)) springs.set(input, { size: new Spring(1, 700, 16) });
  const state = springs.get(input);
  state.size.x = scale;
  animate(input, state, (dt) => {
    input.style.scale = String(state.size.step(dt));
    return !settled(state.size);
  });
}

document.addEventListener('focusin', (event) => {
  const input = field(event);
  if (!input) return;
  const c = at(input, 1, 0);
  animateInput(input, 1.012);
  ticks(c.x - 6, c.y - 4, { dir: -1.05, n: 3, r: 5, len: 13, fan: 0.36, life: 0.45 });
});

document.addEventListener('input', (event) => {
  const input = field(event);
  if (!input || !hasTextCaret(input)) return;
  const { x, y } = caretPosition(input);
  animateInput(input, 0.992);
  puff(x, y + 9, { size: rnd(4, 6), n: 2, vy: -22, vx: rnd(-10, 10), life: 0.4 });
  if (Math.random() < 0.35) shards(x, y + 6, { n: 2, speed: 110, size: 3, life: 0.5 });
});

document.addEventListener('change', (event) => {
  const input = field(event);
  if (!input || hasTextCaret(input)) return;
  const c = at(input, 1, 0.5);
  animateInput(input, 0.992);
  ticks(c.x - 8, c.y - 4, { dir: -1.05, n: 3, r: 4, len: 11 });
});
