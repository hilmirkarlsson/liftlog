import { el } from '../dom.js';
import * as state from '../state.js';

const HEADLINE_LIFTS = ['Bench Press', 'Deadlift', 'Squat'];

function prBanner(bests) {
  return el('div', { class: 'card pr-banner' }, [
    el('h2', {}, 'Personal Records'),
    el('div', { class: 'pr-grid' },
      HEADLINE_LIFTS.map((name) => {
        const b = bests[name];
        return el('div', { class: 'pr-tile' }, [
          el('div', { class: 'pr-tile-name' }, name),
          el('div', { class: 'pr-tile-val' }, b ? `${b.weight}kg` : '—'),
          el('div', { class: 'pr-tile-sub' }, b ? `× ${b.reps}` : 'not logged yet'),
        ]);
      })
    ),
  ]);
}

function lineChart(points) {
  if (points.length < 2) {
    return el('div', { class: 'empty-state' }, points.length ? 'Log one more session to see a trend' : 'No data yet');
  }
  const W = 320, H = 140, PAD = 10;
  const values = points.map((p) => p.e1rm);
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (W - PAD * 2) / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = PAD + i * stepX;
    const y = H - PAD - ((p.e1rm - min) / range) * (H - PAD * 2);
    return [x, y];
  });
  const path = coords.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ');
  const area = path + ` L${coords[coords.length - 1][0]},${H - PAD} L${coords[0][0]},${H - PAD} Z`;
  const dots = coords.map(([x, y]) => el('circle', { class: 'line-dot', cx: x, cy: y, r: 3 }));
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'line-chart');
  svg.innerHTML = `<path class="line-area" d="${area}"></path><path class="line-stroke" d="${path}"></path>`;
  dots.forEach((d) => svg.append(d));
  return svg;
}

export function renderProgress(container) {
  const bests = state.getBests();
  container.append(prBanner(bests));

  const names = state.getExercises().map((e) => e.name);
  const select = el('select', { class: 'ex-select' }, names.map((n) => el('option', { value: n }, n)));
  select.value = 'Bench Press';

  const chartWrap = el('div', { class: 'chart-wrap' });
  const bestLine = el('div', { class: 'muted' }, '');

  function draw() {
    chartWrap.innerHTML = '';
    bestLine.textContent = '';
    const points = state.historyForExercise(select.value);
    chartWrap.append(lineChart(points));
    const b = bests[select.value];
    bestLine.textContent = b ? `Best est. 1RM: ${Math.round(b.e1rm)}kg (from ${b.weight}kg × ${b.reps})` : 'No sets logged for this exercise yet';
  }
  select.addEventListener('change', draw);

  container.append(
    el('div', { class: 'card' }, [
      el('h2', {}, 'Estimated 1RM trend'),
      select,
      chartWrap,
      bestLine,
    ])
  );
  draw();
}
