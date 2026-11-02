const visibleClipped = () =>
  [...document.querySelectorAll("main *, footer *")]
    .filter((el) => el.style && el.style.clipPath)
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.top < window.innerHeight * 0.9 && r.bottom > 0;
    })
    .map((el) => ({
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || "").trim().slice(0, 24),
    }));

export default async function run(page) {
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));

  const url = page.url();
  const viewports = [
    [390, 844],
    [360, 640],
    [320, 568],
    [844, 390],
    [768, 1024],
    [1440, 900],
    [1920, 1080],
  ];

  const results = [];

  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2400);

    const boot = await page.evaluate(() => ({
      clippedVisible: (() => {
        const items = [...document.querySelectorAll("main *, footer *")].filter(
          (el) => el.style && el.style.clipPath
        );
        return items.filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.top < window.innerHeight * 0.9 && r.bottom > 0;
        }).length;
      })(),
      stage: !!document.querySelector(".cd-draw-stage"),
      cursors: document.querySelectorAll(".cd-draw-cursor").length,
      docWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));

    for (let i = 0; i < 6; i += 1) {
      await page.mouse.wheel(0, 480);
      await page.waitForTimeout(120);
    }
    const mid = await page.evaluate(() => ({
      cursorsOn: document.querySelectorAll(".cd-draw-cursor.cd-is-on").length,
      labelOverflow: [...document.querySelectorAll(".cd-draw-cursor-label")].filter((el) => {
        if (el.closest(".cd-draw-cursor").classList.contains("cd-is-on") === false) return false;
        const r = el.getBoundingClientRect();
        return r.left < -2 || r.right > window.innerWidth + 2;
      }).length,
    }));

    for (let i = 0; i < 6; i += 1) {
      await page.mouse.wheel(0, -480);
      await page.waitForTimeout(110);
    }
    await page.waitForTimeout(900);
    const afterUp = await page.evaluate(visibleClipped);

    results.push({ viewport: `${width}x${height}`, boot, mid, afterUp });
  }

  // Rotasi tanpa reload
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2200);
  await page.evaluate(() => window.scrollTo(0, 2400));
  await page.waitForTimeout(900);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(1200);
  const afterRotate = await page.evaluate(visibleClipped);

  // Reduced motion
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const reduced = await page.evaluate(() => ({
    stage: !!document.querySelector(".cd-draw-stage"),
    clipped: [...document.querySelectorAll("main *, footer *")].filter((el) => el.style.clipPath)
      .length,
  }));

  return { results, afterRotate, reduced, errors };
}
