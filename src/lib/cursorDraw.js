/**
 * cursorDraw — "the team draws the website" scroll animation.
 *
 * Beberapa kursor kolaborator (Figma style) menggambar ulang setiap detail
 * halaman — frame kartu, gambar/video, ikon, chip, garis pemisah, dan setiap
 * baris teks — mengikuti posisi scroll:
 *
 * - saat halaman dibuka, elemen yang terlihat langsung "digambar" otomatis,
 * - saat scroll ke bawah, kursor menggambar elemen yang masuk layar,
 * - saat scroll ke atas, gambar TIDAK dihapus ulang; elemen yang sedang
 *   digambar hanya diselesaikan cepat lalu tetap tampil.
 *
 * Prinsip desain:
 * - TIDAK mengubah layout, ukuran, posisi, atau struktur DOM halaman.
 *   Elemen hanya diberi `clip-path` sementara (tidak memicu reflow) dan
 *   overlay kursor/ink dibuat di layer terpisah (pointer-events: none).
 * - Tinta (ink) berada di SVG berkoordinat dokumen, jadi tidak ikut
 *   dihitung ulang saat scroll — hanya stroke-dashoffset yang berubah.
 * - Geometri elemen diukur langsung dari DOM (rect + Range.getClientRects),
 *   sehingga bentuk yang digambar benar-benar bentuk asli elemen.
 * - Kursor "menempel" pada elemen yang sedang digambar (sticky assignment)
 *   supaya tidak melompat ke elemen lain.
 * - Menghormati `prefers-reduced-motion`; teardown selalu memulihkan elemen.
 */

const SVG_NS = "http://www.w3.org/2000/svg";

const TEXT_TAGS = new Set([
  "H1", "H2", "H3", "H4", "H5", "H6",
  "P", "LI", "DT", "DD", "BLOCKQUOTE", "FIGCAPTION", "LABEL", "TH", "TD",
]);

const MEDIA_TAGS = new Set(["IMG", "VIDEO", "CANVAS", "IFRAME"]);

export const DEFAULT_CONFIG = {
  // Area yang dipindai untuk objek gambar
  rootSelector: "main, footer",

  // Elemen yang tidak boleh disentuh
  excludeSelector: [
    "header",
    "nav",
    "[data-no-cursor]",
    "[data-no-cursor] *",
    '[aria-hidden="true"]',
    ".cd-draw-stage",
    ".cd-draw-stage *",
  ].join(", "),

  // Tampilan tinta (putih, senada dengan kursor)
  inkColor: "rgba(255, 255, 255, 0.66)",
  inkWidth: 1.25,
  // Kosong = semua tinta memakai inkColor. Isi array ini kalau ingin
  // tinta berwarna selang-seling.
  inkPalette: [],

  // Kursor kolaborator (semua putih)
  cursors: [
    { name: "Berkat", color: "#f8fafc", textColor: "#050505" },
    { name: "Desain", color: "#f8fafc", textColor: "#050505" },
    { name: "Kode", color: "#f8fafc", textColor: "#050505" },
    { name: "Layout", color: "#f8fafc", textColor: "#050505" },
    { name: "Warna", color: "#f8fafc", textColor: "#050505" },
  ],

  // Intro saat halaman dibuka
  bootDelay: 260,
  bootStagger: 100,
  bootDuration: 820,

  // Pemetaan scroll -> progres gambar
  entryViewport: 0.94, // progres 0 saat puncak elemen di 94% tinggi layar
  finishViewport: 0.46, // progres 1 saat puncak elemen di 46% tinggi layar

  // Urutan gambar: frame dulu, detail isinya menyusul
  boxProfile: [0, 0.6],
  lineProfile: [0, 0.5],
  textProfile: [0.32, 1],

  // Saat scroll ke atas, elemen setengah jadi diselesaikan secepat ini (ms)
  finishDuration: 320,
  // Jeda singkat sebelum kursor pindah ke elemen berikutnya (ms)
  cursorIdle: 150,

  // Responsif: di layar kecil jumlah kursor dibatasi supaya tetap ringan
  compactMaxCursors: 3,
  compactWidth: 640,
  compactHeight: 420,

  // Ukuran minimum / maksimum objek yang digambar
  minBoxArea: 620,
  maxBoxHeightRatio: 2.4,
  maxBoxWidthRatio: 2.6,

  // Seberapa sering geometri teks diukur ulang saat sedang digambar
  // (menyusul animasi masuk bawaan halaman)
  remeasureInterval: 150,
};

function clamp01(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function toPx(value) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function hasVisibleColor(value) {
  if (!value || value === "transparent") return false;
  // rgba(..., 0) / rgba(..., 0.0) dianggap transparan
  return !/rgba?\([^)]*,\s*0(\.0+)?\s*\)$/.test(value);
}

