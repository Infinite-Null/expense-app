import './core.js';

// Sakuga Toast: a notification that streaks in from the left as a smear with speed lines behind it, lands in a cloud of dust with ズザッ
// in dotted letters, wobbles, and after a while leaves by shrinking.
//
// The tracker supplies the notification content in a slot and removes the host on close.
(() => {
function component(fx) {
const { Spring, rnd, at, lines, puff, shards, ticks, sfx, wob, dotted } = fx;

class SakugaToast extends fx.Base {
  static css = `
    :host { display: block; width: 100%; }
    .toast { position: relative; width: 100%; border: var(--sk-bw) solid var(--sk-ink); border-radius: var(--sk-r); background: var(--sk-card); box-shadow: var(--sk-sh); visibility: hidden; will-change: transform; }
    .toast.on { visibility: visible; }`;
  get open() { return this.state > 0 && this.state < 3; }
  render() { return '<div class="toast" part="toast"><slot></slot></div>'; }
  setup() {
    this.toast = this.$('.toast');
    this.sx = new Spring(-280, 280, 18);
    this.ss = new Spring(1, 420, 26);
    this.state = 0;
  }
  show() {
    if (!this.toast) return;
    clearTimeout(this.timer);
    this.toast.classList.add('on');
    this.sx.x = fx.calm ? 0 : -125;
    this.sx.v = fx.calm ? 0 : 700;
    this.ss.x = this.ss.to = 1;
    this.ss.v = 0;
    this.ss.k = 420;
    this.state = fx.calm ? 2 : 1;
    this.toast.style.transform = fx.calm ? '' : 'translateX(-125px) scaleX(1.2)';
    this.timer = setTimeout(() => this.hide(), Math.max(0, Number(this.getAttribute('duration') ?? 4)) * 1000);
  }
  hide() {
    if (!this.open) return;
    clearTimeout(this.timer);
    if (fx.calm || document.hidden) {
      this.close();
      return;
    }
    this.state = 3;
    this.ss.to = 0;
    this.ss.k = 500;
    const c = at(this.toast);
    puff(c.x, c.y, { size: 9, n: 4, life: 0.5 });
  }
  close() {
    this.state = 0;
    this.toast.classList.remove('on');
    this.toast.style.transform = '';
    this.emit('close');
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.timer);
  }
  frame(dt) {
    if (!this.state || (fx.calm && this.state === 2)) return; const x = this.sx.step(dt), sc = this.ss.step(dt), st = 1 + Math.min(1.5, Math.abs(this.sx.v) * 0.0017);
    this.toast.style.transform = `translateX(${x}px) scale(${st * sc}, ${sc / Math.sqrt(st)})`;
    if (this.state === 1) { const c = at(this.toast); if (Math.random() < 0.8) lines(c.x - c.w / 2 - 6, c.y + rnd(-14, 14), { n: 1, dir: Math.PI, len: 80, spread: 2, life: 0.22 });
      if (x > -10) { this.state = 2;   // it lands
        lines(c.x - c.w / 2 - 4, c.y, { n: 9, dir: Math.PI, len: 70, spread: 18, life: 0.4 }); for (const u of [-0.5, -0.36, -0.2]) puff(c.x + c.w * u, c.y + c.h / 2 + 4, { size: rnd(8, 12), n: 4, vx: -rnd(10, 30), vy: -8, life: rnd(0.7, 1) });
          puff(c.x + c.w / 2 + 8, c.y + 10, { size: 7, n: 3, vx: 20, life: 0.6 }); shards(c.x - c.w / 2, c.y + 12, { n: 4, size: 4, dir: Math.PI + 0.5, arc: 1.6 }); ticks(c.x + 30, c.y + c.h / 2 + 12, { dir: 0.5, n: 2, r: 4, len: 16 });
          sfx('zuza', c.x - 34, c.y - 58, { size: 124, rot: -0.1, ...dotted() }); wob(c.x + c.w / 2 + 6, c.y, { dir: 1 }); } }
    else if (this.state === 3 && (sc < 0.03 || fx.calm)) this.close();
  }
}
fx.define('sakuga-toast', SakugaToast);
}

component(window.SakugaFX);
})();
