/* =========================================================================
 * DATA DUMMY — Sistem Informasi Aset Perlengkapan Jalan (Kab. Malang)
 * Struktur mengikuti Kamus Data (Tabel 3.6): pengguna, kecamatan, ruas_jalan,
 * kategori, jenis_perlengkapan, aset, pemeriksaan, foto.
 * Semua data di file ini FIKTIF untuk keperluan prototipe.
 * ========================================================================= */

/* ---------- Kecamatan Kabupaten Malang (33) + titik tengah perkiraan ---------- */
const KECAMATAN_SRC = [
  ['Ampelgading', -8.2370, 112.8800], ['Bantur', -8.3300, 112.5850],
  ['Bululawang', -8.0800, 112.6400], ['Dampit', -8.2120, 112.7500],
  ['Dau', -7.9550, 112.5650], ['Donomulyo', -8.2800, 112.4200],
  ['Gedangan', -8.2900, 112.6400], ['Gondanglegi', -8.1700, 112.6400],
  ['Jabung', -7.9500, 112.7600], ['Kalipare', -8.2000, 112.4500],
  ['Karangploso', -7.9000, 112.6000], ['Kasembon', -7.8300, 112.3100],
  ['Kepanjen', -8.1300, 112.5700], ['Kromengan', -8.1100, 112.4900],
  ['Lawang', -7.8350, 112.6950], ['Ngajum', -8.0900, 112.5300],
  ['Ngantang', -7.8600, 112.3700], ['Pagak', -8.2200, 112.5100],
  ['Pagelaran', -8.1900, 112.5900], ['Pakis', -7.9600, 112.7250],
  ['Pakisaji', -8.0600, 112.6000], ['Poncokusumo', -8.0500, 112.7800],
  ['Pujon', -7.8400, 112.4550], ['Singosari', -7.8900, 112.6650],
  ['Sumbermanjing Wetan', -8.3200, 112.7000], ['Sumberpucung', -8.1500, 112.4800],
  ['Tajinan', -8.0600, 112.6900], ['Tirtoyudo', -8.2600, 112.8200],
  ['Tumpang', -8.0100, 112.7500], ['Turen', -8.1700, 112.7000],
  ['Wagir', -8.0100, 112.5550], ['Wajak', -8.1200, 112.7400],
  ['Wonosari', -8.0700, 112.4700],
];