function roundedRectPath(x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  if (r <= 0.5) {
    return `M${round(x)} ${round(y)}H${round(x + width)}V${round(y + height)}H${round(x)}Z`;
  }
  return [
    `M${round(x + r)} ${round(y)}`,
    `H${round(x + width - r)}`,
    `A${round(r)} ${round(r)} 0 0 1 ${round(x + width)} ${round(y + r)}`,
    `V${round(y + height - r)}`,
    `A${round(r)} ${round(r)} 0 0 1 ${round(x + width - r)} ${round(y + height)}`,
    `H${round(x + r)}`,
    `A${round(r)} ${round(r)} 0 0 1 ${round(x)} ${round(y + height - r)}`,
    `V${round(y + r)}`,
    `A${round(r)} ${round(r)} 0 0 1 ${round(x + r)} ${round(y)}`,
    "Z",
  ].join("");
}

/**
 * Ukur setiap baris teks nyata dari DOM memakai Range,
 * lalu ubah ke koordinat lokal elemen.
 */
function measureTextLines(el, box) {
  let rects = [];
  try {
    const range = document.createRange();
    range.selectNodeContents(el);
    rects = Array.from(range.getClientRects());
  } catch {
    return [];
  }

  const rows = [];

  for (const rect of rects) {
    if (rect.width < 1 || rect.height < 1) continue;

    const top = rect.top - box.top;
    const bottom = rect.bottom - box.top;
    const center = (top + bottom) / 2;
    const tolerance = Math.min(rect.height, 24) * 0.55;

    const row = rows.find((candidate) => Math.abs(candidate.center - center) < tolerance);

    if (row) {
      row.left = Math.min(row.left, rect.left - box.left);
      row.right = Math.max(row.right, rect.right - box.left);
      row.top = Math.min(row.top, top);
      row.bottom = Math.max(row.bottom, bottom);
      row.center = (row.top + row.bottom) / 2;
    } else {
      rows.push({
        left: rect.left - box.left,
        right: rect.right - box.left,
        top,
        bottom,
        center,
      });
    }
  }

  rows.sort((a, b) => a.top - b.top);

  return rows.map((row) => ({
    x: row.left,
    y: row.bottom,
    w: Math.max(1, row.right - row.left),
    top: row.top,
    bottom: row.bottom,
  }));
}

/**
 * Ukur batas kanan setiap karakter per baris (dalam pecahan 0..1 dari lebar
 * baris). Dipakai untuk efek "diketik": tiap huruf muncul utuh satu per satu.
 * Hasil null kalau terlalu mahal / tidak bisa diukur.
 */
function measureGlyphEdges(el, maxChars = 420) {
  if ((el.textContent || "").length > maxChars) return null;

  const box = el.getBoundingClientRect();
  let walker;
  try {
    walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  } catch {
    return null;
  }

  const rows = [];
  let node = walker.nextNode();

  while (node) {
    const text = node.nodeValue || "";

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (!char || char === "\n" || char === "\r" || char === "\t") continue;

      let rect;
      try {
        const range = document.createRange();
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        rect = range.getBoundingClientRect();
      } catch {
        continue;
      }

      if (rect.height < 1 || rect.width < 0.1) continue;

      const center = (rect.top + rect.bottom) / 2 - box.top;
      const tolerance = Math.max(4, rect.height * 0.5);
      let row = null;

      for (const candidate of rows) {
        if (Math.abs(candidate.center - center) < tolerance) {
          row = candidate;
          break;
        }
      }

      if (!row) {
        row = { center, left: rect.left - box.left, right: rect.right - box.left, edges: [] };
        rows.push(row);
      }

      row.left = Math.min(row.left, rect.left - box.left);
      row.right = Math.max(row.right, rect.right - box.left);
      row.edges.push(rect.right - box.left);
    }

    node = walker.nextNode();
  }

  rows.sort((a, b) => a.center - b.center);

  return rows
    .filter((row) => row.edges.length > 0)
    .map((row) => {
      const width = Math.max(1, row.right - row.left);
      return row.edges.map((x) => Math.min(1, Math.max(0, (x - row.left) / width)));
    });
}

/**
 * Mulai animasi kursor menggambar halaman.
 * @param {Partial<typeof DEFAULT_CONFIG>} userConfig
 * @returns {() => void} fungsi teardown
 */
