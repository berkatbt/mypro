export default async function run(page) {
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));

  await page.setViewportSize({ width: 390, height: 844 });

  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });

  await page.goto(page.url(), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const touchMedia = await page.evaluate(() => ({
    coarse: matchMedia("(pointer: coarse)").matches,
    touch: navigator.maxTouchPoints,
  }));

  await page.waitForTimeout(1900);

  let maxActive = 0;
  for (let i = 0; i < 14; i += 1) {
    await page.mouse.wheel(0, 260);
    await page.waitForTimeout(130);
    const active = await page.evaluate(
      () => document.querySelectorAll(".cd-draw-cursor.cd-is-on").length
    );
    if (active > maxActive) maxActive = active;
  }

  const state = await page.evaluate(() => ({
    cursors: document.querySelectorAll(".cd-draw-cursor").length,
    maxLimitExpected: 3,
    docWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    labelOverflow: [...document.querySelectorAll(".cd-draw-cursor-label")].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.left < -2 || r.right > window.innerWidth + 2;
    }).length,
    visibleClipped: [...document.querySelectorAll("main *, footer *")].filter((el) => {
      if (!el.style.clipPath) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.top < window.innerHeight * 0.9 && r.bottom > 0;
    }).length,
  }));

  await page.screenshot({ path: "shot-mobile.png" });

  return { touchMedia, maxActive, state, errors };
}