/* ---------- Ruas jalan: [nama, status, panjang_km, [kecamatan dilalui]] ---------- */
const RUAS_SRC = [
  ['Jl. Raya Lawang', 'Nasional', 9.214, ['Lawang', 'Singosari']],
  ['Jl. Raya Singosari', 'Nasional', 7.530, ['Singosari']],
  ['Jl. Raya Kepanjen', 'Nasional', 11.860, ['Kepanjen', 'Pakisaji']],
  ['Jl. Raya Sumberpucung', 'Nasional', 8.415, ['Sumberpucung', 'Kromengan']],
  ['Jl. Raya Pakisaji', 'Nasional', 5.120, ['Pakisaji']],
  ['Jl. Raya Pujon', 'Provinsi', 12.300, ['Pujon']],
  ['Jl. Raya Ngantang', 'Provinsi', 14.750, ['Ngantang', 'Kasembon']],
  ['Jl. Raya Turen', 'Provinsi', 6.940, ['Turen', 'Bululawang']],
  ['Jl. Raya Dampit', 'Provinsi', 9.880, ['Dampit', 'Turen']],
  ['Jl. Raya Bululawang', 'Provinsi', 7.205, ['Bululawang']],
  ['Jl. Raya Karangploso', 'Kabupaten', 6.310, ['Karangploso']],
  ['Jl. Raya Dau', 'Kabupaten', 5.470, ['Dau']],
  ['Jl. Raya Wagir', 'Kabupaten', 6.025, ['Wagir']],
  ['Jl. Raya Ngajum', 'Kabupaten', 5.880, ['Ngajum']],
  ['Jl. Raya Wonosari', 'Kabupaten', 7.140, ['Wonosari']],
  ['Jl. Raya Kromengan', 'Kabupaten', 4.660, ['Kromengan']],
  ['Jl. Raya Kalipare', 'Kabupaten', 8.320, ['Kalipare']],
  ['Jl. Raya Pagak', 'Kabupaten', 6.950, ['Pagak']],
  ['Jl. Raya Donomulyo', 'Kabupaten', 10.410, ['Donomulyo']],
  ['Jl. Raya Bantur', 'Kabupaten', 9.630, ['Bantur']],
  ['Jl. Raya Balekambang', 'Kabupaten', 7.215, ['Bantur']],
  ['Jl. Raya Pagelaran', 'Kabupaten', 5.390, ['Pagelaran']],
  ['Jl. Raya Gondanglegi', 'Kabupaten', 6.780, ['Gondanglegi', 'Pagelaran']],
  ['Jl. Raya Ketawang', 'Kabupaten', 4.210, ['Gondanglegi']],
  ['Jl. Raya Gedangan', 'Kabupaten', 8.050, ['Gedangan']],
  ['Jl. Raya Sumbermanjing', 'Kabupaten', 11.240, ['Sumbermanjing Wetan']],
  ['Jl. Raya Sendangbiru', 'Kabupaten', 9.120, ['Sumbermanjing Wetan']],
  ['Jl. Raya Tirtoyudo', 'Kabupaten', 10.560, ['Tirtoyudo']],
  ['Jl. Raya Ampelgading', 'Kabupaten', 8.770, ['Ampelgading']],
  ['Jl. Raya Wajak', 'Kabupaten', 6.430, ['Wajak']],
  ['Jl. Raya Poncokusumo', 'Kabupaten', 7.690, ['Poncokusumo']],
  ['Jl. Raya Tumpang', 'Kabupaten', 6.880, ['Tumpang', 'Pakis']],
  ['Jl. Raya Jabung', 'Kabupaten', 7.330, ['Jabung']],
  ['Jl. Raya Pakis', 'Kabupaten', 5.960, ['Pakis']],
  ['Jl. Raya Tajinan', 'Kabupaten', 5.140, ['Tajinan']],
  ['Jl. Raya Kasembon', 'Kabupaten', 6.200, ['Kasembon']],
  ['Jl. Raya Mondoroko', 'Kabupaten', 3.450, ['Singosari']],
];

/* ---------- Kategori (6) ---------- */
const KATEGORI_SRC = [
  { id: 1, kode: 'RMB', nama: 'Rambu lalu lintas', prefix: 'RB', warna: '#d32f2f', huruf: 'R', linear: false },
  { id: 2, kode: 'MRK', nama: 'Marka jalan',       prefix: 'MK', warna: '#0288d1', huruf: 'M', linear: true },
  { id: 3, kode: 'APL', nama: 'APILL',             prefix: 'AP', warna: '#7b1fa2', huruf: 'A', linear: false },
  { id: 4, kode: 'GRD', nama: 'Guardrail',         prefix: 'GR', warna: '#546e7a', huruf: 'G', linear: true },
  { id: 5, kode: 'DLN', nama: 'Delineator',        prefix: 'DL', warna: '#ef6c00', huruf: 'D', linear: false },
  { id: 6, kode: 'CRM', nama: 'Cermin tikungan',   prefix: 'CM', warna: '#2e7d32', huruf: 'C', linear: false },
];

/* ---------- Jenis perlengkapan ---------- */
const JENIS_SRC = [
  [1, 'RP', 'Rambu peringatan'], [1, 'RL', 'Rambu larangan'], [1, 'RH', 'Rambu perintah'],
  [1, 'RT', 'Rambu petunjuk'], [1, 'RS', 'Rambu sementara'],
  [2, 'MGU', 'Marka garis utuh'], [2, 'MGP', 'Marka garis putus-putus'],
  [2, 'MZC', 'Marka zebra cross'], [2, 'MLB', 'Marka lambang/tulisan'],
  [3, 'A3', 'APILL tiga aspek'], [3, 'WL', 'Warning light (lampu kuning kedip)'],
  [4, 'GWB', 'Guardrail W-beam'], [4, 'GTB', 'Guardrail Thrie-beam'],
  [5, 'DPP', 'Patok pengarah (delineator)'], [5, 'DRS', 'Paku jalan (road stud)'], [5, 'DPK', 'Patok kilometer'],
  [6, 'C80', 'Cermin tikungan cembung Ø80 cm'], [6, 'C100', 'Cermin tikungan cembung Ø100 cm'],
];