export function initCursorDraw(userConfig = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  const mediaQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

  if (mediaQuery && mediaQuery.matches) return () => {};

  // Amankan dari double-init (mis. React StrictMode)
  if (typeof window.__cursorDrawTeardown === "function") {
    try {
      window.__cursorDrawTeardown();
    } catch {
      /* noop */
    }
  }

  const config = { ...DEFAULT_CONFIG, ...userConfig };
  const doc = document;
  const root = doc.documentElement;

  /* ------------------------------------------------------------------ */
  /* Overlay: layer tinta + kursor                                      */
  /* ------------------------------------------------------------------ */

  const stage = doc.createElement("div");
  stage.className = "cd-draw-stage";
  stage.setAttribute("aria-hidden", "true");
  stage.style.setProperty("--cd-ink-color", config.inkColor);
  stage.style.setProperty("--cd-ink-width", `${config.inkWidth}px`);

  const svg = doc.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "cd-draw-svg");
  svg.setAttribute("aria-hidden", "true");

  const inkGroup = doc.createElementNS(SVG_NS, "g");
  svg.appendChild(inkGroup);
  stage.appendChild(svg);

  const cursors = (config.cursors || []).map((cursorConfig, index) => {
    const el = doc.createElement("div");
    el.className = "cd-draw-cursor";
    el.style.setProperty("--cd-cursor-color", cursorConfig.color);
    el.style.setProperty("--cd-cursor-text", cursorConfig.textColor || "#ffffff");
    el.dataset.cursor = String(index);
    el.innerHTML = `
      <svg class="cd-draw-cursor-pointer" width="16" height="22" viewBox="0 0 15 22" fill="none" aria-hidden="true">
        <path d="M0.5 0.5L0.5 17.5L4.8 13.5L8.2 20.8L11 19.5L7.5 12.2L13.5 12.2L0.5 0.5Z"
              fill="currentColor" stroke="#050505" stroke-width="1.2" stroke-linejoin="round"/>
      </svg>
      <span class="cd-draw-caret"></span>
      <span class="cd-draw-cursor-label">${cursorConfig.name}</span>
    `;
    stage.appendChild(el);

    return {
      el,
      x: 0,
      y: 0,
      ready: false,
      item: null,
      progress: 0,
      idleUntil: 0,
    };
  });

  doc.body.appendChild(stage);

  /* ------------------------------------------------------------------ */
  /* State                                                              */
  /* ------------------------------------------------------------------ */

  /** @type {Array<ReturnType<typeof createItem>>} */
  let items = [];
  const itemMap = new Map();

  let rafId = 0;
  let createdItems = 0;
  let destroyed = false;
  let lastScrollY = window.scrollY || 0;
  let resizeTimer = 0;
  let scanTimer = 0;
  let scrollCheck = 0;
  let lastViewportWidth = window.innerWidth;

  /* ------------------------------------------------------------------ */
  /* Geometri & klasifikasi                                             */
  /* ------------------------------------------------------------------ */

  function classify(el) {
    if (el.ownerSVGElement) return null;
    if (el.closest(config.excludeSelector)) return null;

    const tag = el.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") return null;
    if (tag === "BR" || tag === "SOURCE" || tag === "TRACK") return null;

    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.display === "contents" || style.visibility === "hidden") {
      return null;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width < 5 || rect.height < 3) return null;

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const isSvg = tag.toLowerCase() === "svg";

    // Gambar, video, ikon, iframe
    if (MEDIA_TAGS.has(tag) || isSvg) {
      if (rect.width < 12 || rect.height < 12) return null;
      return { kind: "media", clip: !isSvg };
    }

    // Section tidak digambar sebagai frame raksasa; hanya garis atasnya
    if (tag === "SECTION") {
      if (toPx(style.borderTopWidth) >= 0.5) {
        return { kind: "line", side: "top", thickness: toPx(style.borderTopWidth) };
      }
      return null;
    }

    if (tag === "MAIN" || tag === "HEADER" || tag === "NAV") return null;

    if (tag === "HR") return { kind: "line", side: "center", thickness: 1 };

    const borders = [
      toPx(style.borderTopWidth),
      toPx(style.borderRightWidth),
      toPx(style.borderBottomWidth),
      toPx(style.borderLeftWidth),
    ];
    const borderSides = borders.filter((width) => width > 0).length;
    const radius = Math.min(
      toPx(style.borderTopLeftRadius),
      rect.width / 2,
      rect.height / 2
    );
    const hasBackground =
      hasVisibleColor(style.backgroundColor) ||
      (style.backgroundImage && style.backgroundImage !== "none");
    const hasShadow = style.boxShadow && style.boxShadow !== "none";
    const inline = style.display === "inline";

    // Garis tunggal (pemisah, border-top section, dsb.)
    if (borderSides === 1 && radius <= 0.5 && !hasBackground) {
      const side =
        borders[0] > 0 ? "top" : borders[1] > 0 ? "right" : borders[2] > 0 ? "bottom" : "left";
      return { kind: "line", side, thickness: borders.find((width) => width > 0) };
    }

    const hasBoxLook = borderSides >= 2 || radius > 0.5 || hasBackground || hasShadow;
    const area = rect.width * rect.height;
    const withinLimits =
      rect.height <= viewportHeight * config.maxBoxHeightRatio &&
      rect.width <= viewportWidth * config.maxBoxWidthRatio;

    if (hasBoxLook && !inline && withinLimits && area >= config.minBoxArea) {
      return { kind: "box", radius };
    }

    // Teks: H1-H6, paragraf, list, dsb.
    if (TEXT_TAGS.has(tag) && !inline && (el.textContent || "").trim().length > 0) {
      const fontSize = toPx(style.fontSize) || 16;
      return { kind: "text", glyphStep: Math.max(5, Math.min(12, fontSize * 0.52)) };
    }

    return null;
  }

  function updateScrollRange(item) {
    const viewportHeight = window.innerHeight;
    const maxScroll = Math.max(0, root.scrollHeight - viewportHeight);
    const top = item.doc.top;

    let start = top - viewportHeight * config.entryViewport;
    let end = top - viewportHeight * config.finishViewport;

    // Elemen di dasar halaman tidak punya ruang scroll yang cukup:
    // geser rentangnya agar tetap selesai tepat di akhir halaman.
    if (end > maxScroll) {
      const shift = end - maxScroll;
      start -= shift;
      end -= shift;
    }

    if (end <= start) end = start + 1;

    item.startScroll = start;
    item.endScroll = end;
  }

  function buildPathData(item) {
    const { left, top, width, height } = item.doc;

    if (item.kind === "text") {
      return item.lines
        .map(
          (line) =>
            `M${round(left + line.x)} ${round(top + line.y - 2)}H${round(left + line.x + line.w)}`
        )
        .join("");
    }

    if (item.kind === "line") {
      const thickness = Math.max(1, item.thickness || 1);
      if (item.side === "top") {
        const y = top + thickness / 2;
        return `M${round(left)} ${round(y)}H${round(left + width)}`;
      }
      if (item.side === "bottom") {
        const y = top + height - thickness / 2;
        return `M${round(left)} ${round(y)}H${round(left + width)}`;
      }
      if (item.side === "left") {
        const x = left + thickness / 2;
        return `M${round(x)} ${round(top)}V${round(top + height)}`;
      }
      if (item.side === "right") {
        const x = left + width - thickness / 2;
        return `M${round(x)} ${round(top)}V${round(top + height)}`;
      }
      const y = top + height / 2;
      return `M${round(left)} ${round(y)}H${round(left + width)}`;
    }

    return roundedRectPath(left, top, width, height, item.radius);
  }

  /** Jangan pernah biarkan elemen tetap ter-clip kalau pengukurannya gagal. */
  function disableItem(item) {
    item.disabled = true;
    item.el.style.clipPath = "";
    item.lastClip = null;
    if (item.path) {
      item.path.remove();
      item.path = null;
    }
    for (const entry of item.lineInk) entry.path.remove();
    item.lineInk = [];
  }

  function measureItem(item) {
    const el = item.el;

    if (!el.isConnected || item.disabled) return false;

    try {
      const scrollX = window.scrollX || 0;
      const scrollY = window.scrollY || 0;
      const rect = el.getBoundingClientRect();

      item.doc = {
        left: rect.left + scrollX,
        top: rect.top + scrollY,
        width: rect.width,
        height: rect.height,
      };

      if (item.kind === "text") {
        const lines = measureTextLines(el, rect);
        item.lines =
          lines.length > 0
            ? lines
            : [
                {
                  x: 0,
                  y: rect.height - 3,
                  w: Math.max(1, rect.width),
                  top: 0,
                  bottom: rect.height,
                },
              ];

        if (item.glyphEdges && item.glyphEdges.length !== item.lines.length) {
          item.glyphEdges = null;
          item.glyphTried = false;
        }

        item.minX = Math.min(...item.lines.map((line) => line.x));
        item.cum = [];
        let total = 0;
        for (const line of item.lines) {
          item.cum.push(total);
          total += line.w;
        }
        item.totalW = total || 1;

        // Satu path per baris: stroke-dashoffset di-reset per subpath oleh
        // browser, jadi tinta tiap baris perlu elemennya sendiri agar
        // baris ter-reveal berurutan seperti sedang ditulis.
        const canReuseInk =
          item.lineInk.length === item.lines.length &&
          item.lines.every((line, index) => Math.abs(item.lineInk[index].len - line.w) < 0.5);

        if (canReuseInk) {
          // Lebar baris tidak berubah (mis. resize vertikal saja): cukup
          // geser posisi, tidak perlu bongkar-pasang path.
          item.lines.forEach((line, index) => {
            const entry = item.lineInk[index];
            entry.x = item.doc.left + line.x;
            entry.y = item.doc.top + line.y - 2;
            entry.drawn = -1;
          });
        } else {
          for (const entry of item.lineInk) entry.path.remove();
          item.lineInk = [];
          item.lines.forEach((line) => {
            const linePath = doc.createElementNS(SVG_NS, "path");
            linePath.setAttribute("class", "cd-draw-ink");
            linePath.setAttribute(
              "d",
              `M${round(item.doc.left + line.x)} ${round(item.doc.top + line.y - 2)}H${round(
                item.doc.left + line.x + line.w
              )}`
            );
            linePath.style.stroke = item.inkColor;
            linePath.style.strokeDasharray = "none";
            linePath.style.strokeDashoffset = "0";
            inkGroup.appendChild(linePath);
            item.lineInk.push({
              path: linePath,
              len: line.w,
              x: item.doc.left + line.x,
              y: item.doc.top + line.y - 2,
              drawn: -1,
            });
          });
        }
      } else if (item.path) {
        item.path.setAttribute("d", buildPathData(item));
        item.len = Math.max(1, item.path.getTotalLength());
        item.path.style.strokeDasharray = `${item.len} ${item.len}`;
        item.path.style.strokeDashoffset = `${item.len}`;
      }

      updateScrollRange(item);
      // Jangan reset progres: efek ini maju-saja, jadi setelah resize /
      // rotasi elemen yang sudah tergambar tidak boleh ter-clip lagi.
      item.needsApply = true;
      item.lastClip = null;

      return true;
    } catch {
      disableItem(item);
      return false;
    }
  }

  function createItem(el, info) {
    const palette = config.inkPalette || [];
    const inkColor = palette.length > 0 ? palette[createdItems % palette.length] : config.inkColor;
    createdItems += 1;

    let path = null;
    if (info.kind !== "text") {
      path = doc.createElementNS(SVG_NS, "path");
      path.setAttribute("class", "cd-draw-ink");
      path.dataset.cdKind = info.kind;
      path.dataset.cdTag = el.tagName.toLowerCase();
      path.style.stroke = inkColor;
      inkGroup.appendChild(path);
    }

    const item = {
      el,
      kind: info.kind,
      side: info.side || null,
      thickness: info.thickness || 1,
      radius: info.radius || 0,
      glyphStep: info.glyphStep || 7,
      glyphEdges: null,
      glyphTried: false,
      disabled: false,
      needsApply: true,
      clippable: info.clip !== false,
      path,
      lineInk: [],
      inkColor,
      len: 1,
      lines: null,
      cum: null,
      totalW: 1,
      minX: 0,
      doc: { left: 0, top: 0, width: 0, height: 0 },
      startScroll: 0,
      endScroll: 1,
      profile:
        info.kind === "box" || info.kind === "media"
          ? config.boxProfile
          : info.kind === "line"
            ? config.lineProfile
            : config.textProfile,
      p: -1,
      lastClip: null,
      boot: null,
      locked: false,
      nextMeasure: 0,
      finishStart: 0,
      finishFrom: 0,
    };

    measureItem(item);
    return item;
  }

  /* ------------------------------------------------------------------ */
  /* Reveal: clip-path mengikuti progres gambar                         */
  /* ------------------------------------------------------------------ */

  /**
   * Posisi reveal teks (baris + pecahan) yang sudah di-snap per karakter
   * supaya teks terlihat "diketik", bukan di-wipe mulus.
   */
  function textReveal(item, progress) {
    const lines = item.lines;
    if (!lines || lines.length === 0) return null;

    // Mode "diketik": satu huruf muncul utuh setiap langkah.
    if (item.glyphEdges && item.glyphEdges.length === lines.length) {
      const counts = item.glyphEdges.map((edges) => edges.length);
      const total = counts.reduce((sum, count) => sum + count, 0);

      if (total > 0) {
        const position = Math.min(total, Math.max(0, Math.floor(progress * total)));
        let index = 0;
        let before = 0;

        while (index < counts.length - 1 && position >= before + counts[index]) {
          before += counts[index];
          index += 1;
        }

        const local = Math.max(0, Math.min(counts[index], position - before));
        const edges = item.glyphEdges[index];
        const fraction = local <= 0 ? 0 : edges[Math.min(edges.length - 1, local - 1)];

        return { index, fraction };
      }
    }

    const distance = progress * item.totalW;
    let index = 0;
    while (
      index < lines.length - 1 &&
      distance > (item.cum[index] || 0) + lines[index].w
    ) {
      index += 1;
    }

    const startOfLine = item.cum[index] || 0;
    const rawFraction = clamp01((distance - startOfLine) / lines[index].w);
    const stepCount = Math.max(1, Math.round(lines[index].w / item.glyphStep));
    const fraction = Math.floor(rawFraction * stepCount) / stepCount;

    return { index, fraction };
  }

  function textClipPath(item, progress) {
    const lines = item.lines;
    if (!lines || lines.length === 0) return "";

    const reveal = textReveal(item, progress);
    if (!reveal) return "";

    const { index, fraction } = reveal;
    const x0 = item.minX;

    const points = [`${round(x0)}px ${round(lines[0].top)}px`];

    for (let i = 0; i < index; i += 1) {
      const line = lines[i];
      points.push(
        `${round(line.x + line.w)}px ${round(line.top)}px`,
        `${round(line.x + line.w)}px ${round(line.bottom)}px`
      );
    }

    const current = lines[index];
    const edge = current.x + current.w * fraction;

    points.push(
      `${round(edge)}px ${round(current.top)}px`,
      `${round(edge)}px ${round(current.bottom)}px`,
      `${round(x0)}px ${round(current.bottom)}px`
    );

    return `polygon(${points.join(", ")})`;
  }

  function applyProgress(item, progress) {
    item.p = progress;
    const inkVisible = progress > 0.004 && progress < 0.999 ? "1" : "0";

    if (item.kind === "text") {
      const reveal = textReveal(item, progress);
      item.lineInk.forEach((entry, index) => {
        let visible = 0;
        if (reveal) {
          if (index < reveal.index) visible = 1;
          else if (index === reveal.index) visible = reveal.fraction;
        }

        // Panjang tinta di-set langsung lewat `d` (bukan dash-offset) supaya
        // tidak ada titik sisa di ujung garis saat baru sebagian tergambar.
        const length = entry.len * visible;
        if (Math.abs(entry.drawn - length) > 0.4) {
          entry.drawn = length;
          entry.path.setAttribute(
            "d",
            `M${round(entry.x)} ${round(entry.y)}H${round(entry.x + length)}`
          );
        }

        entry.path.style.opacity = inkVisible;
      });
    } else if (item.path) {
      item.path.style.strokeDashoffset = `${item.len * (1 - progress)}`;
      item.path.style.opacity = inkVisible;
    }

    if (!item.clippable) return;

    let clip = "";
    if (progress < 0.999) {
      clip =
        item.kind === "text"
          ? textClipPath(item, progress)
          : `inset(0px ${round((1 - progress) * 100)}% 0px 0px round ${round(item.radius)}px)`;
    }

    if (clip !== item.lastClip) {
      item.el.style.clipPath = clip;
      item.lastClip = clip;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Kursor                                                             */
  /* ------------------------------------------------------------------ */

  function isOnScreen(item, scrollY, viewportHeight) {
    const top = item.doc.top;
    const bottom = top + item.doc.height;
    return top < scrollY + viewportHeight + 60 && bottom > scrollY - 60;
  }

  function getCursorLimit() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (width <= config.compactWidth || height <= config.compactHeight) {
      return Math.min(config.compactMaxCursors, cursors.length);
    }
    return cursors.length;
  }

  /**
   * Tempelkan setiap kursor ke satu elemen yang sedang digambar.
   * Kursor mempertahankan elemennya sampai selesai (tidak melompat-lompat).
   */
  function assignCursors(active, now) {
    const activeItems = active.map((entry) => entry.item);
    const used = new Set();
    const limit = getCursorLimit();

    cursors.forEach((cursor, index) => {
      if (index >= limit) {
        cursor.item = null;
        return;
      }

      if (cursor.item && activeItems.includes(cursor.item) && !used.has(cursor.item)) {
        used.add(cursor.item);
        return;
      }

      if (cursor.item) {
        cursor.item = null;
        cursor.idleUntil = now + config.cursorIdle;
      }
    });

    if (active.length === 0) {
      for (const cursor of cursors) cursor.item = null;
      return;
    }

    const scrollY = window.scrollY || 0;
    const viewportCenter = scrollY + window.innerHeight * 0.5;

    const free = active.filter((entry) => !used.has(entry.item));
    free.sort(
      (a, b) =>
        Math.abs(a.item.doc.top + a.item.doc.height * 0.5 - viewportCenter) -
        Math.abs(b.item.doc.top + b.item.doc.height * 0.5 - viewportCenter)
    );

    const takenPoints = cursors
      .filter((cursor) => cursor.item)
      .map((cursor) => ({ x: cursor.x, y: cursor.y }));

    for (const cursor of cursors.slice(0, limit)) {
      if (cursor.item || now < cursor.idleUntil || free.length === 0) continue;

      // Pilih elemen yang cukup berjauhan dari kursor lain supaya tidak
      // menumpuk di satu area kecil.
      let pick = 0;
      for (let i = 0; i < free.length; i += 1) {
        const item = free[i].item;
        const center = {
          x: item.doc.left + item.doc.width * 0.5,
          y: item.doc.top + item.doc.height * 0.5,
        };
        const isFar = takenPoints.every(
          (point) => Math.hypot(point.x - center.x, point.y - center.y) > 140
        );
        if (isFar) {
          pick = i;
          break;
        }
      }

      const next = free.splice(pick, 1)[0];
      if (!next) continue;

      takenPoints.push({
        x: next.item.doc.left + next.item.doc.width * 0.5,
        y: next.item.doc.top + next.item.doc.height * 0.5,
      });

      cursor.item = next.item;
      cursor.progress = next.progress;
      cursor.ready = false; // snap ke elemen baru, jangan meluncur jauh
    }

    for (const cursor of cursors) {
      if (!cursor.item) continue;
      const entry = active.find((candidate) => candidate.item === cursor.item);
      if (entry) cursor.progress = entry.progress;
    }
  }

  function updateCursors(scrollY) {
    let moving = false;
    const viewportWidth = window.innerWidth;
    const limit = getCursorLimit();

    cursors.forEach((cursor, index) => {
      if (index >= limit) {
        cursor.item = null;
        cursor.el.classList.remove("cd-is-on", "cd-typing", "cd-flip-left");
        return;
      }

      if (!cursor.item) {
        cursor.el.classList.remove("cd-is-on", "cd-typing");
        return;
      }

      let point = null;

      if (cursor.item.kind === "text") {
        const reveal = textReveal(cursor.item, cursor.progress);
        const line = reveal ? cursor.item.lines[reveal.index] : null;
        if (line) {
          point = {
            x: cursor.item.doc.left + line.x + line.w * reveal.fraction,
            y: cursor.item.doc.top + line.y - 2,
          };
        }
      }

      if (!point && cursor.item.path) {
        try {
          point = cursor.item.path.getPointAtLength(cursor.item.len * cursor.progress);
        } catch {
          point = null;
        }
      }

      if (!point) {
        cursor.el.classList.remove("cd-is-on");
        return;
      }

      if (!cursor.ready || Math.hypot(point.x - cursor.x, point.y - cursor.y) > 220) {
        cursor.x = point.x;
        cursor.y = point.y;
        cursor.ready = true;
      } else {
        const dx = point.x - cursor.x;
        const dy = point.y - cursor.y;
        if (Math.hypot(dx, dy) > 0.6) moving = true;
        cursor.x += dx * 0.34;
        cursor.y += dy * 0.34;
      }

      const viewportX = cursor.x - scrollY;
      cursor.el.style.transform = `translate3d(${cursor.x.toFixed(1)}px, ${cursor.y.toFixed(1)}px, 0)`;
      cursor.el.classList.toggle("cd-flip-x", viewportX > viewportWidth - 120);
      cursor.el.classList.toggle("cd-flip-left", viewportX < 96);
      cursor.el.classList.toggle("cd-typing", cursor.item.kind === "text");
      cursor.el.classList.add("cd-is-on");
    });

    return moving;
  }

  /* ------------------------------------------------------------------ */
  /* Frame loop                                                         */
  /* ------------------------------------------------------------------ */

  function schedule() {
    if (destroyed || rafId) return;
    rafId = window.requestAnimationFrame(tick);
  }

  function tick(now) {
    rafId = 0;
    if (destroyed) return;

    try {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const viewportHeight = window.innerHeight;
    const scrollingUp = scrollY < lastScrollY - 0.5;
    lastScrollY = scrollY;

    let booting = false;
    let finishing = false;
    const active = [];

    for (const item of items) {
      if (item.disabled) continue;
      let raw;

      if (item.boot) {
        const elapsed = (now - item.boot.start) / item.boot.duration;
        if (elapsed >= 1) {
          raw = 1;
          item.boot = null;
          item.locked = true;
        } else {
          raw = Math.max(0, elapsed);
          booting = true;
        }
      } else if (item.locked) {
        raw = 1;
      } else {
        raw = (scrollY - item.startScroll) / Math.max(1, item.endScroll - item.startScroll);
      }

      raw = clamp01(raw);

      const [from, to] = item.profile;
      let progress = clamp01((raw - from) / (to - from));


      // Satu arah: gambar tidak pernah mundur saat scroll ke atas.
      if (progress < item.p) progress = item.p;

      // Scroll ke atas: selesaikan elemen yang masih setengah jadi.
      if (scrollingUp && !item.boot && !item.locked && progress > 0.004 && progress < 1) {
        if (!item.finishStart) {
          item.finishStart = now;
          item.finishFrom = progress;
        }
      }

      if (item.finishStart) {
        const ratio = clamp01((now - item.finishStart) / config.finishDuration);
        const finished = item.finishFrom + (1 - item.finishFrom) * ratio;
        if (finished > progress) progress = finished;
        if (ratio < 1) finishing = true;
        else item.finishStart = 0;
      }

      if (progress >= 1 && !item.locked) item.locked = true;

      // Ukur batas tiap huruf sekali saat elemen mulai digambar, supaya
      // teks bisa muncul huruf-per-huruf (efek diketik).
      if (
        item.kind === "text" &&
        progress > 0.002 &&
        !item.glyphEdges &&
        !item.glyphTried
      ) {
        item.glyphTried = true;
        item.glyphEdges = measureGlyphEdges(item.el);
        if (item.glyphEdges && item.glyphEdges.length !== item.lines.length) {
          item.glyphEdges = null;
        }
        item.needsApply = true;
      }

      // Geometri teks bisa bergeser karena animasi masuk bawaan halaman,
      // jadi ukur ulang selama elemen sedang digambar.
      if (
        item.kind === "text" &&
        progress > 0.001 &&
        progress < 0.999 &&
        now >= item.nextMeasure
      ) {
        item.nextMeasure = now + config.remeasureInterval;
        measureItem(item);
      }

      if (
        item.needsApply ||
        Math.abs(progress - item.p) > 0.0015 ||
        (progress === 0 && item.p !== 0) ||
        (progress === 1 && item.p !== 1)
      ) {
        applyProgress(item, progress);
        item.needsApply = false;
      }

      if (
        item.p > 0.004 &&
        item.p < 0.999 &&
        isOnScreen(item, scrollY, viewportHeight)
      ) {
        active.push({ item, progress: item.p });
      }
    }

    assignCursors(active, now);
    const moving = updateCursors(scrollY);

    if (booting || finishing || moving) schedule();
    } catch {
      // Failsafe: error tak terduga tidak boleh meninggalkan konten ter-clip.
      destroy();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Scan DOM                                                           */
  /* ------------------------------------------------------------------ */

  function syncStageSize() {
    stage.style.height = `${root.scrollHeight}px`;
  }

  function scan() {
    if (destroyed) return;

    const roots = doc.querySelectorAll(config.rootSelector);

    roots.forEach((container) => {
      container.querySelectorAll("*").forEach((el) => {
        if (itemMap.has(el)) return;

        // Hindari elemen di dalam overlay kita sendiri
        if (el.closest(".cd-draw-stage")) return;

        const info = classify(el);
        if (!info) return;

        const item = createItem(el, info);
        itemMap.set(el, item);
        items.push(item);
      });
    });

    items = items.filter((item) => item.el.isConnected);
    for (const [el, item] of itemMap) {
      if (!item.el.isConnected) {
        if (item.path) item.path.remove();
        for (const entry of item.lineInk) entry.path.remove();
        itemMap.delete(el);
      }
    }

    items.sort((a, b) => a.doc.top - b.doc.top || a.doc.left - b.doc.left);
    syncStageSize();
  }

  function startBootSequence() {
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY || 0;

    const visible = items
      .filter((item) => {
        const top = item.doc.top - scrollY;
        return (
          item.doc.width > 0 &&
          top < viewportHeight * config.entryViewport &&
          top + item.doc.height > -60
        );
      })
      .sort((a, b) => a.doc.top - b.doc.top || a.doc.left - b.doc.left);

    const start = performance.now() + config.bootDelay;

    visible.forEach((item, index) => {
      item.boot = {
        start: start + index * config.bootStagger,
        duration: config.bootDuration,
      };
      item.locked = false;
    });
  }

  /**
   * Saat ukuran/rotasi berubah, elemen yang terlihat tapi masih setengah
   * tergambar langsung dituntaskan supaya tidak ada konten yang tiba-tiba
   * ter-clip setelah layout bergeser.
   */
  function settleVisibleItems() {
    const scrollY = window.scrollY || 0;
    const viewportHeight = window.innerHeight;

    for (const item of items) {
      if (item.disabled || !item.el.isConnected || item.boot || item.locked) continue;
      if (item.p < 1 && isOnScreen(item, scrollY, viewportHeight)) {
        item.p = 1;
        item.locked = true;
        item.needsApply = true;
      }
    }
  }

  function remeasureAll({ resetText = false } = {}) {
    if (destroyed) return;

    const widthChanged = window.innerWidth !== lastViewportWidth;
    lastViewportWidth = window.innerWidth;

    for (const item of items) {
      if (!item.el.isConnected || item.disabled) continue;

      // Posisi huruf hanya berubah kalau lebar viewport / font berubah.
      // Perubahan tinggi saja (mis. address bar mobile) cukup diukur ulang
      // posisinya, tidak perlu mengukur ulang semua huruf.
      if (item.kind === "text" && (widthChanged || resetText)) {
        item.glyphEdges = null;
        item.glyphTried = false;
      }
      measureItem(item);
    }

    // Hanya saat lebar benar-benar berubah (atau rotasi/font selesai):
    // perubahan tinggi akibat address bar tidak boleh memotong animasi.
    if (widthChanged || resetText) settleVisibleItems();

    syncStageSize();
    schedule();
  }

  /* ------------------------------------------------------------------ */
  /* Events                                                             */
  /* ------------------------------------------------------------------ */

  function onScroll() {
    schedule();

    // Sesekali cek apakah tinggi dokumen berubah (font/gambar lazy load)
    scrollCheck += 1;
    if (scrollCheck % 30 === 0) {
      const nextHeight = root.scrollHeight;
      if (Math.abs(nextHeight - stage.offsetHeight) > 2) {
        syncStageSize();
        remeasureAll();
      }
    }
  }

  function onResize() {
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resizeTimer = 0;
      remeasureAll();
    }, 150);
  }

  // Rotasi butuh jeda lebih lama karena ukuran viewport baru stabil
  // setelah animasi rotasi selesai.
  function onOrientationChange() {
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resizeTimer = 0;
      remeasureAll({ resetText: true });
    }, 350);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onOrientationChange);

  const mo = new MutationObserver(() => {
    if (scanTimer) window.clearTimeout(scanTimer);
    scanTimer = window.setTimeout(() => {
      scanTimer = 0;
      if (destroyed) return;
      scan();
      schedule();
    }, 280);
  });

  mo.observe(doc.body, { childList: true, subtree: true });

  let fontsSettled = false;
  if (doc.fonts && typeof doc.fonts.ready === "object") {
    doc.fonts.ready
      .then(() => {
        if (destroyed || fontsSettled) return;
        fontsSettled = true;
        remeasureAll({ resetText: true });
      })
      .catch(() => {});
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;

    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = 0;
    if (bootstrapTimer) window.clearTimeout(bootstrapTimer);
    if (resizeTimer) window.clearTimeout(resizeTimer);
    if (scanTimer) window.clearTimeout(scanTimer);

    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("orientationchange", onOrientationChange);

    if (mediaQuery && typeof mediaQuery.removeEventListener === "function") {
      mediaQuery.removeEventListener("change", onMotionPreferenceChange);
    }

    mo.disconnect();

    for (const item of items) {
      item.el.style.clipPath = "";
      if (item.path) item.path.remove();
      for (const entry of item.lineInk) entry.path.remove();
    }

    for (const cursor of cursors) {
      cursor.el.classList.remove("cd-is-on", "cd-typing", "cd-flip-x", "cd-flip-left");
    }

    items = [];
    itemMap.clear();
    stage.remove();

    if (window.__cursorDrawTeardown === destroy) {
      window.__cursorDrawTeardown = null;
    }
  }

  const onMotionPreferenceChange = (event) => {
    if (event.matches) destroy();
  };

  if (mediaQuery && typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", onMotionPreferenceChange);
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                               */
  /* ------------------------------------------------------------------ */

  let bootstrapTimer = 0;
  let bootstrapRetries = 0;
  const bootstrap = () => {
    if (destroyed) return;
    scan();
    if (items.length === 0) {
      // DOM belum siap (mis. dipanggil sebelum render) — coba lagi sebentar
      bootstrapRetries += 1;
      if (bootstrapRetries < 20) bootstrapTimer = window.setTimeout(bootstrap, 120);
      return;
    }
    startBootSequence();
    schedule();
  };

  // Jalankan sinkron agar frame pertama sudah dalam kondisi "belum digambar"
  bootstrap();

  window.__cursorDrawTeardown = destroy;

  return destroy;
}
