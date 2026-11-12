// Crafty Carpets — motif library
// Every motif is an 11 × 11 grid of colour roles:
//   -1 empty · 0 base · 1 band · 2 line · 3 accent A · 4 accent B · 5 accent C
// Hand-drawn motifs live in HAND, FIGURES and TRIANGLES (one string per row,
//   '.' empty · k line · a accent A · b accent B · w accent C · f base).
// The rest are generated per style from STYLE_RULES.
// Exposes one global, `Motifs`, with { LIB, PALETTES, FRINGES }.

const Motifs = (() => {
  const T = 11, PER_STYLE = 48;
  const F = 0, BD = 1, DK = 2, A1 = 3, A2 = 4, LT = 5;

  // ---------- dyes: field · border · outline · accent A · accent B · ivory ----------
  const PALETTES = {
    'Kilim':           ['#c5432c', '#e2ac45', '#2a1c16', '#2c6b8b', '#6c8d39', '#f2e7cf'],
    'Kazak':           ['#2c4c7d', '#a8322a', '#151515', '#e0b13c', '#4f7a3c', '#efe6d2'],
    'Turkmen':         ['#6b1716', '#3a1111', '#170d0c', '#c9b59a', '#2a3b62', '#e6d9bf'],
    'Baluch':          ['#3b2233', '#6e2a24', '#120b10', '#b0562e', '#2d3f66', '#e7dcc6'],
    'Madder & indigo': ['#8f1f1c', '#1e2b57', '#191312', '#d9a441', '#3d6a4c', '#efe2c6'],
    'Beni Ourain':     ['#ebe3d1', '#ddd2bb', '#2b2521', '#b5402f', '#c99a3a', '#faf6ee'],
    'Azilal':          ['#f0e8d8', '#d94f3d', '#1f1a17', '#2f5fa8', '#e2a62f', '#ffffff'],
    'Dhurrie':         ['#2e3a6e', '#e3a72f', '#141a33', '#b8432f', '#4a7a5a', '#f1e9d6'],
    'Chinese':         ['#1f3a5a', '#e8dcc0', '#0e1b2b', '#c9a648', '#8f2d2a', '#f2ead8'],
    'Tibetan':         ['#c2602e', '#1f3550', '#1a1210', '#e7b54a', '#2f6b5c', '#f3e6cc'],
    'Nordic':          ['#f1ede2', '#1d2b4a', '#141c30', '#b33a2e', '#2e5a7a', '#ffffff'],
    'Andean':          ['#b3322b', '#1c1c1c', '#0f0f0f', '#e07a2a', '#2f7d5a', '#f4ead8'],
    'Balkan':          ['#2a2523', '#a52d27', '#0f0c0b', '#d9a03a', '#4f7d3d', '#efe5d0'],
    'Gabbeh':          ['#c58b2e', '#7a4a22', '#3a2416', '#9c3b26', '#3f6c6a', '#efe3c8'],
    'Bauhaus':         ['#f1ede4', '#151515', '#000000', '#d13b26', '#2850c8', '#f2c12e'],
    'Art Deco':        ['#1c3b3a', '#c8a24a', '#0b1414', '#e9d8a6', '#c4614a', '#f6efdc'],
    'Op Art':          ['#f4f4f0', '#111111', '#000000', '#e23b2e', '#111111', '#ffffff'],
    'Mid-century':     ['#e8dcc4', '#2f5d62', '#1d1d1b', '#d9822b', '#2f5d62', '#f7f1e3'],
    'Suzani':          ['#efe3c8', '#b0302b', '#1e1714', '#2b4f7a', '#d9a63e', '#f7efdc'],
    'Ikat':            ['#2a2f5b', '#c2452f', '#120f1d', '#e4b44a', '#3c8a7f', '#f2e8d4'],
    'Ottoman':         ['#7d1f22', '#c99a3a', '#1a0f0f', '#1f4f5c', '#e9d9b5', '#f6eedc'],
    'Sami':            ['#1f3f8a', '#c7322b', '#0f1630', '#f2c23a', '#2d7a4f', '#f4efe4'],
    'Navajo':          ['#c94a2a', '#2a2420', '#141010', '#e9dcc4', '#7a7570', '#f6efe2'],
    'Moroccan blue':   ['#24508f', '#e8dcc0', '#0f1a33', '#d8a33b', '#c4492f', '#f7f1e3'],
    'Sage & rust':     ['#8fa48a', '#b4552e', '#2b2a24', '#e3c78e', '#4c6157', '#f1ebdc'],
    'Saffron':         ['#e2a12f', '#7a2e22', '#2a1a12', '#2d5a6e', '#c25b2c', '#f6ecd4'],
    'Midnight':        ['#141a2e', '#3b4a7a', '#0a0d17', '#d8b25a', '#9a3d3d', '#e9e2d0'],
    'Terracotta':      ['#b85c3c', '#e6cfa8', '#2e1c16', '#3e5f63', '#d9933a', '#f5ebd8'],
    'Pastel':          ['#e9dfcf', '#b9c9d8', '#4a4540', '#e7a99a', '#a9c7a6', '#fbf6ee'],
    'Mono warm':       ['#2b2724', '#4a433d', '#141210', '#bfb3a2', '#7b6f62', '#ece4d6'],
    'Indigo':          ['#1d2a4f', '#33497d', '#0b1126', '#e8e0cc', '#8fa9c9', '#f4f0e6'],
    'Forest':          ['#2f4a35', '#a8462c', '#121a14', '#d9b562', '#6f8f5a', '#efe6cf'],
    'Rose':            ['#c97f86', '#5a2c35', '#2a1418', '#e9c9a8', '#6f8f8a', '#f8eee6']
  };


  // fringe (warp threads) per preset — mostly undyed wool, dark where the palette calls for it
  const FRINGES = {
    'Kilim': '#efe4cc', 'Kazak': '#ebe1cc', 'Turkmen': '#ddcfb4', 'Baluch': '#dccfb6', 'Madder & indigo': '#ece0c6',
    'Beni Ourain': '#f3ede0', 'Azilal': '#f3ece0', 'Dhurrie': '#ece3d0', 'Chinese': '#eee5d2', 'Tibetan': '#ecdfc5',
    'Nordic': '#f2eee6', 'Andean': '#1c1c1c', 'Balkan': '#e8dcc6', 'Gabbeh': '#e6d6b8', 'Bauhaus': '#151515',
    'Art Deco': '#e9d8a6', 'Op Art': '#111111', 'Mid-century': '#e8dcc4'
  };

  // ---------- motif grammar ----------
  const SH = {
    diamond: (ax, ay, r) => ax + ay <= r,
    square: (ax, ay, r) => Math.max(ax, ay) <= r,
    octagon: (ax, ay, r) => Math.max(ax, ay, Math.round((ax + ay) * 0.72)) <= r,
    circle: (ax, ay, r) => Math.hypot(ax, ay) <= r + 0.35,
    star: (ax, ay, r) => ax + ay <= r || Math.max(ax, ay) <= Math.round(r * 0.62),
    plus: (ax, ay, r) => Math.max(ax, ay) <= r && Math.min(ax, ay) <= Math.max(1, Math.round(r / 3)),
    saltire: (ax, ay, r) => Math.max(ax, ay) <= r && Math.abs(ax - ay) <= 1,
    stepped: (ax, ay, r) => Math.floor(ax / 2) + Math.floor(ay / 2) <= Math.floor(r / 2) && ax + ay <= r + 1,
    petal: (ax, ay, r) => Math.hypot(ax - r * 0.55, ay) <= r * 0.5 || Math.hypot(ax, ay - r * 0.55) <= r * 0.5 || ax + ay <= 1,
    chakana: (ax, ay, r) => { const hi = Math.max(ax, ay), lo = Math.min(ax, ay), arm = Math.max(1, Math.round(r * 0.35)); return hi <= r && (lo <= arm || hi <= r - arm); },
    terrace: (ax, ay, r) => Math.max(ax, ay) <= r && ax + ay <= r + Math.ceil(r / 2)
  };
  const METRIC = {
    diamond: (ax, ay) => ax + ay, stepped: (ax, ay) => ax + ay, square: (ax, ay) => Math.max(ax, ay), terrace: (ax, ay) => Math.max(ax, ay),
    circle: (ax, ay) => Math.round(Math.hypot(ax, ay)), octagon: (ax, ay) => Math.max(ax, ay, Math.round((ax + ay) * 0.72))
  };
  const NAME = { diamond: 'diamond', square: 'square', octagon: 'octagon', circle: 'roundel', star: 'star', plus: 'cross', saltire: 'saltire', stepped: 'stepped diamond', petal: 'quatrefoil', chakana: 'stepped cross', terrace: 'stepped square' };

  const STYLE_RULES = {
    'Anatolian':   { pal: 'Kilim', shapes: { diamond: 4, stepped: 3, star: 2, plus: 1, saltire: 1 }, hooks: 0.5, tips: 0.3, line: 0.08 },
    'Caucasian':   { pal: 'Kazak', shapes: { star: 4, octagon: 2, plus: 2, square: 2, diamond: 2 }, hooks: 0.35, tips: 0.25 },
    'Turkmen':     { pal: 'Turkmen', shapes: { octagon: 5, diamond: 2, square: 1 }, quarter: 0.7, hooks: 0.25 },
    'Baluch':      { pal: 'Baluch', shapes: { diamond: 3, octagon: 2, stepped: 2, star: 1 }, hooks: 0.35, quarter: 0.2 },
    'Persian':     { pal: 'Madder & indigo', shapes: { octagon: 3, circle: 2, petal: 3, star: 1 }, hooks: 0.08, dots: 0.35 },
    'Moroccan':    { pal: 'Beni Ourain', shapes: { diamond: 5, stepped: 2, saltire: 2, square: 1 }, line: 0.9, dots: 0.3 },
    'Azilal':      { pal: 'Azilal', shapes: { diamond: 4, stepped: 2, saltire: 1, square: 1 }, line: 0.5, dots: 0.4 },
    'Indian':      { pal: 'Dhurrie', shapes: { diamond: 3, square: 2, plus: 1, stepped: 1 }, bands: 0.5, tips: 0.2 },
    'Chinese':     { pal: 'Chinese', shapes: { circle: 4, square: 2, octagon: 2, petal: 2 }, line: 0.3, bands: 0.2 },
    'Tibetan':     { pal: 'Tibetan', shapes: { circle: 2, square: 2, saltire: 2, plus: 2, petal: 1 }, bands: 0.2 },
    'Nordic':      { pal: 'Nordic', shapes: { star: 4, saltire: 2, diamond: 3, plus: 2, stepped: 2 }, line: 0.35, dots: 0.3 },
    'Andean':      { pal: 'Andean', shapes: { stepped: 4, chakana: 3, diamond: 2, terrace: 2 }, bands: 0.3 },
    'Balkan':      { pal: 'Balkan', shapes: { diamond: 3, petal: 2, star: 2, plus: 2 }, hooks: 0.3, tips: 0.3 },
    'Gabbeh':      { pal: 'Gabbeh', shapes: { square: 2, diamond: 2, stepped: 1 }, line: 0.25, simple: true },
    'Bauhaus':     { pal: 'Bauhaus', shapes: { circle: 3, square: 3, plus: 1 }, bands: 0.4, simple: true },
    'Art Deco':    { pal: 'Art Deco', shapes: { terrace: 4, circle: 2, octagon: 2, stepped: 1 }, bands: 0.55 },
    'Op Art':      { pal: 'Op Art', shapes: { circle: 3, square: 3, diamond: 2 }, bands: 0.9, simple: true },
    'Mid-century': { pal: 'Mid-century', shapes: { circle: 3, petal: 2, diamond: 1, plus: 1 }, simple: true, dots: 0.3 }
  };

  // ---------- hand-drawn motifs (q: quarter mirrored 4 ways · h: left half · f: full · fn: function) ----------
  const HAND = {
    'Anatolian': [
      { n: 'Göz', d: 'the eye; wards off the evil eye', q: ['.....k', '....ka', '...kaw', '..kawk', '.kawka', 'kawkaw'] },
      { n: 'Elibelinde', d: 'hands on hips; motherhood', h: ['......', 'kk....', 'k.....', 'k..kkk', 'kk.kaa', '.kkkaa', '...kaa', '..kkaa', '.kaaaa', 'kkkkkk', '......'] },
      { n: 'Koçboynuzu', d: 'ram’s horn; strength', q: ['.kkk..', 'k...k.', 'k.k.k.', 'k.kk..', '.k...a', '....aa'] },
      { n: 'Yıldız', d: 'star; happiness', q: ['.....k', '....ka', '..kkaa', '..kaaa', '.kaaww', 'kaawww'] },
      { n: 'Bereket', d: 'fertility; abundance', q: ['....kk', '.....k', '....kb', '...kbw', 'k.kbwb', 'kkbwba'] },
      { n: 'Muska', d: 'amulet; protection', h: ['.....k', '....ka', '...kaa', '..kaaw', '.kaaww', 'kkkkkk', '.k...k', '.k...k', '.b...b', 'bbb.bb', '......'] },
      { n: 'Kurt ağzı', d: 'wolf’s mouth; guards the flock', q: ['kkkkkk', 'kk.k.k', 'k.....', 'kk...a', 'k...ab', 'kk.abw'] },
      { n: 'Akrep', d: 'scorpion; protection', q: ['kk....', 'k.k...', '...k..', '....kk', '....ka', '...kaw'] },
      { n: 'Su yolu', d: 'water path; life goes on', q: ['......', 'b...b.', '.b.b.b', '..b...', '......', 'kkkkkk'] },
      { n: 'Pıtrak', d: 'burr; wards off evil', q: ['k....a', '.k...a', '..k..a', '...k.a', '....kw', 'aaaaww'] },
      { n: 'Saç bağı', d: 'hair band; wish to marry', q: ['bb....', 'bbb...', '.bbb..', '..bbb.', '...bbk', '....kw'] },
      { n: 'Hayat ağacı', d: 'tree of life', h: ['.....b', '....bk', '...b.k', '..bbbk', '....bk', '..b..k', '.bbbbk', '...b.k', 'bbbbbk', '.....k', '...aaa'] }
    ],
    'Caucasian': [
      { n: 'Lesghi star', d: 'Daghestan star', q: ['...k..', '...kk.', '.kkaak', '..kaaa', 'kkaabb', '.kaabw'] },
      { n: 'Kazak cross', d: 'stepped cross', f: ['...kkkkk...', '...kaaak...', '...kaaak...', 'kkkkaaakkkk', 'kaaaawaaaak', 'kaaawwwaaak', 'kaaaawaaaak', 'kkkkaaakkkk', '...kaaak...', '...kaaak...', '...kkkkk...'] },
      { n: 'Memling gul', d: 'hooked octagon', q: ['..kkkk', '.k....', 'k..kk.', 'k.k..b', 'k.k.bb', 'k...bw'] },
      { n: 'Crab', d: 'border crab', q: ['k.k...', '.kk...', 'kkkk..', '...k.k', '....ka', '...kaw'] },
      { n: 'Sunburst', d: 'Chelaberd sun', q: ['a.a.aa', '.kkkkk', 'ak....', '.k.bbb', 'ak.bww', 'ak.bwa'] },
      { n: 'Tarak', d: 'comb; marriage', h: ['......', '....kk', '....kk', 'bbbbbb', 'kkkkkk', 'k.k.k.', 'k.k.k.', 'k.k.k.', 'a.a.a.', '......', '......'] },
      { n: 'Rosette', d: 'stepped rosette', q: ['...kkk', '..kaaa', '.kabbb', 'kabwww', 'kabwkk', 'kabwkb'] },
      { n: 'Kochak', d: 'ram’s horn cross', q: ['...kka', '...k.a', '.....a', 'kk...a', 'k....a', 'aaaaaw'] },
      { n: 'Medallion', d: 'Kazak medallion', q: ['..kkkk', '.kbbbb', 'kbbkkk', 'kbkaaa', 'kbkaww', 'kbkawa'] },
      { n: 'Boxed star', d: 'star in a frame', q: ['kkkkkk', 'k....a', 'k...aa', 'k..aaa', 'k.aaaw', 'k.aaww'] }
    ],
    'Turkmen': [
      { n: 'Tekke gul', d: 'quartered octagon', q: ['..kkkk', '.kaaak', 'kaabbk', 'kabwbk', 'kaabbk', 'kkkkkw'] },
      { n: 'Salor gul', d: 'lobed gul', q: ['k..kkk', '.kkaaa', '.kaaab', 'kaabwb', 'kaaabb', 'kaaabw'] },
      { n: 'Chuval gul', d: 'bag-face gul', q: ['...kkk', '..kwww', '.kwbbb', 'kwbaaa', 'kwbakk', 'kwbakw'] },
      { n: 'Ashik', d: 'serrated leaf', q: ['.....k', '....kw', '..kkww', '...kwa', '.kkwaa', 'kkwaab'] },
      { n: 'Kepse gul', d: 'spiked diamond', q: ['....k.', '.....k', '..k.kb', '...kbb', 'k.kbaa', '.kbbaw'] },
      { n: 'Gülli gul', d: 'flower gul', q: ['...kkk', '.kk...', '.k.b.b', 'k.bbkk', 'k..kaa', 'k.bkaw'] },
      { n: 'Elem', d: 'panel stripes', q: ['akbkak', 'akbkak', 'akbkak', 'akbkak', 'akbkak', 'akbkak'] },
      { n: 'Dyrnak gul', d: 'comb gul', q: ['k.k.k.', 'kkkkkk', 'kaaaaa', 'kabbba', 'kabwww', 'kabwwa'] }
    ],
    'Persian': [
      { n: 'Boteh', d: 'paisley', f: ['........kk.', '.......k..k', '.....kkk..k', '....kaaak.k', '...kaabbak.', '..kaabwbak.', '.kaabbbbak.', '.kaaaaaaak.', '.kaaaaaak..', '..kaaaak...', '...kkkk....'] },
      { n: 'Herati', d: 'rosette and leaves', q: ['kk....', 'kbk...', '.kbk..', '..k.kk', '....ka', '...kaw'] },
      { n: 'Palmette', d: 'fan flower', h: ['..a..a', '...a.a', '.a..aa', '..aaaa', 'kkkkkk', '.kbbbb', '..kbww', '...kbw', '....kb', '.....k', '......'] },
      { n: 'Cypress', d: 'sarv tree', h: ['.....b', '....bb', '....bb', '...bbb', '...bbb', '..bbbb', '..bbbb', '.bbbbb', '.bbbbb', '.....k', '...kkk'] },
      { n: 'Saz leaf', d: 'curved leaf', f: ['........kk.', '.......kbk.', '......kbbk.', '.....kbbk..', '....kbbk...', '...kbbk....', '..kbbk.....', '.kbbk......', '.kbk.......', '.kk........', 'k..........'] },
      { n: 'Shah Abbasi', d: 'palmette blossom', q: ['...kkk', '..kaaa', '.kaakk', 'kaak.b', 'kak.bb', 'kakbbw'] },
      { n: 'Mina khani', d: 'flower lattice', q: ['ak....', 'k.....', '......', '......', '.....k', '....kw'] }
    ],
    'Azilal': [
      { n: 'Lozenge', d: 'solid diamond with corner dots', q: ['a....k', '....kk', '...kkk', '..kkkk', '.kkkkk', 'kkkkkk'] }
    ],
    'Moroccan': [
      { n: 'Lozenge', d: 'Beni Ourain diamond', q: ['.....k', '....k.', '...k..', '..k...', '.k....', 'k.....'] },
      { n: 'Double lozenge', d: 'nested diamond', q: ['.....k', '....k.', '...k..', '..k..k', '.k..k.', 'k..k..'] },
      { n: 'Net', d: 'woven net', q: ['k.k.k.', '.k.k.k', 'k.k.k.', '.k.k.k', 'k.k.k.', '.k.k.k'] },
      { n: 'Zigzag', d: 'river lines', q: ['k...k.', '.k.k.k', '..k...', '......', '......', '......'] },
      { n: 'Ladder', d: 'fringe ladder', q: ['k.....', 'kk....', 'k.....', 'kk....', 'k.....', 'kk....'] }
    ],
    'Chinese': [
      { n: 'Hui wen', d: 'key fret; endless return', f: ['kkkkkkkkkkk', '..........k', 'kkkkkkkkk.k', 'k.......k.k', 'k.kkkkk.k.k', 'k.k...k.k.k', 'k.k.kkk.k.k', 'k.k.....k.k', 'k.kkkkkkk.k', 'k.........k', 'kkkkkkkkkkk'] }
    ],
    'Nordic': [
      { n: 'Heart', d: 'folk heart', h: ['......', '.kk...', 'kaak..', 'kaaakk', 'kaaaaa', '.kaaaa', '..kaaa', '...kaa', '....ka', '.....k', '......'] },
      { n: 'Selbu rose', d: 'eight-petal knitting star', f: ['k....k....k', '.k..kkk..k.', '..k.kkk.k..', '...kkkkk...', '.kkkkwkkkk.', 'kkkkwwwkkkk', '.kkkkwkkkk.', '...kkkkk...', '..k.kkk.k..', '.k..kkk..k.', 'k....k....k'] }
    ],
    'Andean': [
      { n: 'Chakana', d: 'stepped Andean cross', q: ['...kkk', '...kaa', 'kkkkaa', 'kaaaaa', 'kaaaww', 'kaaawf'] }
    ],
    'Bauhaus': [
      { n: 'Quarter', d: 'quarter circle', fn: (x, y) => Math.hypot(x + 0.5, y + 0.5) <= 10.8 ? 'b' : '.' },
      { n: 'Half square', d: 'split diagonal', fn: (x, y) => x > y ? 'a' : x === y ? 'k' : 'b' },
      { n: 'Bars', d: 'vertical bars', fn: (x) => Math.floor(x / 2) % 2 ? 'b' : '.' },
      { n: 'Checker', d: 'two-knot check', fn: (x, y) => (Math.floor(x / 2) + Math.floor(y / 2)) % 2 ? 'k' : 'w' },
      { n: 'Stair', d: 'stepped corner', f: ['kkkkkkkkkkk', 'kkkkkkkkkkk', 'kkkkkkkkk..', 'kkkkkkkkk..', 'kkkkkkk....', 'kkkkkkk....', 'kkkkk......', 'kkkkk......', 'kkk........', 'kkk........', 'k..........'] },
      { n: 'Arch', d: 'rainbow arch', fn: (x, y) => { const d = Math.hypot(x - 5, y - 5.5); if (y >= 6) return Math.abs(x - 5) >= 3 && Math.abs(x - 5) <= 5 ? 'a' : '.'; return d <= 5.3 && d >= 2.6 ? 'a' : '.'; } }
    ],
    'Art Deco': [
      { n: 'Fan', d: 'sunrise fan', fn: (x, y) => { const d = Math.hypot(x - 5, y - 10); if (d > 10.3) return '.'; return Math.floor(d / 2) % 2 ? 'a' : (d < 2.5 ? 'w' : 'k'); } },
      { n: 'Ziggurat', d: 'stepped tower', fn: (x, y) => Math.abs(x - 5) <= Math.floor(y / 2) + 0 ? (y % 2 ? 'a' : 'k') : '.' }
    ],
    'Op Art': [
      { n: 'Target', d: 'concentric rings', fn: (x, y) => Math.round(Math.hypot(x - 5, y - 5)) % 2 ? 'k' : 'w' },
      { n: 'Moiré', d: 'diagonal moiré', fn: (x, y) => (x * y) % 3 === 0 ? 'k' : 'w' }
    ]
  };
  const ROLE = { '.': -1, k: DK, a: A1, b: A2, w: LT, d: BD, f: F };

  function strHash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function fromHand(m) {
    const px = new Int8Array(T * T);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      let ch;
      if (m.q) ch = m.q[Math.min(y, 10 - y)][Math.min(x, 10 - x)];
      else if (m.h) ch = m.h[y][Math.min(x, 10 - x)];
      else if (m.f) ch = m.f[y][x];
      else ch = m.fn(x, y);
      px[y * T + x] = ROLE[ch] ?? -1;
    }
    return px;
  }

  function generate(style, rule, i) {
    const rnd = mulberry(strHash(style) + i * 7919);
    const keys = Object.keys(rule.shapes), total = keys.reduce((s, k) => s + rule.shapes[k], 0);
    const pickShape = () => { let v = rnd() * total; for (const k of keys) { v -= rule.shapes[k]; if (v <= 0) return k; } return keys[0]; };
    const roles = ['a', 'b', 'w'];
    const pickRole = not => { const opts = roles.filter(r => r !== not); return opts[Math.floor(rnd() * opts.length)]; };
    const hooks = rnd() < (rule.hooks || 0);
    const R = hooks ? 4 : (rnd() < 0.7 ? 5 : 4);
    const outer = pickShape();
    const layers = [];
    let inner = null, banded = false;
    if (rnd() < (rule.bands || 0) && METRIC[outer]) {
      banded = true;
      const w = rnd() < 0.6 ? 1 : 2, r1 = pickRole(), r2 = rnd() < 0.5 ? 'k' : pickRole(r1);
      layers.push({ s: outer, r: R, mode: 'bands', r1, r2, w });
    } else if (rnd() < (rule.line || 0)) {
      layers.push({ s: outer, r: R, mode: 'ring', role: 'k' });
      if (rnd() < 0.7) { inner = rule.simple ? outer : pickShape(); layers.push({ s: inner, r: R - 2 - (rnd() < 0.4 ? 1 : 0), mode: rnd() < 0.5 ? 'ring' : 'fill', role: rnd() < 0.5 ? 'k' : 'a' }); }
    } else {
      const fr = pickRole();
      layers.push({ s: outer, r: R, mode: 'fill', role: fr });
      if (!rule.simple || rnd() < 0.5) layers.push({ s: outer, r: R, mode: 'ring', role: 'k' });
      let r = R - 1 - (rnd() < 0.5 ? 1 : 0), prev = fr;
      const n = rule.simple ? 1 : 1 + Math.floor(rnd() * 2.4);
      for (let k = 0; k < n && r >= 1; k++) {
        const s = rnd() < 0.5 ? outer : pickShape();
        if (k === 0) inner = s;
        const role = pickRole(prev);
        if (k === 0 && rnd() < (rule.quarter || 0)) layers.push({ s, r, mode: 'quarter', role, role2: pickRole(role) });
        else layers.push({ s, r, mode: 'fill', role });
        if (rnd() < 0.5) layers.push({ s, r, mode: 'ring', role: 'k' });
        prev = role; r -= 1 + (rnd() < 0.6 ? 1 : 0);
      }
    }
    const seed = rnd() < 0.6 ? { r: rnd() < 0.5 ? 0 : 1, role: rnd() < 0.5 ? 'w' : 'k' } : null;
    const tips = !hooks && rnd() < (rule.tips || 0);
    const dots = rnd() < (rule.dots || 0);
    const K = !hooks && !tips && R < 5 ? R / 5 : 1;
    const px = new Int8Array(T * T);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      const dx = x - 5, dy = y - 5, ax = Math.abs(dx), ay = Math.abs(dy), lo = Math.min(ax, ay), hi = Math.max(ax, ay);
      // smaller motifs are drawn on a stretched grid so every one spans the full tile
      const sx = ax * K, sy = ay * K;
      let ch = '.';
      for (const l of layers) {
        const f = SH[l.s];
        if (!f(sx, sy, l.r)) continue;
        if (l.mode === 'fill') ch = l.role;
        else if (l.mode === 'ring') { if (!f(sx + K, sy, l.r) || !f(sx, sy + K, l.r)) ch = l.role; }
        else if (l.mode === 'quarter') ch = (dx === 0 || dy === 0) ? 'k' : ((dx > 0) === (dy > 0) ? l.role : l.role2);
        else if (l.mode === 'bands') ch = Math.floor(METRIC[l.s](sx, sy) / l.w) % 2 ? l.r1 : l.r2;
      }
      if (seed && sx + sy <= seed.r) ch = seed.role;
      if (hooks && hi === R + 1 && lo <= 1) ch = 'k';
      if (hooks && hi === R && lo === 2 && ch === '.') ch = 'k';
      if (tips && lo === 0 && hi > R && hi <= 5) ch = 'k';
      if (dots && ax === 5 && ay === 5) ch = 'a';
      px[y * T + x] = ROLE[ch];
    }
    let name = (hooks ? 'Hooked ' : '') + NAME[outer];
    if (banded) name = 'Banded ' + NAME[outer];
    if (inner && inner !== outer) name += ' with ' + NAME[inner];
    name = name[0].toUpperCase() + name.slice(1);
    return { n: name, d: `${style} variation ${i + 1}`, px };
  }

  // ---------- shape tags, read from the pixels ----------
  function classify(px) {
    const N = 11, C = 5;
    let m = px.map(v => v > 0 ? 1 : 0);
    // 8-connected parts; a thin part touching the edge is a dotted/lined frame, not the motif
    const fillOf = keepSet => { const o=new Array(N*N).fill(0), q=[];
      for (let i=0;i<N;i++) for (const [x,y] of [[i,0],[i,N-1],[0,i],[N-1,i]]) { const j=y*N+x; if (!keepSet[j]&&!o[j]) { o[j]=1; q.push(j); } }
      while (q.length) { const j=q.pop(), x=j%N, y=(j/N)|0; for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const a=x+dx,b=y+dy; if (a<0||b<0||a>=N||b>=N) continue; const k=b*N+a; if (!keepSet[k]&&!o[k]) { o[k]=1; q.push(k); } } }
      let n=0; for (let i=0;i<N*N;i++) if (!o[i]) n++; return n; };
    { const lab = new Array(N*N).fill(-1), parts = [];
      for (let i=0;i<N*N;i++) if (m[i] && lab[i]<0) { const c=[i], st=[i]; lab[i]=parts.length;
        while (st.length) { const j=st.pop(), x=j%N, y=(j/N)|0;
          for (let dy=-1;dy<=1;dy++) for (let dx=-1;dx<=1;dx++) { const a=x+dx,b=y+dy; if (a<0||b<0||a>=N||b>=N) continue; const k=b*N+a; if (m[k]&&lab[k]<0){lab[k]=parts.length;c.push(k);st.push(k);} } }
        parts.push(c); }
      const keep = new Array(N*N).fill(0); let kept = 0;
      for (const c of parts) {
        const edge = c.some(j => { const x=j%N, y=(j/N)|0; return x===0||y===0||x===N-1||y===N-1; });
        const one = new Array(N*N).fill(0); for (const j of c) one[j]=1;
        const onRing = c.filter(j => { const x=j%N, y=(j/N)|0; return x===0||y===0||x===N-1||y===N-1; }).length;
        const thin = c.length < 0.35 * fillOf(one) && onRing >= 8 && onRing < 30;
        const tiny = c.length < 4;
        const xs=c.map(j=>j%N), ys=c.map(j=>(j/N)|0), span=Math.max(Math.max(...xs)-Math.min(...xs), Math.max(...ys)-Math.min(...ys))+1;
        const nearMid = c.some(j => Math.abs(j%N-C)<=2 && Math.abs(((j/N)|0)-C)<=2);
        const fence = fillOf(one) <= 1.2*c.length && span >= 8 && !nearMid;
        if (!(edge && thin) && !fence && !tiny) { for (const j of c) keep[j]=1; kept += c.length; } }
      if (kept >= 9) m = keep; }
    // silhouette = everything not reachable from the border through empty cells
    const out = new Array(N*N).fill(0), st = [];
    for (let i=0;i<N;i++) for (const [x,y] of [[i,0],[i,N-1],[0,i],[N-1,i]]) { const j=y*N+x; if (!m[j] && !out[j]) { out[j]=1; st.push(j); } }
    while (st.length) { const j=st.pop(), x=j%N, y=(j/N)|0; for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const a=x+dx,b=y+dy; if (a<0||b<0||a>=N||b>=N) continue; const k=b*N+a; if (!m[k]&&!out[k]) { out[k]=1; st.push(k); } } }
    let fill=0, sil=0; for (let i=0;i<N*N;i++) { fill+=m[i]; if (!out[i]) sil++; }
    const outline = sil > 9 && fill / sil < 0.55;
    const four = (() => { for (let y=0;y<N;y++) for (let x=0;x<N;x++) if (!out[y*N+x] !== !out[x*N+(N-1-y)]) return false; return true; })();
    // bounding box of the silhouette
    let x0=N,y0=N,x1=-1,y1=-1; for (let y=0;y<N;y++) for (let x=0;x<N;x++) if (!out[y*N+x]) { x0=Math.min(x0,x); x1=Math.max(x1,x); y0=Math.min(y0,y); y1=Math.max(y1,y); }
    const w=x1-x0+1, h=y1-y0+1, half=Math.max(w,h)/2;
    // how far in from each bbox corner, along the diagonal, before we hit the shape
    const cut = (cx,cy,dx,dy) => { for (let i=0;i<N;i++) { const x=cx+dx*i, y=cy+dy*i; if (x<0||y<0||x>=N||y>=N) return i; if (!out[y*N+x]) return i; } return N; };
    const depth = (cut(x0,y0,1,1)+cut(x1,y0,-1,1)+cut(x0,y1,1,-1)+cut(x1,y1,-1,-1)) / 4 / half;
    // compare the silhouette with a bank of ideal shapes at every size; best overlap wins
    const BANK = classify.BANK || (classify.BANK = (() => { const bank = [];
      const mk = (kind, f) => { const t = new Uint8Array(N*N); let n=0; for (let y=0;y<N;y++) for (let x=0;x<N;x++) if (f(Math.abs(x-C),Math.abs(y-C))) { t[y*N+x]=1; n++; } if (n) bank.push({kind,t}); };
      for (let a=1;a<=5;a++) mk('square',(x,y)=>x<=a&&y<=a);
      for (let r=1.5;r<=6;r+=0.25) mk('round',(x,y)=>x*x+y*y<=r*r);
      for (let r=2;r<=7;r++) mk('diamond',(x,y)=>x+y<=r);
      for (let a=0;a<=2;a++) for (let L=a+2;L<=5;L++) for (let b=0;b<a+2&&b<L;b++) mk('cross',(x,y)=>(x<=a&&y<=L)||(y<=a&&x<=L)||(x<=b&&y<=b));
      return bank; })());
    let shape = 'figure', bs = 0;
    for (const {kind,t} of BANK) { let I=0,U=0; for (let i=0;i<N*N;i++) { const p=!out[i], q=t[i]; if (p&&q) I++; if (p||q) U++; } const sc=I/U; if (sc>bs+1e-6 || (kind==='diamond' && sil<=30 && sc>=bs-1e-6)) { bs=sc; shape=kind; } }
    // a body that fills its own box corners is a square — trim thin tabs off the box edges first
    { const body = out.map(v => v ? 0 : 1); let X0=x0, X1=x1, Y0=y0, Y1=y1;
      const rowFill = (y,a,b) => { let n=0; for (let x=a;x<=b;x++) n+=body[y*N+x]; return n/(b-a+1); };
      const colFill = (x,a,b) => { let n=0; for (let y=a;y<=b;y++) n+=body[y*N+x]; return n/(b-a+1); };
      for (let g=0; g<1; g++) { if (Y1-Y0>3 && rowFill(Y0,X0,X1)<0.4) Y0++; if (Y1-Y0>3 && rowFill(Y1,X0,X1)<0.4) Y1--; if (X1-X0>3 && colFill(X0,Y0,Y1)<0.4) X0++; if (X1-X0>3 && colFill(X1,Y0,Y1)<0.4) X1--; }
      let bn=0; for (let y=Y0;y<=Y1;y++) for (let x=X0;x<=X1;x++) bn+=body[y*N+x];
      const bw=X1-X0+1, bh=Y1-Y0+1;
      if (bw>=4 && bh>=4 && body[Y0*N+X0] && body[Y0*N+X1] && body[Y1*N+X0] && body[Y1*N+X1] && bn >= 0.85*bw*bh && bw*bh >= 0.6*sil && Math.min(rowFill(Y0,X0,X1), rowFill(Y1,X0,X1), colFill(X0,Y0,Y1), colFill(X1,Y0,Y1)) >= 0.85) shape = 'square'; }
    // X shapes and anything that opens out from the middle
    let rowC=0, rowE=0; for (let x=0;x<N;x++) { if (!out[C*N+x]) rowC++; if (!out[y0*N+x]) rowE++; }
    const hollow = sil < 0.45*w*h;
    // triangles: one end narrow, the other wide, filling a straight-sided wedge
    const tri = (() => { if (w < 5 || h < 5) return false;
      const A = !out.length ? null : (x,y) => !out[y*N+x];
      for (const dir of ['up','down','left','right']) {
        const along = dir==='up'||dir==='down' ? h : w, across = dir==='up'||dir==='down' ? w : h;
        let I=0, U=0;
        for (let t=0; t<along; t++) {
          const k = (dir==='up'||dir==='left') ? t : along-1-t;           // k = distance from the tip
          const half = (across/2) * (k+1)/along;                           // ideal half-width at this step
          for (let c=0; c<across; c++) {
            const inT = Math.abs(c - (across-1)/2) <= half;
            const x = dir==='up'||dir==='down' ? x0+c : x0+t, y = dir==='up'||dir==='down' ? y0+t : y0+c;
            const inS = A(x,y); if (inT&&inS) I++; if (inT||inS) U++; } }
        if (U && I/U >= 0.9) return true; }
      return false; })();
    if (!four && tri) shape = 'triangle';
    else if (!four || w < 3 || h < 3) shape = 'misc';
    else if (hollow || rowE > rowC + 1) shape = 'cross';
    else if (bs < 0.75) shape = 'cross';
    bs = Math.min(bs, 1);
    const convex = +bs.toFixed(2);
    const mono = new Set(px.filter(v => v > 0)).size === 1;
    return { shape, outline, mono, bs:+convex.toFixed(2) };
  }


  // ---------- build the library ----------
  const STYLES = {}, LIB = {};
  for (const st in STYLE_RULES) {
    const list = [], seen = new Set();
    const add = (m, px) => {
      const key = px.join(',');
      if (seen.has(key)) return false;
      let cov = 0; for (const v of px) if (v >= 0) cov++;
      if (!m.hand && (cov < 16 || cov > 117)) return false;
      seen.add(key);
      const id = st + ':' + list.length;
      const entry = { id, n: m.n, d: m.d, px, style: st, ...classify(px) };
      if (/^(Cypress|Hayat ağacı|Muska|Palmette|Stair|Ziggurat)$/.test(m.n || '')) entry.shape = 'triangle';
      list.push(entry); LIB[id] = entry; return true;
    };
    for (const m of (HAND[st] || [])) add({ ...m, hand: true }, fromHand(m));
    for (let i = 0; list.length < PER_STYLE && i < 600; i++) { const g = generate(st, STYLE_RULES[st], i); add(g, g.px); }
    STYLES[st] = list;
  }

  // ---------- figures: people, creatures, buildings, things ----------
  const FIGURES = {"Person":["....kkk....","....kkk....",".....k.....","..aaaaaaa..",".aaaaaaaaa.",".a.aaaaa.a.",".k.aaaaa.k.","...aa.aa...","...aa.aa...","...aa.aa...","..kkk.kkk.."],"Dancer":[".k..kkk..k.",".k..kkk..k.","..k..k..k..","...kaaak...","....aaa....","....aaa....","...wwwww...","..wwwwwww..",".wwwwwwwww.","...k...k...","..kk...kk.."],"Woman":["....kkk....","...kkkkk...","....kkk....","...wwwww...","..wwwwwww..",".kwwwwwwwk.","...wwwww...","..wwwwwww..",".wwwwwwwww.","...k...k...","..kk...kk.."],"Couple":[".kkk...kkk.",".kkk...kkk.","..k.....k..","aaaaa.wwwww","aaaaa.wwwww","kaaak.kwwwk",".aaa...www.",".a.a..wwwww",".a.a..wwwww",".k.k...k.k.","kk.kk.kk.kk"],"Child":["...kkkkk...","..kkkkkkk..","..kkkkkkk..","...kkkkk...","..bbbbbbb..",".bbbbbbbbb.",".k.bbbbb.k.","...bbbbb...","...bb.bb...","...bb.bb...","..kkk.kkk.."],"Rider":["....kk.....","....kk...k.","...aaaa.kkk","...aaa..kkk","k.kkkkkkk..",".kkkkkkkk..","..kkkkkkk..","..k.k.k.k..","..k.k.k.k..","..k.k.k.k..","..k.k.k.k.."],"Face":["...kkkkk...","..kkkkkkk..",".kkfffffkk.",".kfffffffk.",".kfkfffkfk.",".kfffffffk.",".kffffkfffk",".kfwwwwwfk.","..kfffffk..","...kkkkk...","....kkk...."],"Mask":[".kkkkkkkkk.",".kwwwwwwwk.",".kwkkwkkwk.",".kwwwwwwwk.",".kwwwkwwwk.",".kwwwkwwwk.",".kwwkkkwwk.","..kwwwwwk..","..kwkkkwk..","...kwwwk...","....kkk...."],"Sun face":[".k...k...k.","..k..k..k..","...kwwwk...","kk.wwwww.kk","...wkwkw...",".kkwwwwwkk.","...wkkkw...","...kwwwk...","..k..k..k..",".k...k...k.","..........."],"Moon":["...kkkk....",".kkkk......",".kkk.......","kkk........","kkk......w.","kkk.....www","kkk......w.","kkk........",".kkk.......",".kkkk......","...kkkk...."],"Owl":[".k.......k.",".kk.....kk.",".kkkkkkkkk.",".kwwkkkwwk.",".kwkkkkwkk.",".kwwkkkwwk.",".kkkkakkkk.",".kbbkkkbbk.",".kbbbbbbbk.","..kkkkkkk..","...k...k..."],"Cat":[".k.......k.",".kk.....kk.",".kkkkkkkkk.",".kkkkkkkkk.",".kkbkkkbkk.",".kkkkkkkkk.","kkkkkwkkkkk",".kkkkkkkkk.","..kkkkkkk..","...kkkkk...","..........."],"Bird":["...........","..kk.......",".kwk.......","kkkk..k....","..kkkkkk...","..kaaaakk..","..kaaaaakk.","...kkkkkkkk","....k.k....","...kk.kk...","..........."],"Rooster":[".ww........",".wkk.......","kkfk....b..",".kkk...bbb.",".w.kk.bb.b.","...kkkkb...","...kaaakk..","...kaaaak..","....kkkk...",".....k.k...","....kk.kk.."],"Peacock":["..b.b.b.b..",".babababab.","b.bbbbbbb.b",".bbbbbbbbb.","..bbbkbbb..","....kak....","....kak....","....kaak...",".....kaak..",".....k.k...","....kk.kk.."],"Fish":["...........","...........","...kkkk..k.","..kaaaak.kk",".kawaaaakk.","kaaaaaaakk.",".kaaaaaakk.","..kaaaak.kk","...kkkk..k.","...........","..........."],"Horse":[".........k.","........kkk",".......kkkk",".......kk..","k.kkkkkkk..",".kkkkkkkk..","..kkkkkkk..","..k.k.k.k..","..k.k.k.k..","..k.k.k.k..","..k.k.k.k.."],"Camel":[".........k.","........kkk","...k....k..","..kkk..kk..",".kkkkkkkk..","kkkkkkkkk..",".kkkkkkkk..","..k.k.k.k..","..k.k.k.k..","..k.k.k.k..","..k.k.k.k.."],"Deer":["k.k.k......",".kkk.......","..k........",".kkk.......","kkkk.......","..kkkkkkkk.","..kkkkkkkkk","..kkkkkkkk.","..k.k..k.k.","..k.k..k.k.","..k.k..k.k."],"Elephant":["..kkkkkk...",".kkkkkkkkk.","kkkkkkkkkkk","kkkkkkkkfkk","kkkkkkkkkkk",".kkkkkkkkkk",".kk.kk.kk.k",".kk.kk.kk.k",".kk.kk.kk.k",".kk.kk.kk.k",".kk.kk.kk.k"],"Rabbit":["..k.k......","..k.k......","..k.k......","..kkk......",".kkkkk.....",".kfkkk.....","kkkkkkkkk..","..kkkkkkkk.","..kkkkkkkkk","..kkkkkkkk.",".kkk..kkk.."],"Turtle":["...........","...........","....kkk....","..kbababk..",".kbababab.k","kbabababakk","..kkkkkkk..","..k.....k..","...........","...........","..........."],"Snake":[".......kkk.","......kkwkk","......kk...",".....kk....","..kkkk.....",".kk........",".kk........","..kkkkkkk..","........kk.","........kk.","kkkkkkkkk.."],"Scorpion":["....kkk....","...k...k...","...k...k...","....k.k....",".k..kkk..k.","k.k.kak.k.k","..kkkakkk..",".k.kkkkk.k.","k..kkkkk..k","..k.kkk.k..",".k.......k."],"Butterfly":["...........",".kk.....kk.","kaak.k.kaak","kawak.kawak","kaaakkkaaak",".kkkkkkkkk.",".kbbkkkbbk.",".kbbkkkbbk.","..kk.k.kk..","...........","..........."],"House":[".....k.....","....kwk....","...kwwwk...","..kwwwwwk..",".kkkkkkkkk.","..kaaaaak..","..kakakak..","..kaaaaak..","..kakkkak..","..kaakaak..",".kkkkkkkkk."],"Tent":[".....k.....","....kkk....","....kwk....","...kwwwk...","...kwkwk...","..kwwkwwk..","..kwkkkwk..",".kwwkkkwwk.",".kwkkkkkwk.","kkkkkkkkkkk","..........."],"Mosque":[".....w.....","....kkk....","...kaaak...","..kaaaaak..",".k.kaaak.k.",".k.kkkkk.k.",".k.k.k.k.k.",".k.k.k.k.k.",".k.kkkkk.k.",".k.kk.kk.k.","kkkkkkkkkkk"],"Tower":["...k.k.k...","...kkkkk...","....kak....","....kkk....","....kak....","....kkk....","....kak....","...kkkkk...","...k.k.k...","..kkk.kkk..",".kkkkkkkkk."],"Pagoda":[".....k.....","....kkk....","..kkkkkkk..","....kwk....",".kkkkkkkkk.","...kwkwk...","kkkkkkkkkkk","..kwkkkwk..","..kwkakwk..","..kkkakkk..",".kkkkkkkkk."],"Gate":["kkkkkkkkkkk",".kwwwwwwwk.",".kkkkkkkkk.","..k.....k..","..k..k..k..","..k.kwk.k..","..k.kwk.k..","..k.kwk.k..","..k.....k..","..k.....k..",".kkk...kkk."],"Bridge":["...........","...........","kkkkkkkkkkk",".k.k.k.k.k.","kkkkkkkkkkk","kk..kkk..kk","k....k....k","k....k....k","aaaaaaaaaaa",".a.a.a.a.a.","..........."],"Windmill":["k.........k",".k.......k.","..k.....k..","...k.k.k...","....kkk....","...kkwkk...","...kkkkk...","...kkkkk...","..kkkkkkk..","..kkkfkkk..",".kkkkfkkkk."],"Key":["...kkkkk...","..kk...kk..","..k..w..k..","..kk...kk..","...kkkkk...",".....k.....",".....k.....",".....kkk...",".....k.....",".....kk....",".....kkk..."],"Comb":["...........","...........","..kkkkkkk..",".kwwwwwwwk.","kkkkkkkkkkk","k.k.k.k.k.k","k.k.k.k.k.k","k.k.k.k.k.k","k.k.k.k.k.k","...........","..........."],"Ewer":["....kkk....",".....k.....","...kkkkk..k","k.kaaaaak.k",".kkawwwakk.","..kaaaaak..","..kawwwak..","..kaaaaak..","...kaaak...","...kkkkk...","..kkkkkkk.."],"Vase":["...kkkkk...","....kak....","....kak....","...kaaak...","..kawwwak..","..kaaaaak..","..kawwwak..","..kaaaaak..","...kaaak...","....kak....","...kkkkk..."],"Cup":["...k.k.k...","..k.k.k....","...........","kkkkkkkkk..","kaaaaaaakkk","kawawawak.k","kaaaaaaak.k","kawawawakkk","kaaaaaaak..",".kaaaaak...","..kkkkk...."],"Oil lamp":[".....w.....","....www....","....wkw....",".....k.....",".kkkkkkkk..","kaaaaaaaakk",".kaaaaaak.k","..kkkkkk...","....kk.....","...kkkk....","..........."],"Candle":[".....w.....","....www....","....wkw....",".....k.....","....kwk....","....kwk....","....kwk....","....kwk....","....kwk....","..kkkkkkk..",".kkkkkkkkk."],"Boat":[".....k.....",".....kw....",".....kww...",".....kwww..",".....kwwww.",".....k.....","kkkkkkkkkkk",".kaaaaaaak.","..kkkkkkk..",".a.a.a.a.a.","a.a.a.a.a.a"],"Anchor":["....kkk....","....k.k....","....kkk....","..kkkkkkk..",".....k.....",".....k.....",".....k.....","k....k....k","kk...k...kk",".kk..k..kk.","..kkkkkkk.."],"Hamsa":["...k.k.k...","...k.k.k...",".k.k.k.k.k.",".k.kkkkk.k.",".kkkkkkkkk.",".kkwwwwwkk.",".kkwkakwkk.",".kkwwwwwkk.","..kkkkkkk..","...kkkkk...","....kkk...."],"Eye":["...........","...........","...kkkkk...","..k.....k..",".k..aaa..k.","k..akkka..k",".k..aaa..k.","..k.....k..","...kkkkk...","...........","..........."],"Scissors":["k.........k",".k.......k.","..k.....k..","...k...k...","....k.k....",".....k.....","....k.k....","..kkk.kkk..",".k..k.k..k.",".k..k.k..k.","..kk...kk.."],"Umbrella":[".....k.....","...kkkkk...","..kawawak..",".kawawawak.","kkkkkkkkkkk",".....k.....",".....k.....",".....k.....",".....k.....","...k.k.....","....k......"],"Chair":[".k......k..",".kkkkkkkk..",".k......k..",".kkkkkkkk..",".k......k..",".kkkkkkkkk.",".kaaaaaaak.",".kkkkkkkkk.",".k.......k.",".k.......k.",".k.......k."],"Tulip":["...w.w.w...","...wwwwww..","...wwwwww..","....wwww...",".....k.....",".b...k...b.",".bb..k..bb.","..bb.k.bb..","...bbkbb...",".....k.....","...kkkkk..."],"Flower pot":["...w...w...","..wkw.wkw..","...wb.bw...",".....b.....","..w..b..w..",".wkw.b.wkw.","..wbbbbbw..",".kkkkkkkkk.","..kaaaaak..","..kaaaaak..","...kkkkk..."],"Cactus":[".....k.....","....kbk....","....kbk.k..",".k..kbk.kb.",".bk.kbkkbk.",".kbkkbbbk..","..kbbbk....","....kbk....","....kbk....","..kkkkkkk..","...kwwwk..."],"Mushroom":["...........","...kkkkk...","..kwwwwwk..",".kwfwwwfwk.","kwwwwwwwwwk","kkkkkkkkkkk","....kfk....","....kfk....","...kfffk...","..kkkkkkk..","..........."],"Mountain":["...........","...........",".....k.....","....kfk....","...kfffk...","..kkkfkkk..",".kkkkkkkkk.","kkkkkkkkkkk","bbbbbbbbbbb","...........","..........."],"Cloud":["...........","....kkk....","..kkfffkk..",".kfffffffk.","kfffffffffk","kkkkkkkkkkk",".a...a...a.","...........","...a...a...","...........",".a...a...a."],"Sun":[".....w.....",".w...w...w.","..w.www.w..","...wwwww...","..wwwwwww..","wwwwwkwwwww","..wwwwwww..","...wwwww...","..w.www.w..",".w...w...w.",".....w....."]};
  { let i = 0;
    for (const n in FIGURES) { const px = fromHand({ f: FIGURES[n] }); const id = 'Figure:' + i++;
      const c = classify(px); LIB[id] = { id, n, d: 'figure', px, style: 'Figure', ...c, shape: ['Tent', 'Mountain'].includes(n) ? 'triangle' : 'misc' }; } }
  // ---------- triangles ----------
  const TRIANGLES = {"Step triangle":[".....k.....","....kak....","....kak....","...kaaak...","...kaaak...","..kaaaaak..","..kaaaaak..",".kaaaaaaak.",".kaaaaaaak.","kaaaaaaaaak","kkkkkkkkkkk"],"Muska":[".....k.....","....kwk....","...kwawk...","..kwaaawk..",".kwaaaaawk.","kkkkkkkkkkk",".k..k.k..k.",".w..w.w..w.",".k..k.k..k.",".w..w.w..w.","..........."],"Nested triangle":[".....k.....","....k.k....","....k.k....","...k.w.k...","...k.w.k...","..k.w.w.k..","..k.w.w.k..",".k.wwwww.k.",".k.......k.","k.........k","kkkkkkkkkkk"],"Down triangle":["kkkkkkkkkkk","kbbbbbbbbbk",".kbbbbbbbk.",".kbbwwwbbk.","..kbbwbbk..","..kbbbbbk..","...kbbbk...","...kbbbk...","....kbk....","....kbk....",".....k....."],"Hooked triangle":[".....k.....","....kak....",".k.kaaak.k.",".kkaaaaakk.","...kaaak...","..kaaaaak..","k.kaawaak.k","kkaawwwaakk",".kaaaaaaak.","kaaaaaaaaak","kkkkkkkkkkk"],"Eye triangle":[".....k.....","....kwk....","....kwk....","...kwwwk...","...kwkwk...","..kwkakwk..","..kwwkwwk..",".kwwwwwwwk.",".kwwwwwwwk.","kwwwwwwwwwk","kkkkkkkkkkk"],"Arrowhead":["k..........","kk.........","kak........","kaak.......","kaaak......","kaawak.....","kaaak......","kaak.......","kak........","kk.........","k.........."],"Banded triangle":[".....k.....","....kkk....","....bbb....","...bbbbb...","...kkkkk...","..aaaaaaa..","..aaaaaaa..",".kkkkkkkkk.",".wwwwwwwww.","wwwwwwwwwww","kkkkkkkkkkk"],"Teeth":["...........","...........","...........","k....k....k","kk..kkk..kk","kak.kak.kak","kaakaaakaak","kkkkkkkkkkk","...........","...........","..........."],"Pine":[".....b.....","....bbb....","...bbbbb...","....bbb....","...bbbbb...","..bbbbbbb..","...bbbbb...","..bbbbbbb..",".bbbbbbbbb.",".....k.....","....kkk...."],"Corner step":["k..........","kk.........","kak........","kaak.......","kawak......","kawwak.....","kawwwak....","kawwwwak...","kaaaaaaak..","kaaaaaaaak.","kkkkkkkkkkk"],"Hourglass":["kkkkkkkkkkk",".kaaaaaaak.","..kaaaaak..","...kaaak...","....kak....",".....k.....","....kbk....","...kbbbk...","..kbbbbbk..",".kbbbbbbbk.","kkkkkkkkkkk"],"Twin peaks":["...........","..k.....k..",".kak...kak.",".kak...kak.","kaaak.kaaak","kaaakkkaaak","kaaaakaaaak","kaaaaaaaaak","kkkkkkkkkkk",".b.b.b.b.b.","..........."],"Diamond triangle":[".....k.....","....kak....","....kak....","...kaaak...","...kawak...","..kawkwak..","..kaawaak..",".kaaaaaaak.",".kaaaaaaak.","kaaaaaaaaak","kkkkkkkkkkk"],"Hollow step":[".....k.....","....k.k....","....k.k....","...k...k...","...k...k...","..k.....k..","..k..b..k..",".k..bbb..k.",".k.bbbbb.k.","k.........k","kkkkkkkkkkk"],"Dot pyramid":["...........",".....a.....","...........","....a.a....","...........","...a.a.a...","...........","..a.a.a.a..","...........",".a.a.a.a.a.","kkkkkkkkkkk"],"Comb triangle":[".....k.....","....kak....","...kaaak...","..kaaaaak..",".kaaaaaaak.","kkkkkkkkkkk","k.k.k.k.k.k","k.k.k.k.k.k","w.w.w.w.w.w","...........","..........."],"Rayed triangle":["k....k....k",".k...k...k.","...........",".....k.....","....kwk....","...kwwwk...","..kwwawwk..",".kwwaaawwk.","kkkkkkkkkkk","...........","..........."]};
  { let i = 0;
    for (const n in TRIANGLES) { const px = fromHand({ f: TRIANGLES[n] }); const id = 'Triangle:' + i++;
      LIB[id] = { id, n, d: 'triangle', px, style: 'Triangle', ...classify(px), shape: 'triangle' }; } }

  return { LIB, PALETTES, FRINGES };
})();