/* ---------- Validasi wilayah (pendekatan prototipe) ----------
 * Kotak batas Kab. Malang dikurangi enclave Kota Malang dan Kota Batu.
 * Pada sistem nyata dipakai poligon batas wilayah (point-in-polygon). */
const WILAYAH = {
  kab:  { latMin: -8.48, latMax: -7.73, lngMin: 112.28, lngMax: 112.98 },
  kota: { nama: 'Kota Malang', latMin: -8.04, latMax: -7.93, lngMin: 112.585, lngMax: 112.69 },
  batu: { nama: 'Kota Batu',   latMin: -7.92, latMax: -7.76, lngMin: 112.49, lngMax: 112.575 },
};

function cekWilayah(lat, lng) {
  if (!isFinite(lat) || !isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180)
    return { ok: false, msg: 'Koordinat di luar rentang yang sah (lintang −90..90, bujur −180..180).' };
  const k = WILAYAH.kab;
  if (lat < k.latMin || lat > k.latMax || lng < k.lngMin || lng > k.lngMax)
    return { ok: false, msg: 'Koordinat berada di luar wilayah Kabupaten Malang.' };
  for (const e of [WILAYAH.kota, WILAYAH.batu]) {
    if (lat >= e.latMin && lat <= e.latMax && lng >= e.lngMin && lng <= e.lngMax)
      return { ok: false, msg: `Koordinat berada di wilayah ${e.nama}, bukan Kabupaten Malang.` };
  }
  return { ok: true, msg: 'Berada di dalam wilayah Kabupaten Malang' };
}

