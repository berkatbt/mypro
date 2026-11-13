export default async function run(page) {
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));

  await page.waitForTimeout(2400);

  // Klik menu Projects (smooth scroll ke bawah)
  await page.evaluate(() => {
    document.querySelector('a[href="#projects"]').click();
  });
  await page.waitForTimeout(1400);
  const afterAnchor = await page.evaluate(() => ({
    scrollY: Math.round(window.scrollY),
    visibleClipped: [...document.querySelectorAll("main *, footer *")].filter((el) => {
      if (!el.style.clipPath) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.top < window.innerHeight * 0.9 && r.bottom > 0;
    }).length,
    cursorsOn: document.querySelectorAll(".cd-draw-cursor.cd-is-on").length,
  }));

  // Aktifkan reduced motion saat runtime -> semua clip harus dilepas
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(600);
  const afterReduce = await page.evaluate(() => ({
    stage: !!document.querySelector(".cd-draw-stage"),
    clipped: [...document.querySelectorAll("main *, footer *")].filter((el) => el.style.clipPath)
      .length,
  }));

  return { afterAnchor, afterReduce, errors };
}
