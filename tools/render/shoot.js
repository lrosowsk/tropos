const { chromium } = require('playwright');
const jobs = process.argv.slice(2); // id or "group"
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const j of jobs) {
    const p = await b.newPage();
    p.on('pageerror', e => console.log('ERR', j, e.message));
    p.on('console', m => m.type() === 'error' && console.log('CONSOLE', j, m.text()));
    const group = j === 'group';
    const w = group ? 2400 : 1000, h = group ? 1300 : 1250;
    await p.setViewportSize({ width: w, height: h });
    await p.goto(`http://localhost:8765/render.html?${group ? 'mode=group' : 'id=' + j}&w=${w}&h=${h}`);
    await p.waitForFunction(() => window.__done === true, null, { timeout: 120000 });
    await p.locator('canvas').screenshot({ path: `out/${j}.png`, omitBackground: true });
    console.log('ok', j);
    await p.close();
  }
  await b.close();
})();
