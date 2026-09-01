// Coordinate space and geography for the Altamont piece.
//
// Unlike the career map, which is traced from a reference image in its own
// invented units, this one is projected from real latitude and longitude. The
// story is a corridor — Bay Area to Valley — and the corridor only reads if the
// distances are honest.
//
// The shoreline here is a simplified outline drawn from coordinates, not a
// traced survey. It is right at the scale you see it and wrong if you measure
// it. Replace with a traced reference the same way the county was done.
//
// Y increases downward: north is a LOWER y.

export const BOUNDS = { west: -122.56, east: -121.02, south: 37.34, north: 38.16 };

export const MAP_W = 1400;

// Longitude degrees shrink as you go north. One flat factor across a frame this
// small is under a pixel of error, so the whole projection is two multiplies.
const LON_SCALE = Math.cos(((BOUNDS.north + BOUNDS.south) / 2) * (Math.PI / 180));

const DEG_PX = MAP_W / ((BOUNDS.east - BOUNDS.west) * LON_SCALE);

export const MAP_H = Math.round((BOUNDS.north - BOUNDS.south) * DEG_PX);

export function project([lon, lat]) {
  return [
    round1((lon - BOUNDS.west) * LON_SCALE * DEG_PX),
    round1((BOUNDS.north - lat) * DEG_PX),
  ];
}

const round1 = (v) => Math.round(v * 10) / 10;

export function toPath(points, close = true) {
  const d = points.map(project).map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  return close ? `${d} Z` : d;
}

// One mile in map units, for the scale bar and for anything that wants to think
// in miles rather than pixels.
export const PX_PER_MILE = DEG_PX / 69.05;

// ---------------------------------------------------------------------------
// Water
// ---------------------------------------------------------------------------

// San Francisco Bay, up through San Pablo Bay, the Carquinez Strait, Suisun Bay
// and into the Delta. One continuous body, drawn as one ring: north up the
// Peninsula shore, around Marin, east through the strait, then back west along
// the south shore and down the East Bay.
export const BAY = [
  [-121.98, 37.44], [-122.03, 37.46], [-122.11, 37.47], [-122.15, 37.50],
  [-122.20, 37.52], [-122.24, 37.56], [-122.29, 37.60], [-122.35, 37.63],
  [-122.38, 37.67], [-122.38, 37.72], [-122.39, 37.78], [-122.44, 37.81],
  [-122.48, 37.83], [-122.49, 37.87], [-122.47, 37.90], [-122.50, 37.94],
  [-122.50, 37.98], [-122.47, 38.02], [-122.44, 38.07], [-122.38, 38.12],
  [-122.31, 38.13], [-122.26, 38.10], [-122.23, 38.07], [-122.17, 38.06],
  [-122.09, 38.06], [-122.02, 38.08], [-121.94, 38.09], [-121.87, 38.07],
  [-121.80, 38.06], [-121.73, 38.08], [-121.66, 38.11], [-121.60, 38.16],
  [-121.53, 38.16], [-121.58, 38.09], [-121.66, 38.05], [-121.74, 38.03],
  [-121.81, 38.01], [-121.88, 38.02], [-121.95, 38.04], [-122.02, 38.03],
  [-122.09, 38.02], [-122.17, 38.02], [-122.22, 38.03], [-122.27, 38.01],
  [-122.33, 38.00], [-122.37, 37.96], [-122.36, 37.91], [-122.32, 37.87],
  [-122.30, 37.83], [-122.29, 37.79], [-122.25, 37.74], [-122.21, 37.70],
  [-122.16, 37.66], [-122.11, 37.60], [-122.07, 37.54], [-122.03, 37.49],
  [-121.99, 37.46],
];

// The Pacific, clipped to the south-west corner of the frame.
export const OCEAN = [
  [-122.56, 37.80], [-122.51, 37.78], [-122.50, 37.71], [-122.48, 37.63],
  [-122.44, 37.55], [-122.41, 37.47], [-122.40, 37.34], [-122.56, 37.34],
];

// The San Joaquin and its Delta channels, the part east of Antioch. Drawn as
// lines rather than filled shapes — at this scale the sloughs are hairlines.
export const CHANNELS = [
  [[-121.66, 38.05], [-121.58, 38.00], [-121.52, 37.95], [-121.44, 37.92],
   [-121.36, 37.90], [-121.31, 37.86], [-121.30, 37.80], [-121.27, 37.74]],
  [[-121.60, 38.03], [-121.55, 38.08], [-121.48, 38.11], [-121.42, 38.16]],
  [[-121.52, 37.95], [-121.48, 38.02], [-121.42, 38.06]],
];

