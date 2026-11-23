const strip = document.querySelector('.photo-strip');
const motionAllowed = matchMedia('(prefers-reduced-motion: no-preference)');
const hoverAvailable = matchMedia('(hover: hover)');
let touching = false;
let resumeTimer = 0;
let inView = false;
const frames = [...strip.children];
const copies = frames.map(frame => {
  const copy = frame.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  strip.append(copy);
  return copy;
});
let animation = 0;
let direction = 1;
const filmPixelsPerSecond = 100;

function updateStrip() {
  cancelAnimationFrame(animation);
  const widths = frames.map(frame => frame.getBoundingClientRect().width);
  const gap = parseFloat(getComputedStyle(strip).columnGap);
  const cycleWidth = widths.reduce((total, width) => total + width + gap, 0);
  const canLoop = motionAllowed.matches && cycleWidth - Math.max(...widths) >= strip.clientWidth;
  for (const copy of copies) copy.hidden = !canLoop;
  const hovering = hoverAvailable.matches && strip.matches(':hover');
  if (!motionAllowed.matches || !inView || document.hidden || touching || resumeTimer || hovering || strip.matches(':focus-visible') || strip.scrollWidth <= strip.clientWidth) return;

  let position = strip.scrollLeft;
  let lastTime;
  function advance(time) {
    const distance = Math.min(time - (lastTime ?? time), 64) * filmPixelsPerSecond / 1000;
    if (canLoop) {
      position = (position + distance) % cycleWidth;
    } else {
      const end = strip.scrollWidth - strip.clientWidth;
      if (position >= end) direction = -1;
      if (position <= 0) direction = 1;
      position = Math.min(end, Math.max(0, position + direction * distance));
    }
    strip.scrollLeft = position;
    lastTime = time;
    animation = requestAnimationFrame(advance);
  }
  animation = requestAnimationFrame(advance);
}

for (const event of ['pointerenter', 'pointerleave', 'focusin', 'focusout']) {
  strip.addEventListener(event, () => requestAnimationFrame(updateStrip));
}
new IntersectionObserver(([entry]) => {
  inView = entry.isIntersecting;
  updateStrip();
}).observe(strip);
// Дождаться окончания инерции нативного свайпа перед возвратом к автопрокрутке.
function resumeAfterSwipe() {
  clearTimeout(resumeTimer);
  resumeTimer = setTimeout(() => {
    resumeTimer = 0;
    updateStrip();
  }, 400);
}
strip.addEventListener('touchstart', () => {
  touching = true;
  clearTimeout(resumeTimer);
  resumeTimer = 0;
  cancelAnimationFrame(animation);
}, {passive:true});
for (const event of ['touchend', 'touchcancel']) {
  strip.addEventListener(event, e => {
    touching = e.touches.length > 0;
    if (!touching) resumeAfterSwipe();
  }, {passive:true});
}
strip.addEventListener('scroll', () => {
  if (resumeTimer) resumeAfterSwipe();
}, {passive:true});
motionAllowed.addEventListener('change', updateStrip);
hoverAvailable.addEventListener('change', updateStrip);
window.addEventListener('resize', updateStrip);
document.addEventListener('visibilitychange', updateStrip);

// Высокий лист сначала прокручивается до нижнего края и только затем закрепляется.
const stack = document.querySelector('.stops');
const sheets = stack.querySelectorAll('li');
stack.style.setProperty('--step-count', sheets.length);
const page = document.querySelector("main");
function measureSheets() {
  if (getComputedStyle(sheets[0]).position !== 'sticky') return;
  const visibleHeight = Math.min(window.innerHeight, page.clientHeight);
  const headerHeight = document.querySelector('.masthead').offsetHeight;
  const height = Math.max(...Array.from(sheets, sheet => sheet.offsetHeight));
  const lastInset = parseFloat(getComputedStyle(sheets[sheets.length - 1]).getPropertyValue('--sheet-top'));
  const firstInset = parseFloat(getComputedStyle(sheets[0]).getPropertyValue('--sheet-top'));
  const top = Math.min(headerHeight + firstInset, visibleHeight - height - (lastInset - firstInset) - 4);
  stack.style.setProperty('--stack-top', top + 'px');
}
const sheetSizes = new ResizeObserver(measureSheets);
for (const sheet of sheets) sheetSizes.observe(sheet);
window.addEventListener('resize', measureSheets);

sheetSizes.observe(page);
sheetSizes.observe(document.querySelector('.masthead'));

// Один оттиск на заголовок раздела. На телефонах наблюдатель не запускается.
const printMotion = matchMedia('(min-width:761px) and (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
if ('IntersectionObserver' in window) {
  const titles = document.querySelectorAll('#cover-title .name, main h2');
  const printed = new WeakSet();
  const observer = new IntersectionObserver(entries => {
    if (!printMotion.matches) return;
    for (const entry of entries) {
      if (!entry.isIntersecting || printed.has(entry.target)) continue;
      printed.add(entry.target);
      observer.unobserve(entry.target);
      entry.target.classList.add('press-impression');
    }
  }, {threshold:0.35});
  function updatePrintMotion() {
    observer.disconnect();
    for (const title of titles) {
      title.classList.remove('press-impression');
      if (printMotion.matches && !printed.has(title)) observer.observe(title);
    }
  }
  document.addEventListener('animationend', event => {
    if (event.animationName === 'ink-pressure') event.target.parentElement.classList.remove('press-impression');
  });
  printMotion.addEventListener('change', updatePrintMotion);
  updatePrintMotion();
}
