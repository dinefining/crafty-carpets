// Crafty Carpets — the app: canvas, painting, colours, collection, export.
// Needs motifs.js loaded first (it provides `Motifs`).

(() => {
  const $ = id => document.getElementById(id);
  const T = 11, PER_STYLE = 48;
  const F = 0, BD = 1, DK = 2, A1 = 3, A2 = 4, LT = 5;
  const { LIB, PALETTES, FRINGES } = Motifs;

  // ---------- state ----------
  const S = {
    style: 'Anatolian', motif: 'Figure:18', pal: 'Your colours', colors: ['#262626', '#e2ac45', '#e2dbcb', '#2c6b8b', '#6c8d39', '#c5432c'],
    repeat: 'single', mirror: 'both', lastMirror: 'both', gap: 0, swap: false, link: false, snap: 'off', k: 1, rot: 0, bg: '#141414', fringe: '#e9dfc9',
    kw: 81, tool: 'paint', sound: true, frame: 'none',
    stamps: []
  };
  let gidN = 1;
  const undoStack = [];
  const ROLE_NAMES = ['Base', 'Band', 'Line', 'Acc A', 'Acc B', 'Acc C'];
  const SHOWN_ROLES = [F, DK, A1, A2, LT];

  const G = { guard: 2, band: T + 2 };
  function dims() {
    const W = S.kw; let H = Math.round(W * 1.5); if (H % 2 === 0) H++;
    if (S.frame === 'none') return { W, H, f0: 0, inner: 0 };
    return { W, H, f0: G.guard + G.band + 2, inner: G.guard + G.band };
  }
  let D = dims();

  function motifAt(id, x, y, fh, fv, rot, swap) {
    const m = LIB[id]; if (!m) return -1;
    let ix = fh ? T - 1 - x : x, iy = fv ? T - 1 - y : y;
    if (rot === 1) { const t = ix; ix = iy; iy = T - 1 - t; }
    else if (rot === 2) { ix = T - 1 - ix; iy = T - 1 - iy; }
    else if (rot === 3) { const t = ix; ix = T - 1 - iy; iy = t; }
    let r = m.px[iy * T + ix];
    if (swap) r = r === A1 ? A2 : r === A2 ? A1 : r;
    return r;
  }

  // a stamp covers (T·k)² knots; mirrored copies flip their footprint so symmetry stays exact
  const span = k => T * (k || 1);
  const origin = (c, k, flip) => { const n = span(k), h = Math.floor(n / 2); return flip ? c - (n - 1 - h) : c - h; };

  // ---------- knot state ----------
  let grid, shown, sheen, img;
  const off = document.createElement('canvas'), offCtx = off.getContext('2d');
  let queue = [], qi = 0, pops = [], tiedTotal = 0;
  function allocKnots() {
    D = dims();
    const n = D.W * D.H;
    grid = new Uint8Array(n); shown = new Uint8Array(n); sheen = new Float32Array(n);
    off.width = D.W; off.height = D.H; img = offCtx.createImageData(D.W, D.H);
    queue = []; qi = 0; pops = []; bandCache = null;
  }

  // ---------- build the design grid ----------
  function build() {
    const { W, H, f0, inner } = D, framed = S.frame !== 'none';
    const g = grid;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let c = F;
      if (framed) {
        const e = Math.min(x, y, W - 1 - x, H - 1 - y);
        if (e === 0) c = DK;
        else if (e === 1) c = ((x + y) & 1) ? LT : DK;
        else if (e < inner) c = (e === G.guard || e === inner - 1) ? DK : BD;
        else if (e === inner) c = ((x + y) & 1) ? A1 : LT;
        else if (e === inner + 1) c = DK;
      }
      g[y * W + x] = c;
    }
    const put = (x, y, r) => { if (r >= 0 && x >= 0 && y >= 0 && x < W && y < H) g[y * W + x] = r; };
    const inField = (x, y) => x >= f0 && y >= f0 && x < W - f0 && y < H - f0;
    const inBand = (x, y) => { if (!framed) return false; const e = Math.min(x, y, W - 1 - x, H - 1 - y); return e > G.guard && e < inner - 1; };
    if (framed) for (const [cx, cy] of [[G.guard, G.guard], [W - inner, G.guard], [G.guard, H - inner], [W - inner, H - inner]])
      for (let k = 0; k < G.band; k++) { put(cx + k, cy, DK); put(cx + k, cy + G.band - 1, DK); put(cx, cy + k, DK); put(cx + G.band - 1, cy + k, DK); }
    for (const s of S.stamps) {
      const ok = s.zone === 'frame' ? inBand : inField;
      const k = s.k || 1, n = span(k), x0 = origin(s.x, k, s.fh), y0 = origin(s.y, k, s.fv);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const gx = x0 + x, gy = y0 + y;
        if (!ok(gx, gy)) continue;
        const r = motifAt(s.m, Math.floor(x / k), Math.floor(y / k), s.fh, s.fv, s.rot, s.sw);
        if (r >= 0) g[gy * W + gx] = r;
      }
    }
    // link neighbouring motifs: a Gabriel graph (no third motif between a pair), drawn as stepped lines behind the motifs
    if (S.link) {
      const pf = (x, y, r) => { if (inField(x, y) && g[y * W + x] === F) { g[y * W + x] = r; return true; } return false; };
      const pts = [], seenP = new Set();
      for (const s of S.stamps) if (s.zone === 'field') { const k = s.x + ',' + s.y; if (!seenP.has(k)) { seenP.add(k); pts.push(s); } }
      const MIN2 = 10 * 10, MAX2 = 30 * 30;
      for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) {
        let A = pts[a], B = pts[b];
        const dx0 = B.x - A.x, dy0 = B.y - A.y, d2 = dx0 * dx0 + dy0 * dy0;
        if (d2 < MIN2 || d2 > MAX2) continue;
        const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, r2 = d2 / 4;
        let blocked = false;
        for (let c = 0; c < pts.length && !blocked; c++) {
          if (c === a || c === b) continue;
          const ex = pts[c].x - mx, ey = pts[c].y - my;
          if (ex * ex + ey * ey < r2 - 0.5) blocked = true;
        }
        if (blocked) continue;
        // canonical direction so mirrored pairs draw mirrored paths
        if (A.y > B.y || (A.y === B.y && A.x > B.x)) { const t = A; A = B; B = t; }
        const dx = B.x - A.x, dy = B.y - A.y, adx = Math.abs(dx), ady = Math.abs(dy), sx = Math.sign(dx), sy = Math.sign(dy);
        const diag = Math.min(adx, ady), straight = Math.max(adx, ady) - diag, s1 = Math.floor(straight / 2), alongX = adx > ady;
        const path = [];
        let x = A.x, y = A.y;
        const stepS = () => { if (alongX) x += sx; else y += sy; path.push([x, y]); };
        for (let i = 0; i < s1; i++) stepS();
        for (let i = 0; i < diag; i++) { x += sx; y += sy; path.push([x, y]); }
        for (let i = 0; i < straight - s1; i++) stepS();
        const free = path.filter(([px, py]) => inField(px, py) && g[py * W + px] === F);
        if (free.length < 2) continue;
        for (const [px, py] of free) pf(px, py, DK);
        if (free.length >= 7) {
          const [cx, cy] = free[Math.floor(free.length / 2)];
          for (const [ox, oy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) pf(cx + ox, cy + oy, A1);
          g[cy * W + cx] = LT;
        }
      }
    }
  }

  // ---------- colour ----------
  const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const hash = (x, y) => { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  let bandCache = null, palRGB = null;
  function abrash(H) {
    if (bandCache && bandCache.length === H) return bandCache;
    const b = new Float32Array(H); let y = 0, s = 7;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    while (y < H) { const len = 3 + Math.floor(rnd() * 14), f = 1 + (rnd() - 0.6) * 0.1; for (let k = 0; k < len && y < H; k++, y++) b[y] = f; }
    return (bandCache = b);
  }
  function setPixel(i) {
    const W = D.W, x = i % W, y = (i / W) | 0, role = shown[i], o = i * 4, d = img.data, c = palRGB[role];
    let f = 1 + (hash(x, y) - 0.5) * 0.07;
    if (role === F || role === BD) f *= abrash(D.H)[y];
        d[o] = Math.min(255, c[0] * f); d[o + 1] = Math.min(255, c[1] * f); d[o + 2] = Math.min(255, c[2] * f); d[o + 3] = 255;
  }
  function repaintAll() { palRGB = S.colors.map(hexRgb); for (let i = 0; i < shown.length; i++) setPixel(i); offCtx.putImageData(img, 0, 0); }
  const cssOf = i => `rgb(${img.data[i * 4]},${img.data[i * 4 + 1]},${img.data[i * 4 + 2]})`;

  // ---------- sound: a soft woolen tick as knots tie ----------
  let AC = null, master = null, noiseBuf = null, lastTick = 0, lastSwish = 0;
  function ensureAudio() {
    if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = 0.6; master.connect(AC.destination);
      noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.25, AC.sampleRate);
      const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    } catch (e) { AC = null; }
  }
  const canPlay = () => AC && S.sound && AC.state === 'running';
  function noise(when, dur, freq, q, vel, type = 'bandpass') {
    const src = AC.createBufferSource(); src.buffer = noiseBuf;
    const f = AC.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = AC.createGain(); g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(vel, when + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(f); f.connect(g); g.connect(master); src.start(when); src.stop(when + dur + 0.02);
  }
  const ROLE_FREQ = [260, 340, 180, 620, 820, 1100];
  function knotTick(role, count) {
    if (!canPlay()) return;
    const now = performance.now(); if (now - lastTick < 28) return; lastTick = now;
    noise(AC.currentTime, 0.05, ROLE_FREQ[role] * (0.9 + Math.random() * 0.2), 6, Math.min(0.5, 0.12 + count * 0.01));
  }
  // ---------- view ----------
  const cv = $('cv'), ctx = cv.getContext('2d'), viewEl = $('view');
  const KILIM = 2;
  const fringe = () => Math.max(4, Math.round(D.H * 0.04));
  const V = { s: 4, z: 4, ox: 0, oy: 0, fit: 4 };
  // whole-pixel knots keep edges and grid lines crisp
  const crisp = z => z;
  let ghost = null, cw = 0, ch = 0;

  function resize() {
    const r = viewEl.getBoundingClientRect();
    cw = r.width; ch = r.height;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function fitView() {
    const rows = D.H + 2 * (fringe() + KILIM);
    // leave room for the control panel when it is open
    // the toolbar floats over the canvas's left edge; centre the rug in the space beside it
    const L = $('rail').getBoundingClientRect().right - viewEl.getBoundingClientRect().left, uw = cw - L;
    // phones: fill the space beside the toolbar, one gap from the right edge (in line with the i button)
    const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap')) || 12, phone = cw <= 700;
    V.fit = phone ? Math.max(0.5, Math.min((uw - gap) / D.W, (ch - 2 * gap) / rows))
                  : Math.max(0.5, Math.min((uw - 60) / D.W, (ch - 110) / rows));
    V.z = V.fit; V.s = V.fit;
    V.ox = Math.round(L + (uw - (phone ? gap : 0) - D.W * V.s) / 2); V.oy = Math.round((ch - D.H * V.s) / 2);
    draw();
  }
  function zoomAt(px, py, factor) {
    V.z = Math.max(V.fit * 0.4, Math.min(V.fit * 14, V.z * factor));
    const ns = V.z;
    const k = ns / V.s;
    V.ox = px - (px - V.ox) * k; V.oy = py - (py - V.oy) * k; V.s = ns;
    draw();
  }

  function paintRug(g2, s, ox, oy, lines) {
    const { W, H } = D, FR = fringe();
    g2.fillStyle = S.fringe || '#e9dfc9';
    for (let x = 0; x < W; x += 2) {
      const l1 = (FR - 1 + hash(x, 3) * 1.2) * s, l2 = (FR - 1 + hash(x, 5) * 1.2) * s;
      g2.fillRect(ox + (x + 0.3) * s, oy - KILIM * s - l1, Math.max(1, s * 0.45), l1 + (H + 2 * KILIM) * s + l2);
    }
    g2.fillRect(ox, oy - KILIM * s, W * s, KILIM * s);
    g2.fillRect(ox, oy + H * s, W * s, KILIM * s);
    g2.imageSmoothingEnabled = false;
    g2.drawImage(off, 0, 0, W, H, ox, oy, W * s, H * s);
    if (lines && s >= 4) {
      g2.fillStyle = s >= 7 ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.13)';
      const top = Math.round(oy), left = Math.round(ox), hh = Math.round(oy + H * s) - top, ww = Math.round(ox + W * s) - left;
      for (let x = 1; x < W; x++) g2.fillRect(Math.round(ox + x * s), top, 1, hh);
      for (let y = 1; y < H; y++) g2.fillRect(left, Math.round(oy + y * s), ww, 1);
    }
    const gr = g2.createLinearGradient(0, oy, 0, oy + H * s);
    gr.addColorStop(0, 'rgba(255,236,205,0.06)'); gr.addColorStop(0.5, 'rgba(255,236,205,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.1)');
    g2.fillStyle = gr; g2.fillRect(ox, oy, W * s, H * s);
  }
  function placeBadge() {
    const el = $('curMotif'); if (!el) return;
    // sit level with the rug's top edge (the kilim end), one fringe-gap away from its side
    const size = 52, gap = Math.max(4, Math.round(1.55 * V.s)), top = V.oy - KILIM * V.s;
    let x = V.ox - size - gap, y = top;
    if (x < 8) { x = V.ox; y = top - fringe() * V.s - size - gap; }
    el.style.left = Math.round(Math.max(8, Math.min(cw - size - 8, x))) + 'px';
    el.style.top = Math.round(Math.max(8, Math.min(ch - size - 8, y))) + 'px';
  }
  function drawGrid() {
    let g = 10 * V.s;
    while (g < 36) g *= 2;
    while (g > 140) g /= 2;
    ctx.fillStyle = 'rgba(255,255,255,0.13)';
    for (let x = ((V.ox % g) + g) % g; x < cw; x += g) ctx.fillRect(Math.round(x), 0, 1, ch);
    for (let y = ((V.oy % g) + g) % g; y < ch; y += g) ctx.fillRect(0, Math.round(y), cw, 1);
  }
  // ---------- light / dark interface ----------
  const THEME = { canvas: '#141414', ghost: '#ffffff' };
  function readTheme() { const cs = getComputedStyle(document.documentElement); THEME.canvas = cs.getPropertyValue('--canvas').trim() || '#141414'; THEME.ghost = cs.getPropertyValue('--ghost').trim() || '#ffffff'; }
  function setTheme(t, keep) {
    document.documentElement.dataset.theme = t; readTheme();
    if (keep) { try { localStorage.setItem('loom-theme', t); } catch (e) {} }
    if (typeof cw !== 'undefined' && cw) draw();
  }
  document.documentElement.dataset.theme = 'dark';
  function draw(now = performance.now()) {
    ctx.fillStyle = S.bg || THEME.canvas; ctx.fillRect(0, 0, cw, ch);
    paintRug(ctx, V.s, V.ox, V.oy, true);
    if (V.s >= 2.5 && pops.length) {
      const lim = Math.max(0, pops.length - 1800);
      for (let k = lim; k < pops.length; k++) {
        const p = pops[k], t = (now - p.t) / 170; if (t >= 1 || t < 0) continue;
        const x = p.i % D.W, y = (p.i / D.W) | 0, sz = V.s * (1 + 0.7 * (1 - t)), c = V.s / 2;
        ctx.globalAlpha = 1 - t * 0.5; ctx.fillStyle = p.c;
        ctx.fillRect(V.ox + x * V.s + c - sz / 2, V.oy + y * V.s + c - sz / 2, sz, sz);
        ctx.fillStyle = 'rgba(255,255,255,' + (0.35 * (1 - t)) + ')';
        ctx.fillRect(V.ox + x * V.s + c - sz / 2, V.oy + y * V.s + c - sz / 2, sz, Math.max(1, sz * 0.25));
      }
      ctx.globalAlpha = 1;
    }
    if (ghost) drawGhost();
    $('zoomPct').textContent = Math.round(V.s / V.fit * 100) + '%';
  }
  function rectK(x, y, w, h, lw) { ctx.lineWidth = lw; ctx.strokeRect(V.ox + x * V.s, V.oy + y * V.s, w * V.s, h * V.s); }
  function drawGhost() {
    const { W, H, f0, inner } = D;
    ctx.strokeStyle = THEME.ghost;
    if (S.tool === 'erase') {
      const s = stampAt(ghost.x, ghost.y, ghost.zone);
      if (s) S.stamps.filter(t => t.gid === s.gid).forEach(t => rectK(origin(t.x, t.k, t.fh), origin(t.y, t.k, t.fv), span(t.k), span(t.k), 1.5));
      return;
    }
    const sp = snapPoint(ghost.x, ghost.y, ghost.zone);
    if (S.snap !== 'off' && ghost.zone === 'field') {
      const u = S.snap === 'square' ? T : 6, cx0 = (W - 1) / 2, cy0 = (H - 1) / 2;
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      for (let x = cx0 - Math.floor((cx0 - f0) / u) * u - 5; x < W - f0; x += u) if (x >= f0) ctx.fillRect(V.ox + x * V.s, V.oy + f0 * V.s, 1, (H - 2 * f0) * V.s);
      for (let y = cy0 - Math.floor((cy0 - f0) / u) * u - 5; y < H - f0; y += u) if (y >= f0) ctx.fillRect(V.ox + f0 * V.s, V.oy + y * V.s, (W - 2 * f0) * V.s, 1);
    }
    const list = placements(sp.x, sp.y, ghost.zone), pal = S.colors;
    const ok = ghost.zone === 'frame' ? ((x, y) => { const e = Math.min(x, y, W - 1 - x, H - 1 - y); return e > G.guard && e < inner - 1; }) : ((x, y) => x >= f0 && y >= f0 && x < W - f0 && y < H - f0);
    ctx.globalAlpha = 0.6;
    const K = S.k, N = span(K);
    for (const p of list) { const x0 = origin(p.x, K, p.fh), y0 = origin(p.y, K, p.fv); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const gx = x0 + x, gy = y0 + y;
      if (!ok(gx, gy)) continue;
      const r = motifAt(S.motif, Math.floor(x / K), Math.floor(y / K), p.fh, p.fv, S.rot || 0, S.swap);
      if (r >= 0) { ctx.fillStyle = pal[r]; ctx.fillRect(V.ox + gx * V.s, V.oy + gy * V.s, V.s, V.s); }
    } }
    ctx.globalAlpha = 1;
    for (const p of list) rectK(origin(p.x, K, p.fh), origin(p.y, K, p.fv), N, N, 1);
  }

  // ---------- placement ----------
  function snapPoint(x, y, zone) {
    const { W, H, inner } = D;
    if (zone === 'frame') {
      const lane = G.guard + 1 + 5, nx = Math.min(x, W - 1 - x), ny = Math.min(y, H - 1 - y);
      if (ny < inner) y = y < H / 2 ? lane : H - 1 - lane;
      if (nx < inner) x = x < W / 2 ? lane : W - 1 - lane;
    }
    if (S.snap === 'off') return { x, y };
    const u = S.snap === 'square' ? T : 6, cx0 = (W - 1) / 2, cy0 = (H - 1) / 2;
    const nx = Math.min(x, W - 1 - x), ny = Math.min(y, H - 1 - y);
    const sx = zone === 'frame' && nx < inner ? x : Math.round(cx0 + Math.round((x - cx0) / u) * u);
    const sy = zone === 'frame' && ny < inner ? y : Math.round(cy0 + Math.round((y - cy0) / u) * u);
    return { x: sx, y: sy };
  }
  function placements(cx, cy, zone) {
    const { W, H, f0, inner } = D;
    const inZone = (x, y) => zoneAt(x, y) === zone;
    const step = T + S.gap, base = [];
    const lo = zone === 'frame' ? 0 : f0, hiX = zone === 'frame' ? W : W - f0, hiY = zone === 'frame' ? H : H - f0;
    const along = (c, l, h, out) => { for (let v = c; v >= l; v -= step) out.push(v); for (let v = c + step; v < h; v += step) out.push(v); };
    if (S.repeat === 'single') base.push([cx, cy]);
    else if (S.repeat === 'row') { const xs = []; along(cx, lo, hiX, xs); xs.forEach(x => base.push([x, cy])); }
    else if (S.repeat === 'col') { const ys = []; along(cy, lo, hiY, ys); ys.forEach(y => base.push([cx, y])); }
    else {
      const xs = []; along(cx, lo - step, hiX + step, xs);
      xs.forEach(x => {
        const col = Math.round((x - cx) / step), sh = S.repeat === 'drop' && (col & 1) ? Math.floor(step / 2) : 0;
        const ys = []; along(cy + sh, lo - step, hiY + step, ys); ys.forEach(y => base.push([x, y]));
      });
    }
    const out = new Map();
    const add = (x, y, fh, fv) => {
      const k = x + ',' + y;
      if (out.has(k)) return;
      if (zone === 'frame') { if (!inZone(x, y)) return; }
      else {
        { const h = span(S.k) / 2; if (!(x + h >= f0 && y + h >= f0 && x - h < W - f0 && y - h < H - f0)) return; }
        if ((S.repeat === 'single' || S.repeat === 'row' || S.repeat === 'col') && !inZone(x, y)) return;
      }
      out.set(k, { x, y, fh, fv });
    };
    for (const [x, y] of base) {
      add(x, y, 0, 0);
      if (S.mirror === 'h' || S.mirror === 'both') add(W - 1 - x, y, 1, 0);
      if (S.mirror === 'v' || S.mirror === 'both') add(x, H - 1 - y, 0, 1);
      if (S.mirror === 'both') add(W - 1 - x, H - 1 - y, 1, 1);
    }
    return [...out.values()];
  }
  function zoneAt(x, y) {
    const { W, H, inner } = D;
    if (x < 0 || y < 0 || x >= W || y >= H) return null;
    if (S.frame === 'none') return 'field';
    const e = Math.min(x, y, W - 1 - x, H - 1 - y);
    if (e < G.guard) return 'edge';
    return e < inner + 2 ? 'frame' : 'field';
  }
  function stampAt(x, y, zone) { for (let i = S.stamps.length - 1; i >= 0; i--) { const s = S.stamps[i]; if ((!zone || s.zone === zone)) { const x0 = origin(s.x, s.k, s.fh), y0 = origin(s.y, s.k, s.fv), n = span(s.k); if (x >= x0 && y >= y0 && x < x0 + n && y < y0 + n) return s; } } return null; }
  function placeGroup(x, y, zone) { const sp = snapPoint(x, y, zone), gid = gidN++; for (const p of placements(sp.x, sp.y, zone)) S.stamps.push({ m: S.motif, x: p.x, y: p.y, fh: p.fh, fv: p.fv, rot: S.rot || 0, sw: S.swap, gid, zone, k: S.k }); return sp; }
  function runBorder(id, sw) {
    if (S.frame === 'none') return;
    const { W, H, inner } = D, gid = gidN++, lane = G.guard + 1 + 5;
    S.stamps = S.stamps.filter(s => !(s.zone === 'frame' && s.edge));
    const each = (len, fn) => { const step = T + 1, n = Math.max(1, Math.floor((len + 1) / step)), o = Math.floor((len - (n * step - 1)) / 2); for (let i = 0; i < n; i++) fn(o + i * step + 5); };
    each(W - 2 * inner, u => { S.stamps.push({ m: id, x: inner + u, y: lane, fh: 0, fv: 0, rot: 0, sw, gid, zone: 'frame', edge: 1 }); S.stamps.push({ m: id, x: inner + u, y: H - 1 - lane, fh: 0, fv: 1, rot: 0, sw, gid, zone: 'frame', edge: 1 }); });
    each(H - 2 * inner, u => { S.stamps.push({ m: id, x: lane, y: inner + u, fh: 0, fv: 0, rot: 1, sw, gid, zone: 'frame', edge: 1 }); S.stamps.push({ m: id, x: W - 1 - lane, y: inner + u, fh: 1, fv: 0, rot: 1, sw, gid, zone: 'frame', edge: 1 }); });
  }
  function putCorners(id, sw) {
    if (S.frame === 'none') return;
    const { W, H } = D, gid = gidN++, lane = G.guard + 1 + 5;
    S.stamps = S.stamps.filter(s => !(s.zone === 'frame' && s.corner));
    for (const [x, y, fh, fv] of [[lane, lane, 0, 0], [W - 1 - lane, lane, 1, 0], [lane, H - 1 - lane, 0, 1], [W - 1 - lane, H - 1 - lane, 1, 1]])
      S.stamps.push({ m: id, x, y, fh, fv, rot: 0, sw, gid, zone: 'frame', corner: 1 });
  }

  // ---------- tying knots ----------
  function schedule(origin) {
    const { W, H } = D, now = performance.now(), ox = origin ? origin.x : W / 2, oy = origin ? origin.y : H / 2;
    const add = [];
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] === shown[i]) continue;
      const x = i % W, y = (i / W) | 0;
      add.push({ i, t: now + Math.min(650, Math.hypot(x - ox, y - oy) * 9) + hash(x, y) * 30 });
    }
    if (!add.length) return;
    queue = queue.slice(qi).concat(add).sort((a, b) => a.t - b.t); qi = 0;
    kick();
  }
  function processQueue(now) {
    let n = 0; const tally = [0, 0, 0, 0, 0, 0];
    while (qi < queue.length && queue[qi].t <= now) {
      const { i } = queue[qi++], role = grid[i];
      if (shown[i] === role) continue;
      shown[i] = role; setPixel(i);
      pops.push({ i, t: now, c: cssOf(i) });
      tally[role]++; n++; tiedTotal++;
    }
    if (qi >= queue.length) { queue = []; qi = 0; }
    if (n) {
      offCtx.putImageData(img, 0, 0);
      let best = 0; for (let r = 1; r < 6; r++) if (tally[r] > tally[best]) best = r;
      knotTick(best, n);
      status();
    }
  }
  function refresh(origin) { build(); schedule(origin); draw(); status(); }

  let rafOn = false;
  function kick() { if (!rafOn) { rafOn = true; requestAnimationFrame(loop); } }
  function loop(now) {
    processQueue(now);
    pops = pops.filter(p => now - p.t < 180);
    draw(now);
    if (qi < queue.length || pops.length) requestAnimationFrame(loop); else rafOn = false;
  }

  // ---------- undo ----------
  const snap = () => ({ stamps: S.stamps.slice() });
  const redoStack = [];
  function pushUndo() { undoStack.push(snap()); if (undoStack.length > 200) undoStack.shift(); redoStack.length = 0; }
  function undo() { const s = undoStack.pop(); if (!s) { hint('Nothing to undo.'); return; } redoStack.push(snap()); Object.assign(S, s); refresh(null); }
  function redo() { const s = redoStack.pop(); if (!s) { hint('Nothing to redo.'); return; } undoStack.push(snap()); Object.assign(S, s); refresh(null); }

  function status() { $('st1').textContent = `${tiedTotal.toLocaleString('en')} knots tied · ${S.stamps.length} motifs`; $('sizeTag').textContent = `${D.W} × ${D.H} knots`; $('rugVal').textContent = `${D.W}×${D.H}`; $('tileVal').textContent = S.k + '×'; $('railTile').textContent = S.k + '×'; $('railRug').textContent = D.W; }
  let hintT;
  function hint(t, sticky) { $('hint').textContent = t; clearTimeout(hintT); if (!sticky) hintT = setTimeout(() => $('hint').textContent = '', 3500); }

  // ---------- pointer ----------
  const pts = new Map();
  let mode = null, spaceDown = false;
  const local = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const knotF = p => ({ x: (p.x - V.ox) / V.s, y: (p.y - V.oy) / V.s });
  const knot = p => { const k = knotF(p); return { x: Math.floor(k.x), y: Math.floor(k.y) }; };
  cv.addEventListener('pointerdown', e => {
    e.preventDefault();
    ensureAudio();
    cv.setPointerCapture(e.pointerId);
    const p = local(e); pts.set(e.pointerId, p);
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      mode = { type: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y), s0: V.s, ox0: V.ox, oy0: V.oy, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      return;
    }
    const k = knot(p), z = zoneAt(k.x, k.y);
    if (e.button === 1 || e.button === 2 || spaceDown || !z || z === 'edge') { mode = { type: 'pan', x: p.x, y: p.y }; cv.style.cursor = 'grabbing'; return; }
    pushUndo();
    if (S.tool === 'erase') {
      const s = stampAt(k.x, k.y, z);
      if (s) { S.stamps = S.stamps.filter(t => t.gid !== s.gid); hint('Erased that motif and its copies.'); } else undoStack.pop();
      mode = { type: 'erase', zone: z };
    } else {
      const sp = placeGroup(k.x, k.y, z);
      mode = { type: 'paint', x: sp.x, y: sp.y, zone: z, free: S.repeat !== 'grid' && S.repeat !== 'drop' };
    }
    refresh(k);
  });
  cv.addEventListener('pointermove', e => {
    const p = local(e);
    if (pts.has(e.pointerId)) pts.set(e.pointerId, p);
    if (mode && mode.type === 'pinch' && pts.size === 2) {
      const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      V.z = Math.max(V.fit * 0.4, Math.min(V.fit * 14, mode.s0 * d / mode.d0)); const ns = crisp(V.z), k = ns / mode.s0;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      V.s = ns; V.ox = Math.round(mx - (mode.mx - mode.ox0) * k); V.oy = Math.round(my - (mode.my - mode.oy0) * k);
      draw(); return;
    }
    if (mode && mode.type === 'pan') { V.ox += Math.round(p.x - mode.x); V.oy += Math.round(p.y - mode.y); mode.x = p.x; mode.y = p.y; draw(); return; }
    const k = knot(p), z = zoneAt(k.x, k.y);
    if (mode && mode.type === 'erase') { const s = z ? stampAt(k.x, k.y, z) : null; if (s) { S.stamps = S.stamps.filter(t => t.gid !== s.gid); refresh(k); } return; }
    if (mode && mode.type === 'paint') {
      if (mode.free && z === mode.zone) {
        const sp = snapPoint(k.x, k.y, z);
        if (Math.max(Math.abs(sp.x - mode.x), Math.abs(sp.y - mode.y)) >= span(S.k)) { placeGroup(k.x, k.y, z); mode.x = sp.x; mode.y = sp.y; refresh(k); }
      }
      return;
    }
    if (mode) return;
    const prev = ghost;
    ghost = (z && z !== 'edge') ? { x: k.x, y: k.y, zone: z } : null;
    cv.style.cursor = spaceDown ? 'grab' : ghost ? 'crosshair' : 'grab';
    if (!prev && !ghost) return;
    if (prev && ghost && prev.x === ghost.x && prev.y === ghost.y && prev.zone === ghost.zone) return;
    if (ghost) hint(S.tool === 'erase' ? 'Click a motif to erase it and its copies' : ghost.zone === 'frame' ? 'Painting on the frame' : 'Click or drag to paint', true);
    else hint('');
    if (!rafOn) draw();
  });
  const up = e => {
    pts.delete(e.pointerId); if (pts.size === 0) { mode = null; cv.style.cursor = ''; }
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', () => { if (!mode) { ghost = null; hint(''); if (!rafOn) draw(); } });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('wheel', e => { e.preventDefault(); const p = local(e); zoomAt(p.x, p.y, Math.exp(-e.deltaY * (e.ctrlKey ? 0.012 : 0.0018))); }, { passive: false });
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && e.target === document.body) { spaceDown = true; cv.style.cursor = 'grab'; e.preventDefault(); }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveRug(false); return; }
    if (e.key === 'Escape') { $('ov').hidden = true; return; }
    if (e.metaKey || e.ctrlKey || e.altKey || (e.target && /INPUT|TEXTAREA/.test(e.target.tagName) && e.target.type !== 'range')) return;
    const cyc = (key, list) => { S[key] = list[(list.indexOf(S[key]) + 1) % list.length]; syncAll(); if (!rafOn) draw(); };
    const k = e.key.toLowerCase();
    if (k === 'e') { S.tool = S.tool === 'erase' ? 'paint' : 'erase'; syncAll(); }
    else if (k === 'm') cycleMirror(e.shiftKey ? -1 : 1);
    else if (k === '-' || k === '=' || k === '+') { setTile(S.k + (k === '-' ? -1 : 1)); }
    else if (k === 'r') { rotate(1); }
    else if (k === 't') { rotate(-1); }
    else if (k === '[' || k === ']') {
      const i = POOL.findIndex(m => m.id === S.motif), n = (i + (k === ']' ? 1 : -1) + POOL.length) % POOL.length;
      selectMotif(POOL[n].id, true);
    }
  });
  document.addEventListener('keyup', e => { if (e.code === 'Space') { spaceDown = false; cv.style.cursor = ''; } });

  // ---------- controls ----------
  const pressed = (sel, test) => document.querySelectorAll(sel).forEach(b => b.setAttribute('aria-pressed', test(b) ? 'true' : 'false'));
  function applyColors() { repaintAll(); renderLib(); renderMine(); renderPals(); draw(); }
  // one assorted pool of every motif, shuffled once (seeded so the order is stable), hand-drawn ones spread through it
  const POOL = (() => { const all = Object.values(LIB); let a = 20261001; const r = () => { a = (a * 1103515245 + 12345) % 2147483648; return a / 2147483648; };
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; } return all; })();
  // tiles are built once; colour changes only repaint their little canvases
  const tileEls = new Map();
  function paintTile(c, id, rot = 0) {
    const g2 = c.getContext('2d'), pal = S.colors;
    g2.fillStyle = pal[F]; g2.fillRect(0, 0, T + 2, T + 2);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const r = motifAt(id, x, y, 0, 0, rot, S.swap); if (r >= 0) { g2.fillStyle = pal[r]; g2.fillRect(x + 1, y + 1, 1, 1); } }
  }
  function selectMotif(id, scroll) {
    const prev = tileEls.get(S.motif); if (prev) prev.setAttribute('aria-pressed', 'false');
    S.motif = id; if (S.tool !== 'paint') S.tool = 'paint';
    const cur = tileEls.get(id); if (cur) { cur.setAttribute('aria-pressed', 'true'); if (scroll) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    syncAll(); paintCurrent(); if (!rafOn) draw();
  }
  function paintCurrent() { paintTile($('railCur'), S.motif, S.rot || 0); }
  const FILTERS = ['All', 'Square', 'Round', 'Cross', 'Triangle', 'Misc', 'Mono'];
  function renderLib() {
    const el = $('lib');
    if (!tileEls.size) {
      for (const m of POOL) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'tile'; b.title = m.n; b.setAttribute('aria-label', m.n); b.dataset.id = m.id;
        b.setAttribute('aria-pressed', m.id === S.motif ? 'true' : 'false');
        const c = document.createElement('canvas'); c.width = T + 2; c.height = T + 2; b.appendChild(c);
        b.dataset.tags = [m.shape === 'diamond' ? 'square' : m.shape, m.mono ? 'mono' : ''].join(' ');
        el.appendChild(b); tileEls.set(m.id, b);
      }
      const tabs = $('tabs');
      for (const name of FILTERS) {
        const t = document.createElement('button');
        t.type = 'button'; t.className = 'tab'; t.textContent = name; t.dataset.f = name;
        t.setAttribute('aria-pressed', name === 'All' ? 'true' : 'false');
        t.addEventListener('click', () => setFilter(name));
        tabs.appendChild(t);
      }
      el.addEventListener('click', e => {
        const b = e.target.closest('.tile'); if (!b) return;
        selectMotif(b.dataset.id);
        if ($('side').dataset.show === 'lib') setSide('lib');   // close the library once a motif is picked
      });
      $('mcount').textContent = `${POOL.length} motifs`;
    }
    for (const [id, b] of tileEls) paintTile(b.firstChild, id);
    paintCurrent();
  }
  function setFilter(name) {
    let n = 0;
    for (const [, b] of tileEls) { const show = name === 'All' || b.dataset.tags.split(' ').includes(name.toLowerCase()); b.hidden = !show; if (show) n++; }
    document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-pressed', t.dataset.f === name ? 'true' : 'false'));
    $('mcount').textContent = `${n} motifs`;
    $('lib').scrollTop = 0; $('lib').scrollLeft = 0;
  }
  function toggleLib(open) {
    const lib = $('library');
    lib.classList.toggle('open', open);
    $('libToggle').setAttribute('aria-expanded', open ? 'true' : 'false');
    $('libToggle').textContent = open ? 'Close ▾' : 'All ▴';
    const cur = tileEls.get(S.motif); if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  $('libToggle').addEventListener('click', () => toggleLib(!$('library').classList.contains('open')));
  // the motif button shows or hides the library beside the rail
  // panels slide over the canvas; nudge the rug clear of them only when it would be covered
  const NUDGE = { dx: 0, ox: null, raf: 0 };
  function panTo(target, after) {
    cancelAnimationFrame(NUDGE.raf);
    const from = V.ox, t0 = performance.now(), dur = 240;
    const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      V.ox = Math.round(from + (target - from) * e); draw();
      if (k < 1) NUDGE.raf = requestAnimationFrame(step); else if (after) after(); };
    NUDGE.raf = requestAnimationFrame(step);
  }
  function nudgeForPanel() {
    const side = $('side'), open = side.dataset.show !== 'none';
    if (open) {
      if (cw <= 700 && side.dataset.show === 'saved') return;     // phones: the collection just floats over the rug
      const pw = side.getBoundingClientRect().right - viewEl.getBoundingClientRect().left, x0 = V.ox, x1 = V.ox + D.W * V.s, gap = 24;
      if (x0 >= pw + gap - 1 || x1 <= pw) return;                 // clear of the panel, or already off to the left: leave it
      const room = cw - pw, w = x1 - x0;
      const target = w + 2 * gap <= room ? Math.round(pw + (room - w) / 2) : pw + gap;
      const dx = target - x0; if (dx <= 0) return;
      NUDGE.dx += dx; panTo(V.ox + dx, () => { NUDGE.ox = V.ox; });
    } else if (NUDGE.dx) {
      const dx = NUDGE.dx; NUDGE.dx = 0;
      if (NUDGE.ox === V.ox) panTo(V.ox - dx);                    // only slide back if you haven't moved the rug since
      NUDGE.ox = null;
    }
  }
  // the collection panel spans from the paint tool down to the bookmark it opens from
  function placeSide() {
    const side = $('side');
    if (side.dataset.show === 'saved') {
      const paint = document.querySelector('#rail [data-tool="paint"]').getBoundingClientRect(), app = document.querySelector('.app').getBoundingClientRect();
      side.style.top = Math.round(paint.top - app.top) + 'px';
    } else side.style.top = '';
  }
  window.addEventListener('resize', placeSide);
  function setSide(v) {
    const side = $('side'), was = side.dataset.show;
    side.dataset.show = side.dataset.show === v ? 'none' : v;
    placeSide();
    if ((was === 'none') !== (side.dataset.show === 'none')) nudgeForPanel();
    $('railLib').setAttribute('aria-pressed', side.dataset.show === 'lib' ? 'true' : 'false');
    $('bSaved').setAttribute('aria-pressed', side.dataset.show === 'saved' ? 'true' : 'false');
    if (side.dataset.show === 'saved') { renderColl(); scrollCollEnd(); }
  }
  $('railLib').addEventListener('click', () => {
    { setSide('lib'); const cur = tileEls.get(S.motif); if (cur && $('side').dataset.show === 'lib') cur.scrollIntoView({ block: 'center' }); }
  });
  // one mirror button cycles through its four states
  const MIRRORS = ['none', 'h', 'v', 'both'], MIRROR_NAMES = { none: 'No mirror', h: 'Mirror left–right', v: 'Mirror top–bottom', both: 'Mirror both ways' };
  // mirror icons on a 9×9 knot grid: a block, then its copies across the mirror lines
  const MIRROR_ICONS = {
    none: '<rect x="7" y="7" width="10" height="10"/>',
    v: '<rect x="7" y="3.5" width="10" height="5"/><rect x="7" y="15.5" width="10" height="5"/><path d="M2.5 12h19" stroke-dasharray="0.1 3"/>',
    h: '<rect x="3.5" y="7" width="5" height="10"/><rect x="15.5" y="7" width="5" height="10"/><path d="M12 2.5v19" stroke-dasharray="0.1 3"/>',
    both: '<rect x="3.5" y="3.5" width="5" height="5"/><rect x="15.5" y="3.5" width="5" height="5"/><rect x="3.5" y="15.5" width="5" height="5"/><rect x="15.5" y="15.5" width="5" height="5"/><path d="M2.5 12h19M12 2.5v19" stroke-dasharray="0.1 3"/>'
  };
  function drawMirrorIcon() {
    const m = S.mirror;
    $('mirrorIcon').innerHTML = MIRROR_ICONS[m];
    $('mirrorBtn').title = MIRROR_NAMES[m] + ' · click to change';
    $('mirrorBtn').setAttribute('aria-label', MIRROR_NAMES[m] + '. Click to change');
  }
  const back = e => e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.button === 2;
  const cycleMirror = dir => { S.mirror = MIRRORS[(MIRRORS.indexOf(S.mirror) + dir + 4) % 4]; syncAll(); if (!rafOn) draw(); };
  $('mirrorBtn').addEventListener('click', e => cycleMirror(back(e) ? -1 : 1));
  $('mirrorBtn').addEventListener('contextmenu', e => { e.preventDefault(); cycleMirror(-1); });
  // tile, rug and zoom: click goes up, ⌘/Ctrl/Alt-click or right-click goes down
  const stepTile = dir => setTile(S.k + dir > 6 ? 1 : S.k + dir < 1 ? 6 : S.k + dir);
  const stepRug = dir => { let v = S.kw + dir * 10; if (v > 161) v = 61; if (v < 61) v = 161; setRug(v); };
  const stepZoom = dir => zoomAt(cw / 2, ch / 2, dir > 0 ? 1.3 : 1 / 1.3);
  for (const [id, fn] of [['zoomBtn', stepZoom]]) {
    $(id).addEventListener('click', e => fn(back(e) ? -1 : 1));
    $(id).addEventListener('contextmenu', e => { e.preventDefault(); fn(-1); });
  }
  // flyouts for settings that need more than one click
  const GAP = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap')) || 12;
  const fly = $('fly');
  let flyBtn = null;
  function closeFly() {
    if (fly.hidden) return;
    fly.hidden = true; if (flyBtn) flyBtn.setAttribute('aria-expanded', 'false'); flyBtn = null;
    closePicker();
  }
  function openFly(name, btn) {
    if (flyBtn === btn) { closeFly(); return; }
    closeFly();
    fly.dataset.show = name; fly.hidden = false; flyBtn = btn; btn.setAttribute('aria-expanded', 'true');
    const r = btn.getBoundingClientRect();
    fly.style.left = (r.right + GAP()) + 'px';
    fly.style.top = Math.max(GAP(), Math.min(window.innerHeight - fly.offsetHeight - GAP(), r.top)) + 'px';
  }
  document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openFly(b.dataset.open, b); }));
  document.addEventListener('pointerdown', e => {
    if (fly.hidden) return;
    if (fly.contains(e.target) || (flyBtn && flyBtn.contains(e.target)) || $('picker').contains(e.target)) return;
    closeFly();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeFly(); });
  function setName() {}

  function renderMine() {
    const el = $('mine');
    if (!el.children.length) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'swatch'; b.dataset.role = 'bg'; b.setAttribute('aria-expanded', 'false');
      b.innerHTML = '<span class="chip"></span><span>BG</span>'; b.setAttribute('aria-label', 'Background colour');
      b.addEventListener('click', e => { e.stopPropagation(); openPicker(BG, b); });
      el.appendChild(b);
      const f = document.createElement('button');
      f.type = 'button'; f.className = 'swatch'; f.dataset.role = 'fringe'; f.setAttribute('aria-expanded', 'false');
      f.innerHTML = '<span class="chip"></span><span>Fringe</span>'; f.setAttribute('aria-label', 'Fringe colour');
      f.addEventListener('click', e => { e.stopPropagation(); openPicker(FRINGE, f); });
      el.appendChild(f);
    }
    if (el.children.length === 2) { const d = document.createElement('span'); d.className = 'swsep'; d.setAttribute('aria-hidden', 'true'); el.appendChild(d); }
    if (el.children.length === 3) for (const r of SHOWN_ROLES) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'swatch'; b.dataset.role = r; b.setAttribute('aria-expanded', 'false');
      b.innerHTML = '<span class="chip"></span><span></span>';
      b.lastChild.textContent = ROLE_NAMES[r];
      b.setAttribute('aria-label', ROLE_NAMES[r] + ' colour');
      b.addEventListener('click', e => { e.stopPropagation(); openPicker(r, b); });
      el.appendChild(b);
    }
    el.children[0].querySelector('.chip').style.background = S.bg;
    el.children[1].querySelector('.chip').style.background = S.fringe;
    SHOWN_ROLES.forEach((r, n) => { el.children[n + 3].querySelector('.chip').style.background = S.colors[r]; });
    $('palName').textContent = S.pal;
  }
  // ---------- colour picker (HSV square + hue strip + hex) ----------
  const PK = { role: -1, h: 0, s: 0, v: 0, btn: null };
  const BG = 99, FRINGE = 98, getCol = r => r === BG ? S.bg : r === FRINGE ? S.fringe : S.colors[r];
  const pk = $('picker'), sv = $('pkSV'), hu = $('pkH'), svc = sv.getContext('2d'), huc = hu.getContext('2d');
  function hsv2hex(h, s, v) {
    const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
    return '#' + [f(5), f(3), f(1)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
  }
  function hex2hsv(hex) {
    const [r, g, b] = hexRgb(hex).map(x => x / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: (h * 60 + 360) % 360, s: mx ? d / mx : 0, v: mx };
  }
  function drawPicker() {
    const W2 = sv.width, H2 = sv.height;
    svc.fillStyle = hsv2hex(PK.h, 1, 1); svc.fillRect(0, 0, W2, H2);
    let g = svc.createLinearGradient(0, 0, W2, 0); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)'); svc.fillStyle = g; svc.fillRect(0, 0, W2, H2);
    g = svc.createLinearGradient(0, 0, 0, H2); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, '#000'); svc.fillStyle = g; svc.fillRect(0, 0, W2, H2);
    const mx = PK.s * (W2 - 1), my = (1 - PK.v) * (H2 - 1);
    svc.strokeStyle = PK.v > 0.5 ? '#000' : '#fff'; svc.lineWidth = 1; svc.strokeRect(Math.round(mx) - 3.5, Math.round(my) - 3.5, 7, 7);
    for (let x = 0; x < hu.width; x++) { huc.fillStyle = hsv2hex(x / hu.width * 360, 1, 1); huc.fillRect(x, 0, 1, hu.height); }
    const hx = Math.round(PK.h / 360 * (hu.width - 1));
    huc.fillStyle = '#000'; huc.fillRect(hx - 2, 0, 5, hu.height); huc.fillStyle = '#fff'; huc.fillRect(hx - 1, 0, 3, hu.height);
  }
  function applyPicked(live) {
    const hex = hsv2hex(PK.h, PK.s, PK.v);
    $('pkHex').value = hex.toUpperCase();
    if (PK.role === FRINGE) { S.fringe = hex; draw(); if (PK.btn) PK.btn.querySelector('.chip').style.background = hex; return; }
    if (PK.role === BG) { S.bg = hex; draw(); if (PK.btn) PK.btn.querySelector('.chip').style.background = hex; return; }
    S.colors[PK.role] = hex; S.pal = 'Your colours';
    palRGB = S.colors.map(hexRgb); repaintAll(); draw();
    if (PK.btn) PK.btn.querySelector('.chip').style.background = hex;
    pressed('.pal', () => false);
    if (!live) renderLib();
  }
  function openPicker(role, btn) {
    if (PK.role === role && !pk.hidden) { closePicker(); return; }
    closePicker();
    Object.assign(PK, hex2hsv(getCol(role)), { role, btn });
    btn.setAttribute('aria-expanded', 'true');
    $('pkName').textContent = role === BG ? 'Background' : role === FRINGE ? 'Fringe' : ROLE_NAMES[role]; $('pkHex').value = getCol(role).toUpperCase();
    pk.hidden = false;
    const r = btn.getBoundingClientRect();
    const fr = $('fly').hidden ? null : $('fly').getBoundingClientRect();
    const roomRight = fr && fr.right + GAP() + pk.offsetWidth < window.innerWidth;
    pk.style.left = (roomRight ? fr.right + GAP() : Math.min(window.innerWidth - pk.offsetWidth - 8, r.left)) + 'px';
    if (roomRight) { pk.style.width = fr.width + 'px'; pk.style.height = fr.height + 'px'; } else { pk.style.width = ''; pk.style.height = ''; }
    pk.style.top = Math.max(6, Math.min(window.innerHeight - pk.offsetHeight - 8, roomRight ? fr.top : r.bottom + 6)) + 'px';
    // match the canvases' pixel size to their laid-out size so the marks stay crisp
    for (const c of [sv, hu]) { const b = c.getBoundingClientRect(); c.width = Math.max(40, Math.round(b.width - 2)); c.height = Math.max(10, Math.round(b.height - 2)); }
    drawPicker();
  }
  function closePicker() {
    if (pk.hidden) return;
    pk.hidden = true; if (PK.btn) PK.btn.setAttribute('aria-expanded', 'false');
    renderLib(); PK.role = -1; PK.btn = null;
  }
  function dragOn(c, fn) {
    c.addEventListener('pointerdown', e => {
      c.setPointerCapture(e.pointerId);
      const go = ev => { const r = c.getBoundingClientRect(); fn(Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height))); drawPicker(); applyPicked(true); };
      go(e);
      const stop = () => { c.removeEventListener('pointermove', go); c.removeEventListener('pointerup', stop); };
      c.addEventListener('pointermove', go); c.addEventListener('pointerup', stop);
    });
  }
  dragOn(sv, (x, y) => { PK.s = x; PK.v = 1 - y; });
  dragOn(hu, x => { PK.h = x * 359.9; });
  $('pkHex').addEventListener('input', e => {
    let v = e.target.value.trim(); if (v[0] !== '#') v = '#' + v;
    if (/^#[0-9a-f]{6}$/i.test(v)) { Object.assign(PK, hex2hsv(v.toLowerCase())); drawPicker(); applyPicked(true); }
  });
  document.addEventListener('pointerdown', e => { if (!pk.hidden && !pk.contains(e.target) && !(PK.btn && PK.btn.contains(e.target))) closePicker(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePicker(); });
  function renderPals() {
    const el = $('pals'); el.innerHTML = '';
    for (const name in PALETTES) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pal'; b.setAttribute('aria-pressed', name === S.pal ? 'true' : 'false');
      b.innerHTML = `<span class="sw">${SHOWN_ROLES.map(r => `<i style="background:${PALETTES[name][r]}"></i>`).join('')}</span><span></span>`;
      b.title = name;
      b.lastChild.textContent = name;
      b.addEventListener('click', () => { S.pal = name; S.colors = PALETTES[name].slice(); applyColors(); });
      el.appendChild(b);
    }
  }
  function syncAll() {
    pressed('[data-mirror]', b => b.dataset.mirror === S.mirror);
    drawMirrorIcon();
    pressed('[data-tool]', b => b.dataset.tool === S.tool);
    $('bSound').setAttribute('aria-pressed', S.sound ? 'true' : 'false');
  }
  document.querySelectorAll('[data-mirror]').forEach(b => b.addEventListener('click', () => { S.mirror = S.lastMirror = b.dataset.mirror; syncAll(); }));
  document.querySelectorAll('[data-tool]').forEach(b => b.addEventListener('click', () => { S.tool = b.dataset.tool; syncAll(); }));
  function setRug(kw) {
    kw = Math.max(61, Math.min(161, kw)); if (kw % 2 === 0) kw++;
    if (kw === S.kw) return;
    const oldW = D.W, oldH = D.H;
    S.kw = kw;
    const nd = dims(), dx = (nd.W - oldW) / 2, dy = (nd.H - oldH) / 2;
    S.stamps = S.stamps.map(s => ({ ...s, x: Math.round(s.x + dx), y: Math.round(s.y + dy) }));
    D = nd;
    resetRug();
  }
  function setTile(k) { S.k = Math.max(1, Math.min(6, k)); status(); if (typeof drawXf === 'function') drawXf(); if (!rafOn) draw(); }
  $('tileDn').addEventListener('click', () => setTile(S.k - 1));
  $('tileUp').addEventListener('click', () => setTile(S.k + 1));
  $('rugDn').addEventListener('click', () => setRug(S.kw - 10));
  $('rugUp').addEventListener('click', () => setRug(S.kw + 10));
  // drag sideways on a value to scrub it
  function scrubber(el, get, set, px) {
    el.addEventListener('pointerdown', e => {
      e.preventDefault(); el.setPointerCapture(e.pointerId); el.classList.add('active');
      const x0 = e.clientX, v0 = get();
      const mv = ev => set(v0 + Math.round((ev.clientX - x0) / px));
      const upf = () => { el.classList.remove('active'); el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', upf); el.removeEventListener('pointercancel', upf); };
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', upf); el.addEventListener('pointercancel', upf);
    });
  }
  scrubber($('tileVal'), () => S.k, setTile, 24);
  scrubber($('rugVal'), () => S.kw, v => setRug(v % 2 ? v : v + 1), 3);
  $('bUndo').addEventListener('click', undo);
  $('bRedo').addEventListener('click', redo);
  $('bClear').addEventListener('click', () => { if (!S.stamps.length) { hint('Nothing painted yet.'); return; } pushUndo(); S.stamps = []; XS.curId = null; refresh(null); hint('Cleared. Undo brings it back.'); });
  $('bSound').addEventListener('click', () => { S.sound = !S.sound; ensureAudio(); syncAll(); });
  $('zIn').addEventListener('click', () => zoomAt(cw / 2, ch / 2, 1.25));
  $('zOut').addEventListener('click', () => zoomAt(cw / 2, ch / 2, 0.8));
  $('zFit').addEventListener('click', fitView);

  // ---------- export: copy, or save as PNG / JPEG ----------
  function renderExport() {
    const c = Math.max(4, Math.min(14, Math.floor(1400 / D.W)));
    const FR = fringe(), rows = D.H + 2 * (FR + KILIM), m = 70;
    const oc = document.createElement('canvas');
    oc.width = D.W * c + m * 2; oc.height = rows * c + m * 2;
    const g2 = oc.getContext('2d');
    g2.fillStyle = S.bg || THEME.canvas; g2.fillRect(0, 0, oc.width, oc.height);
    paintRug(g2, c, m, m + (FR + KILIM) * c);
    return oc;
  }
  const toBlob = (cv, type, q) => new Promise((res, rej) => cv.toBlob(b => b ? res(b) : rej(new Error('encode')), type, q));
  let downloadsNs;   // undefined until asked, then the namespace or null
  const getDownloads = async () => {
    if (downloadsNs === undefined) downloadsNs = window.claude && claude.use ? await claude.use('downloads').catch(() => null) : null;
    return downloadsNs;
  };
  function flash(btn, text) {
    const label = btn.firstElementChild, was = btn.dataset.label || (btn.dataset.label = label.textContent);
    label.textContent = text; clearTimeout(btn._t); btn._t = setTimeout(() => { label.textContent = was; }, 1800);
  }
  function showOverlay(cv) { $('outImg').src = cv.toDataURL('image/png'); $('ov').hidden = false; }
  const stamp = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`; };
  document.querySelectorAll('[data-ex]').forEach(btn => btn.addEventListener('click', async () => {
    const kind = btn.dataset.ex, cv = renderExport();
    if (kind === 'copy') {
      try {
        if (!navigator.clipboard || !window.ClipboardItem) throw new Error('no clipboard');
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': toBlob(cv, 'image/png') })]);
        flash(btn, 'Copied ✓'); setTimeout(closeFly, 700);
      } catch (e) { flash(btn, 'Copy blocked'); closeFly(); showOverlay(cv); }
      return;
    }
    const jpeg = kind === 'jpeg', blob = await toBlob(cv, jpeg ? 'image/jpeg' : 'image/png', 0.92);
    const dl = await getDownloads();
    if (!dl) {
      // outside claude.ai (e.g. GitHub Pages): a plain browser download
      try { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `rug-${stamp()}.${jpeg ? 'jpg' : 'png'}`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); flash(btn, '✓'); setTimeout(closeFly, 700); }
      catch (e) { closeFly(); showOverlay(cv); }
      return;
    }
    flash(btn, '…');
    try { await dl.save({ filename: `rug-${stamp()}.${jpeg ? 'jpg' : 'png'}`, data: blob }); flash(btn, '✓'); setTimeout(closeFly, 700); }
    catch (e) {
      const code = e && e.code;
      if (code === 'declined') flash(btn, '×');
      else if (code === 'rate_limited') flash(btn, '…');
      else { closeFly(); showOverlay(cv); }
    }
  }));
  $('bClose').addEventListener('click', () => { $('ov').hidden = true; });
  $('bCopyImg').addEventListener('click', e => {
    const btn = e.currentTarget, say = t => { btn.textContent = t; setTimeout(() => btn.textContent = 'Copy image', 2200); };
    fetch($('outImg').src).then(r => r.blob()).then(b => navigator.clipboard.write([new ClipboardItem({ 'image/png': b })])).then(() => say('Copied'), () => say('Copy blocked'));
  });

  // ---------- your collection: saved rugs ----------
  // Saved per person in the artifact's private store (data/users/<you>/…); falls back to this browser when that isn't available.
  const XS = { db: null, col: null, local: false, rugs: [], curId: null, ready: false, busy: false };
  const LS_KEY = 'loom-rugs';
  const lsRead = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch (e) { return []; } };
  const lsWrite = list => { try { localStorage.setItem(LS_KEY, JSON.stringify(list)); return true; } catch (e) { return false; } };
  function rugThumb() {
    const c = 2, FR = fringe(), rows = D.H + 2 * (FR + KILIM), m = 6;
    const oc = document.createElement('canvas'); oc.width = D.W * c + m * 2; oc.height = rows * c + m * 2;
    const g2 = oc.getContext('2d'); g2.fillStyle = S.bg || THEME.canvas; g2.fillRect(0, 0, oc.width, oc.height);
    paintRug(g2, c, m, m + (FR + KILIM) * c);
    return oc.toDataURL('image/jpeg', 0.82);
  }
  const rugData = () => ({ bg: S.bg, fringe: S.fringe, kw: S.kw, mirror: S.mirror, pal: S.pal, colors: S.colors.slice(), stamps: S.stamps.map(s => ({ ...s })), thumb: rugThumb(), savedAt: Date.now() });
  function renderColl() {
    const el = $('coll'); el.textContent = '';
    $('saveNow').firstElementChild.textContent = XS.curId ? 'Save changes' : 'Save Carpet';
    $('saveCopy').hidden = !XS.curId;
    if (!XS.ready) { el.innerHTML = '<div class="empty">Loading…</div>'; return; }
    if (!XS.rugs.length) { el.innerHTML = `<div class="empty"><b>Create a collection</b>${XS.local ? 'Saved locally in your browser' : 'Saved privately to your account'}</div>`; return; }
    for (const r of XS.rugs.slice().reverse()) {
      const b = document.createElement('div'); b.className = 'rug'; b.tabIndex = 0; b.setAttribute('role', 'button');
      const when = new Date(r.savedAt || 0).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      b.title = 'Open · saved ' + when; b.setAttribute('aria-label', 'Open rug saved ' + when);
      if (r.id === XS.curId) b.setAttribute('aria-current', 'true');
      const im = document.createElement('img'); im.alt = ''; im.src = r.thumb || ''; b.appendChild(im);
      const x = document.createElement('button'); x.type = 'button'; x.className = 'del'; x.setAttribute('aria-label', 'Delete this rug'); x.title = 'Delete'; x.textContent = '×';
      // two-step delete: first click arms it, second click deletes (dialogs are blocked inside the page)
      x.addEventListener('click', ev => {
        ev.stopPropagation();
        if (x.classList.contains('arm')) { deleteRug(r.id); return; }
        x.classList.add('arm'); x.textContent = 'Delete?'; x.title = 'Click again to delete';
        clearTimeout(x._t); x._t = setTimeout(() => { x.classList.remove('arm'); x.textContent = '×'; x.title = 'Delete'; }, 2500);
      });
      b.appendChild(x);
      const open = () => loadRug(r);
      b.addEventListener('click', open); b.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(); } });
      el.appendChild(b);
    }
  }
  function scrollCollEnd() { requestAnimationFrame(() => { const el = $('coll'); el.scrollTop = el.scrollHeight; }); }
  function setRugs(list) { XS.rugs = list.slice().sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)); XS.ready = true; renderColl(); scrollCollEnd(); }
  function note(text) { const n = $('collNote'); n.textContent = text || ''; n.hidden = !text; }
  async function initCollection() {
    let db = null, user = null;
    try { if (window.claude && claude.use) [db, user] = await Promise.all([claude.use('db'), claude.use('user')]); } catch (e) {}
    let uid = null; try { uid = user ? await user.id() : null; } catch (e) {}
    if (db && uid) {
      XS.db = db; XS.col = db.collection('data/users/' + uid);
      XS.col.onSnapshot(snap => setRugs(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        () => { XS.col = null; XS.local = true; setRugs(lsRead()); note(''); });
    } else { XS.local = true; setRugs(lsRead()); note(''); }
  }
  async function saveRug(asNew) {
    if (XS.busy) return; XS.busy = true;
    const btn = asNew ? $('saveCopy') : $('saveNow'), label = btn.firstElementChild, was = label.textContent;
    const say = t => { label.textContent = t; clearTimeout(btn._t); btn._t = setTimeout(() => { label.textContent = XS.curId && !asNew ? 'Save changes' : was; renderColl(); }, 1500); };
    const data = rugData(), id = (!asNew && XS.curId) || ('rug-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    try {
      if (XS.col) await XS.col.doc(id).set(data);
      else { const list = lsRead().filter(r => r.id !== id); list.push({ id, ...data }); if (!lsWrite(list)) throw { code: 'quota_exceeded' }; setRugs(list); }
      XS.curId = id; say('Saved ✓'); hint('Saved to your collection.');
    } catch (e) {
      say(e && e.code === 'quota_exceeded' ? 'Collection full' : 'Couldn’t save');
    } finally { XS.busy = false; }
  }
  async function deleteRug(id) {
    try {
      if (XS.col) await XS.col.doc(id).delete();
      else { const list = lsRead().filter(r => r.id !== id); lsWrite(list); setRugs(list); }
      if (XS.curId === id) XS.curId = null;
      renderColl();
    } catch (e) { note('Couldn’t delete just now.'); }
  }
  function loadRug(r) {
    if (!r || !Array.isArray(r.stamps)) return;
    if (r.bg) S.bg = r.bg;
    if (r.fringe) S.fringe = r.fringe;
    S.kw = r.kw || S.kw; S.mirror = r.mirror || S.mirror; S.pal = r.pal || 'Your colours';
    if (Array.isArray(r.colors) && r.colors.length === S.colors.length) S.colors = r.colors.slice();
    S.stamps = r.stamps.filter(s => LIB[s.m]).map(s => ({ ...s }));
    gidN = S.stamps.reduce((m, s) => Math.max(m, (s.gid || 0) + 1), 1);
    undoStack.length = 0; redoStack.length = 0;
    XS.curId = r.id; closeFly(); if (window.matchMedia('(max-width: 700px)').matches) setSide('saved');
    resetRug(true); applyColors(); syncAll();
  }
  $('saveNow').addEventListener('click', () => saveRug(false));
  $('saveCopy').addEventListener('click', () => saveRug(true));
  $('bSaved').addEventListener('click', () => { closeFly(); setSide('saved'); });
  initCollection();

  // ---------- motif transform: R / T rotate, + / − size ----------
  function drawXf() {}
  function rotate(dir) { S.rot = (((S.rot || 0) + dir) % 4 + 4) % 4; paintCurrent(); if (!rafOn) draw(); }
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeInfo(); }, true);
  document.addEventListener('pointerdown', e => {
    if (!$('infoPop').hidden && !$('infoPop').contains(e.target) && !$('infoBtn').contains(e.target)) closeInfo();
    // the collection panel closes on any click outside it
    if ($('side').dataset.show === 'saved' && !$('collection').contains(e.target) && !$('bSaved').contains(e.target)) setSide('saved');
  }, true);
  // info popup
  function closeInfo() { $('infoPop').hidden = true; $('infoBtn').setAttribute('aria-expanded', 'false'); }
  $('infoBtn').addEventListener('click', () => { const open = $('infoPop').hidden; $('infoPop').hidden = !open; $('infoBtn').setAttribute('aria-expanded', String(open)); });

  // ---------- start ----------
  function resetRug(animate) {
    allocKnots(); palRGB = S.colors.map(hexRgb);
    S.stamps = S.stamps.filter(s => s.x < D.W && s.y < D.H);
    build();
    if (animate) { shown.fill(F); repaintAll(); schedule(null); } else { shown.set(grid); repaintAll(); }
    syncAll(); fitView(); status();
  }
  function seedRug() {}
  new ResizeObserver(() => { const keep = Math.abs(V.s - V.fit) < 1e-6; resize(); if (keep || !grid) fitView(); else draw(); }).observe(viewEl);
  renderLib(); renderPals(); renderMine();
  allocKnots(); palRGB = S.colors.map(hexRgb);
  seedRug(); build(); shown.set(grid); repaintAll();
  readTheme(); setTheme(document.documentElement.dataset.theme);
  syncAll(); resize(); fitView(); status();
  selectMotif(S.motif, true);
})();