/* ---------- Random deterministik agar data dummy selalu sama ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedDB() {
  const rnd = mulberry32(20261123);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const weighted = (pairs) => { let r = rnd() * pairs.reduce((s, p) => s + p[1], 0); for (const [v, w] of pairs) { if ((r -= w) <= 0) return v; } return pairs[0][0]; };
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  const dateBetween = (a, b) => { const t = a.getTime() + rnd() * (b.getTime() - a.getTime()); const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const ts = (date) => `${date}T${pad(7 + Math.floor(rnd() * 9))}:${pad(Math.floor(rnd() * 60))}:00`;

  const pengguna = [
    { id: 1, nama: 'Administrator Dishub', nama_pengguna: 'admin',     kata_sandi: '$2b$10$dummyhash.admin',     peran: 'admin',   aktif: true,  dibuat_pada: '2026-09-01T08:00:00', _demo: 'admin123' },
    { id: 2, nama: 'Rina Kusumawati',      nama_pengguna: 'staf01',    kata_sandi: '$2b$10$dummyhash.staf01',    peran: 'staf',    aktif: true,  dibuat_pada: '2026-09-01T08:05:00', _demo: 'staf123' },
    { id: 3, nama: 'Budi Santoso',         nama_pengguna: 'petugas01', kata_sandi: '$2b$10$dummyhash.petugas01', peran: 'petugas', aktif: true,  dibuat_pada: '2026-09-01T08:10:00', _demo: 'petugas123' },
    { id: 4, nama: 'Agus Prasetyo',        nama_pengguna: 'petugas02', kata_sandi: '$2b$10$dummyhash.petugas02', peran: 'petugas', aktif: true,  dibuat_pada: '2026-09-02T09:00:00', _demo: 'petugas123' },
    { id: 5, nama: 'Dedi Hermawan',        nama_pengguna: 'petugas03', kata_sandi: '$2b$10$dummyhash.petugas03', peran: 'petugas', aktif: false, dibuat_pada: '2026-09-02T09:15:00', _demo: 'petugas123' },
  ];

  const kecamatan = KECAMATAN_SRC.map(([nama, lat, lng], i) => ({ id: i + 1, nama, _lat: lat, _lng: lng }));
  const kecId = Object.fromEntries(kecamatan.map(k => [k.nama, k.id]));
  const ruas_jalan = RUAS_SRC.map(([nama, status_jalan, panjang_km, kecs], i) => ({
    id: i + 1, nama, status_jalan, panjang_km, _kecamatan_ids: kecs.map(n => kecId[n]),
  }));
  const kategori = KATEGORI_SRC.map(k => ({ ...k }));
  const jenis_perlengkapan = JENIS_SRC.map(([kategori_id, kode, nama], i) => ({ id: i + 1, kategori_id, kode, nama }));

  const aset = [], pemeriksaan = [], foto = [];
  const counter = Object.fromEntries(kategori.map(k => [k.id, 100]));
  const arahList = ['Arah Kota Malang', 'Arah Kepanjen', 'Arah Surabaya', 'Arah Blitar', 'Arah Dampit', 'Arah Batu', 'Dua arah'];
  const ketBaik = ['Kondisi baik, terpasang kokoh.', 'Bersih dan terbaca jelas.', 'Tidak ada kerusakan.', 'Baik, reflektif masih berfungsi.'];
  const ketSedang = ['Cat mulai pudar, perlu pengecatan ulang.', 'Tiang sedikit miring.', 'Tertutup ranting pohon, perlu pemangkasan.', 'Reflektor mulai kusam.', 'Sebagian permukaan kotor dan berkarat ringan.'];
  const ketRusak = ['Daun rambu bengkok tertabrak kendaraan.', 'Tiang patah, perlu penggantian.', 'Cermin pecah, tidak berfungsi.', 'Lampu mati, perlu perbaikan.', 'Hilang ±12 m, perlu penggantian.', 'Marka hampir tidak terlihat sepanjang ±40 m.'];
  const petugasIds = [3, 4];

  for (let i = 0; i < 96; i++) {
    const kec = kecamatan[i % kecamatan.length];
    const ruasKec = ruas_jalan.filter(r => r._kecamatan_ids.includes(kec.id));
    const ruas = pick(ruasKec);
    const katId = weighted([[1, 48], [2, 15], [3, 5], [4, 9], [5, 12], [6, 11]]);
    const kat = kategori.find(k => k.id === katId);
    const jenis = pick(jenis_perlengkapan.filter(j => j.kategori_id === katId));

    let lat, lng, tries = 0;
    do {
      lat = +(kec._lat + (rnd() - 0.5) * 0.022).toFixed(7);
      lng = +(kec._lng + (rnd() - 0.5) * 0.022).toFixed(7);
      tries++;
    } while (!cekWilayah(lat, lng).ok && tries < 30);

    counter[katId]++;
    const pembuat = pick(petugasIds);
    const tglBuat = dateBetween(new Date('2026-09-05'), new Date('2026-10-20'));
    const a = {
      id: aset.length + 1,
      kode_aset: `${kat.prefix}-${String(counter[katId]).padStart(4, '0')}`,
      jenis_id: jenis.id,
      kecamatan_id: kec.id,
      ruas_jalan_id: ruas.id,
      latitude: lat,
      longitude: lng,
      sumber_koordinat: rnd() < 0.9 ? 'GPS' : 'Manual',
      akurasi_meter: +(3 + rnd() * 12).toFixed(2),
      posisi_penempatan: kat.kode === 'MRK' || kat.kode === 'APL' ? pick(['Kiri', 'Kanan', 'Median']) : pick(['Kiri', 'Kanan']),
      arah_jalur: pick(arahList),
      lokasi_km: rnd() < 0.55 ? `KM ${Math.floor(rnd() * 30) + 1}+${String(Math.floor(rnd() * 10) * 100).padStart(3, '0')}` : null,
      panjang_meter: kat.kode === 'MRK' ? +(20 + rnd() * 230).toFixed(2) : kat.kode === 'GRD' ? +(12 + rnd() * 108).toFixed(2) : null,
      tanggal_pasang: rnd() < 0.8 ? dateBetween(new Date('2015-01-01'), new Date('2024-12-31')) : null,
      dibuat_oleh: pembuat,
      dibuat_pada: ts(tglBuat),
      diubah_pada: ts(tglBuat),
    };
    if (a.sumber_koordinat === 'Manual') a.akurasi_meter = null;
    aset.push(a);

    // Riwayat pemeriksaan: 1–3 catatan
    const n = weighted([[1, 45], [2, 35], [3, 20]]);
    let tgl = tglBuat;
    for (let c = 0; c < n; c++) {
      if (c > 0) tgl = dateBetween(new Date(tgl), new Date('2026-11-22'));
      const kondisi = weighted([['Baik', 58], ['Sedang', 26], ['Rusak', 16]]);
      const p = {
        id: pemeriksaan.length + 1,
        aset_id: a.id,
        tanggal_survei: tgl,
        kondisi,
        visibilitas: kat.kode === 'MRK' ? (kondisi === 'Baik' ? 'Jelas' : kondisi === 'Sedang' ? 'Kurang' : pick(['Kurang', 'Tidak terlihat'])) : null,
        keterangan: pick(kondisi === 'Baik' ? ketBaik : kondisi === 'Sedang' ? ketSedang : ketRusak),
        diperiksa_oleh: c === 0 ? pembuat : pick(petugasIds),
        dibuat_pada: ts(tgl),
      };
      pemeriksaan.push(p);
      foto.push({
        id: foto.length + 1,
        pemeriksaan_id: p.id,
        nama_berkas: `${a.kode_aset}_${tgl.replace(/-/g, '')}.jpg`,
        url: `dummy:${kat.kode}:${p.id}`,
        dibuat_pada: p.dibuat_pada,
      });
    }
  }

  return { versi: 1, pengguna, kecamatan, ruas_jalan, kategori, jenis_perlengkapan, aset, pemeriksaan, foto };
}

/* ---------- Foto dummy (SVG) per kategori ---------- */
function dummyPhoto(katKode, seed = 1, label = '') {
  const r = mulberry32(seed * 9973);
  const sky = ['#a7d3f2', '#bfe0f5', '#cfe6f7', '#f6d7a7'][Math.floor(r() * 4)];
  const hill = ['#7fb069', '#8cbf6f', '#6a9e5a'][Math.floor(r() * 3)];
  const icons = {
    RMB: `<rect x="157" y="88" width="6" height="110" fill="#777"/><polygon points="160,40 205,115 115,115" fill="#ffd400" stroke="#111" stroke-width="5"/><text x="160" y="104" font-size="34" font-weight="700" text-anchor="middle" fill="#111">!</text>`,
    MRK: `<polygon points="150,140 170,140 180,200 140,200" fill="#fff"/><polygon points="153,110 167,110 170,128 150,128" fill="#fff"/>`,
    APL: `<rect x="157" y="110" width="6" height="90" fill="#555"/><rect x="140" y="30" width="40" height="88" rx="8" fill="#222"/><circle cx="160" cy="48" r="10" fill="#e53935"/><circle cx="160" cy="74" r="10" fill="#fbc02d"/><circle cx="160" cy="100" r="10" fill="#43a047"/>`,
    GRD: `<rect x="40" y="128" width="240" height="18" rx="5" fill="#cfd8dc" stroke="#78909c" stroke-width="3"/>${[60, 120, 180, 240].map(x => `<rect x="${x}" y="140" width="7" height="45" fill="#90a4ae"/>`).join('')}`,
    DLN: [100, 160, 220].map((x, i) => `<rect x="${x}" y="${120 + i * 6}" width="14" height="${70 - i * 6}" fill="#fff" stroke="#999"/><rect x="${x}" y="${124 + i * 6}" width="14" height="8" fill="#ff6d00"/>`).join(''),
    CRM: `<rect x="157" y="100" width="6" height="100" fill="#ff7043"/><circle cx="160" cy="70" r="40" fill="#ff7043"/><circle cx="160" cy="70" r="32" fill="#cfe8ff"/><path d="M135 62 Q160 45 185 62" stroke="#fff" stroke-width="4" fill="none" opacity=".8"/>`,
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220">
<rect width="320" height="220" fill="${sky}"/>
<path d="M0 120 Q80 ${80 + r() * 30} 160 115 T320 ${100 + r() * 25} V220 H0Z" fill="${hill}"/>
<polygon points="110,220 210,220 175,120 145,120" fill="#555"/>
<polygon points="157,220 163,220 161,120 159,120" fill="#eee" opacity=".7"/>
${icons[katKode] || ''}
<rect x="0" y="196" width="320" height="24" fill="rgba(0,0,0,.45)"/>
<text x="8" y="213" font-family="sans-serif" font-size="12" fill="#fff">FOTO DUMMY ${label}</text>
</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