// ---------------------------------------------------------------------------
// Relief
// ---------------------------------------------------------------------------

// Two ridges stand between the Bay and the Valley, and the whole piece turns on
// them being visible. The East Bay hills first, then the Altamont. "Over the
// hill" is not a figure of speech; it is two of them.
export const RIDGES = [
  {
    key: 'eastbay',
    label: 'East Bay hills',
    spine: [[-122.24, 37.94], [-122.15, 37.84], [-122.06, 37.72], [-121.99, 37.62],
            [-121.94, 37.52], [-121.90, 37.42]],
    width: 0.030,
  },
  {
    key: 'altamont',
    label: 'Altamont',
    spine: [[-121.86, 37.98], [-121.78, 37.88], [-121.70, 37.79], [-121.64, 37.70],
            [-121.60, 37.60], [-121.57, 37.48]],
    width: 0.028,
  },
];

// Catmull-Rom through the spine points. Without this the offset band is a chain
// of straight segments and the ridge reads as folded paper.
function smooth(points, perSpan = 8) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    for (let s = 0; s < perSpan; s++) {
      const t = s / perSpan;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1].map((k) => 0.5 * (
        2 * p1[k] +
        (-p0[k] + p2[k]) * t +
        (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
        (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3
      )));
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

// Offsets a spine sideways to make a closed lens. Crude, but a ridge only has
// to read as a ridge.
export function ridgeToPolygon(rawSpine, width) {
  const spine = smooth(rawSpine);
  const left = [];
  const right = [];
  for (let i = 0; i < spine.length; i++) {
    const a = spine[Math.max(0, i - 1)];
    const b = spine[Math.min(spine.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    // Round the two ends off rather than tapering to points — a full-length
    // taper turns the band into a cone, which reads as a searchlight, not a hill.
    const t = Math.pow(Math.sin((i / (spine.length - 1)) * Math.PI), 0.32);
    const nx = (-dy / len) * width * t;
    const ny = (dx / len) * width * t;
    left.push([spine[i][0] + nx, spine[i][1] + ny]);
    right.push([spine[i][0] - nx, spine[i][1] - ny]);
  }
  return left.concat(right.reverse());
}

// Where to write a ridge's name, and at what angle, so it sits along the spine
// instead of across it. Without the name the band is just a stain on the paper.
export function ridgeLabel(spine, at = 0.42) {
  const s = smooth(spine);
  const i = Math.floor(s.length * at);
  const [x0, y0] = project(s[Math.max(0, i - 3)]);
  const [x1, y1] = project(s[Math.min(s.length - 1, i + 3)]);
  const [x, y] = project(s[i]);
  return { x, y, angle: Math.round((Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI) };
}

// ---------------------------------------------------------------------------
// The road
// ---------------------------------------------------------------------------

// I-580 over the Altamont, then 205 and 5. This is the drive the whole piece is
// about, so it gets drawn and labelled.
export const CORRIDOR = [
  [-122.15, 37.72], [-122.08, 37.69], [-121.99, 37.70], [-121.93, 37.70],
  [-121.85, 37.70], [-121.77, 37.69], [-121.70, 37.72], [-121.65, 37.74],
  [-121.58, 37.75], [-121.50, 37.74], [-121.43, 37.74], [-121.35, 37.77],
  [-121.29, 37.80], [-121.27, 37.84],
];

export const BRIDGES = [
  { key: 'bay', label: 'Bay Bridge', line: [[-122.39, 37.79], [-122.30, 37.82]] },
  { key: 'sanmateo', label: 'San Mateo Bridge', line: [[-122.25, 37.58], [-122.12, 37.63]] },
  { key: 'dumbarton', label: 'Dumbarton', line: [[-122.16, 37.49], [-122.11, 37.51]] },
  { key: 'carquinez', label: 'Carquinez', line: [[-122.23, 38.07], [-122.22, 38.02]] },
];

// ---------------------------------------------------------------------------
// Places
// ---------------------------------------------------------------------------

// side is where the label sits relative to the dot. weight is how much of the
// outbound flow starts there, relative to the rest of its own side.
export const ORIGINS = {
  sanFrancisco: { label: 'San Francisco', lon: -122.419, lat: 37.775, side: 'w',  weight: 7 },
  dalyCity:     { label: 'Daly City',     lon: -122.462, lat: 37.688, side: 'w',  weight: 2 },
  sanMateo:     { label: 'San Mateo',     lon: -122.316, lat: 37.563, side: 'w',  weight: 3 },
  redwoodCity:  { label: 'Redwood City',  lon: -122.236, lat: 37.485, side: 'w',  weight: 3 },
  paloAlto:     { label: 'Palo Alto',     lon: -122.143, lat: 37.442, side: 'sw', weight: 2 },
  sunnyvale:    { label: 'Sunnyvale',     lon: -122.037, lat: 37.369, side: 's',  weight: 4 },
  sanJose:      { label: 'San Jose',      lon: -121.886, lat: 37.338, side: 'se', weight: 12 },
  santaClara:   { label: 'Santa Clara',   lon: -121.955, lat: 37.354, side: 's',  weight: 3 },
  milpitas:     { label: 'Milpitas',      lon: -121.899, lat: 37.428, side: 'e',  weight: 4 },
  fremont:      { label: 'Fremont',       lon: -121.989, lat: 37.548, side: 'e',  weight: 11 },
  newark:       { label: 'Newark',        lon: -122.040, lat: 37.529, side: 'w',  weight: 2 },
  unionCity:    { label: 'Union City',    lon: -122.044, lat: 37.596, side: 'e',  weight: 4 },
  hayward:      { label: 'Hayward',       lon: -122.081, lat: 37.669, side: 'w',  weight: 10 },
  sanLeandro:   { label: 'San Leandro',   lon: -122.156, lat: 37.725, side: 'w',  weight: 4 },
  castroValley: { label: 'Castro Valley', lon: -122.086, lat: 37.694, side: 'e',  weight: 3 },
  oakland:      { label: 'Oakland',       lon: -122.271, lat: 37.804, side: 'w',  weight: 9 },
  berkeley:     { label: 'Berkeley',      lon: -122.273, lat: 37.872, side: 'w',  weight: 3 },
  dublin:       { label: 'Dublin',        lon: -121.936, lat: 37.702, side: 'n',  weight: 5 },
  pleasanton:   { label: 'Pleasanton',    lon: -121.875, lat: 37.662, side: 's',  weight: 5 },
  livermore:    { label: 'Livermore',     lon: -121.768, lat: 37.682, side: 's',  weight: 6 },
  sanRamon:     { label: 'San Ramon',     lon: -121.978, lat: 37.780, side: 'w',  weight: 3 },
  walnutCreek:  { label: 'Walnut Creek',  lon: -122.065, lat: 37.910, side: 'w',  weight: 3 },
  concord:      { label: 'Concord',       lon: -122.031, lat: 37.978, side: 'n',  weight: 3 },
  antioch:      { label: 'Antioch',       lon: -121.806, lat: 38.005, side: 'n',  weight: 3 },
};

// Jack's side of the hill. founded gates the early years — you cannot move to
// River Islands in 2015 because there was nothing there yet.
export const DESTINATIONS = {
  tracy:         { label: 'Tracy',                  lon: -121.425, lat: 37.740, side: 's',  founded: 1870, weight: 34 },
  mountainHouse: { label: 'Mountain House',         lon: -121.543, lat: 37.783, side: 'nw',  founded: 2003, weight: 16 },
  lathrop:       { label: 'Lathrop',                lon: -121.277, lat: 37.823, side: 'ne',  founded: 1887, weight: 9 },
  riverIslands:  { label: 'River Islands',          lon: -121.320, lat: 37.810, side: 'sw',  founded: 2015, weight: 14 },
  manteca:       { label: 'Manteca',                lon: -121.216, lat: 37.797, side: 'se', founded: 1918, weight: 18 },
  delWebb:       { label: 'Del Webb at Woodbridge', lon: -121.245, lat: 37.775, side: 'sw',  founded: 2016, weight: 5 },
  stockton:      { label: 'Stockton',               lon: -121.291, lat: 37.958, side: 'ne', founded: 1850, weight: 4 },
};

// Where the pass sign is, and where the map wants to say "over the hill".
export const PASS = { label: 'Altamont Pass', lon: -121.652, lat: 37.735, elevationFt: 1009 };
