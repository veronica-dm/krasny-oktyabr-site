const strip = document.querySelector('.photo-strip');
const desktopMotion = matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)');
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
  const canLoop = desktopMotion.matches && cycleWidth - Math.max(...widths) >= strip.clientWidth;
  for (const copy of copies) copy.hidden = !canLoop;
  if (!desktopMotion.matches || strip.scrollWidth <= strip.clientWidth || !inView || document.hidden || strip.matches(':hover, :focus-within')) return;

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
desktopMotion.addEventListener('change', updateStrip);
window.addEventListener('resize', updateStrip);
document.addEventListener('visibilitychange', updateStrip);

// Закрепляем только те листы, которые можно целиком прочесть в окне.
const sheets = document.querySelectorAll('.stops li');
const page = document.querySelector("main");
function measureSheets() {
  const visibleHeight = Math.min(window.innerHeight, page.clientHeight);
  const headerHeight = document.querySelector('.masthead').offsetHeight;
  for (const sheet of sheets) {
    const inset = parseFloat(getComputedStyle(sheet).getPropertyValue('--sheet-top'));
    sheet.toggleAttribute('data-fits', sheet.offsetHeight + inset + 24 + headerHeight <= visibleHeight);
  }
}
const sheetSizes = new ResizeObserver(measureSheets);
for (const sheet of sheets) sheetSizes.observe(sheet);
window.addEventListener('resize', measureSheets);

sheetSizes.observe(page);
sheetSizes.observe(document.querySelector('.masthead'));
