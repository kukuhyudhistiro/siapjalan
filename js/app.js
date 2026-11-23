/* =========================================================================
 * PROTOTIPE PWA PETUGAS LAPANGAN — Gambar 9
 * Alur: Login → Beranda → Input Aset (1: identitas + GPS, 2: kondisi, foto,
 * keterangan) → Peta Sebaran dengan ringkasan aset.
 * Penyimpanan: localStorage (meniru basis data terpusat untuk keperluan demo).
 * ========================================================================= */
(() => {
  'use strict';

  const STORE_KEY = 'siapj_db_v1';
  const SESSION_KEY = 'siapj_session_v1';
  const KAB_BOUNDS = [[-8.46, 112.28], [-7.74, 112.97]];

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const view = $('#view');
  const appEl = $('#app');

  /* ---------------- State ---------------- */
  let db = loadDB();
  let session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  let draft = null;          // data formulir input aset (langkah 1 & 2)
  let map = null;            // instance Leaflet
  let deferredInstall = null;
  const mapFilter = { kat: new Set(db.kategori.map(k => k.id)), kec: '', kondisi: '', warna: 'kategori' };

  function loadDB() {
    try { const s = localStorage.getItem(STORE_KEY); if (s) return JSON.parse(s); } catch (e) { /* abaikan */ }
    const d = seedDB(); persist(d); return d;
  }
  function persist(d = db) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); return true; }
    catch (e) { toast('Penyimpanan peramban penuh. Reset data dummy di menu Akun.', 'err'); return false; }
  }
  const me = () => db.pengguna.find(u => u.id === session?.id);

  /* ---------------- Helper data (JOIN sederhana) ---------------- */
  const byId = (t, id) => db[t].find(r => r.id === id);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const nowTs = () => new Date().toISOString().slice(0, 19);
  const nextId = (t) => db[t].reduce((m, r) => Math.max(m, r.id), 0) + 1;
  const fmtDate = (s) => s ? new Date(s.length <= 10 ? s + 'T00:00:00' : s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const KONDISI_WARNA = { Baik: '#1f9d55', Sedang: '#d99100', Rusak: '#d64545' };

  function info(a) {
    const j = byId('jenis_perlengkapan', a.jenis_id);
    const k = byId('kategori', j.kategori_id);
    const checks = db.pemeriksaan.filter(p => p.aset_id === a.id)
      .sort((x, y) => y.tanggal_survei.localeCompare(x.tanggal_survei) || y.id - x.id);
    const last = checks[0];
    return {
      a, j, k, checks, last,
      kec: byId('kecamatan', a.kecamatan_id),
      ruas: byId('ruas_jalan', a.ruas_jalan_id),
      foto: last ? db.foto.find(f => f.pemeriksaan_id === last.id) : null,
    };
  }
  function fotoSrc(f, katKode) {
    if (!f) return dummyPhoto(katKode || 'RMB', 1, '');
    if (f.url.startsWith('dummy:')) { const [, kode, seed] = f.url.split(':'); return dummyPhoto(kode, +seed, f.nama_berkas.split('_')[0]); }
    return f.url;
  }
  const badge = (k) => k ? `<span class="badge ${k}">${k}</span>` : '<span class="badge none">—</span>';

  /* ---------------- UI util ---------------- */
  let toastT;
  function toast(msg, type = '') {
    const t = $('#toast'); t.textContent = msg; t.className = 'show ' + type;
    clearTimeout(toastT); toastT = setTimeout(() => t.className = '', 2600);
  }
  function openModal(html, { center = false, onOpen } = {}) {
    const m = $('#modal');
    m.innerHTML = `<div class="sheet ${center ? 'center' : ''}">${html}</div>`;
    m.hidden = false;
    m.onclick = (e) => { if (e.target === m) closeModal(); };
    onOpen && onOpen(m);
  }
  function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; }
  function zoomPhoto(src) { openModal(`<img class="zoom-img" src="${src}" alt="Foto"><button class="btn block" style="margin-top:12px" data-close>Tutup</button>`, { center: true, onOpen: m => $('[data-close]', m).onclick = closeModal }); }

  function compressImage(file, max = 800, q = 0.72) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onerror = rej;
      fr.onload = () => {
        const img = new Image();
        img.onerror = rej;
        img.onload = () => {
          const s = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', q));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  function nearestKecamatan(lat, lng) {
    let best = null, bd = Infinity;
    for (const k of db.kecamatan) { const d = (k._lat - lat) ** 2 + (k._lng - lng) ** 2; if (d < bd) { bd = d; best = k; } }
    return best;
  }
  function nextKodeAset(katId) {
    const k = byId('kategori', katId);
    const nums = db.aset.filter(a => a.kode_aset.startsWith(k.prefix + '-')).map(a => +a.kode_aset.split('-')[1]);
    return `${k.prefix}-${String((nums.length ? Math.max(...nums) : 100) + 1).padStart(4, '0')}`;
  }
  // Penolakan data ganda: jenis sama + titik koordinat sama (dibulatkan 5 desimal ≈ 1 m)
  function findDuplicate(jenisId, lat, lng) {
    const r = (v) => Math.round(v * 1e5);
    return db.aset.find(a => a.jenis_id === jenisId && r(a.latitude) === r(lat) && r(a.longitude) === r(lng));
  }

  /* ---------------- Router ---------------- */
  const go = (h) => { if (location.hash === h) render(); else location.hash = h; };
  window.addEventListener('hashchange', render);

  function setChrome({ title = 'Sistem Inventaris Jalan', nav = '', back = false, chrome = true } = {}) {
    appEl.classList.toggle('no-chrome', !chrome);
    $('#appTitle').textContent = title;
    $('#btnBack').hidden = !back;
    $$('.bottomnav a').forEach(a => a.classList.toggle('active', a.dataset.nav === nav));
  }
  $('#btnBack').onclick = () => history.length > 1 ? history.back() : go('#/beranda');
  $('#btnRole').onclick = () => go('#/akun');

  function render() {
    const [path, qs] = location.hash.slice(1).split('?');
    const q = new URLSearchParams(qs || '');
    const p = path.split('/').filter(Boolean);
    if (!session && p[0] !== 'login') return go('#/login');
    if (session && (!p[0] || p[0] === 'login')) return go('#/beranda');
    if (map) { map.remove(); map = null; }
    closeModal();
    view.scrollTop = 0;

    switch (p[0]) {
      case 'login': return viewLogin();
      case 'beranda': return viewBeranda();
      case 'input': return p[1] === '2' ? viewInput2() : viewInput1();
      case 'peta': return viewPeta(q);
      case 'aset': return viewDetail(+p[1]);
      case 'periksa': return viewPeriksa(+p[1]);
      case 'akun': return viewAkun();
      default: return go('#/beranda');
    }
  }

  /* ====================== (a) LOGIN ====================== */
  function viewLogin() {
    setChrome({ chrome: false });
    view.innerHTML = `
    <div class="login">
      <div class="brand">
        <div class="logo" aria-hidden="true">
          <svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#0b3a6f"/><polygon points="32,12 52,46 12,46" fill="#f5b301"/><rect x="30" y="22" width="4" height="13" rx="2" fill="#0b3a6f"/><circle cx="32" cy="40" r="2.6" fill="#0b3a6f"/></svg>
        </div>
        <h2>Sistem Informasi<br>Aset Perlengkapan Jalan</h2>
        <p class="sub">Dinas Perhubungan Kabupaten Malang</p>
      </div>
      <form class="card" id="fLogin" novalidate>
        <div class="field"><label for="u">Nama pengguna</label><input class="input" id="u" autocomplete="username" placeholder="petugas01" autocapitalize="off"></div>
        <div class="field"><label for="pw">Kata sandi</label><input class="input" id="pw" type="password" autocomplete="current-password" placeholder="•••••"></div>
        <div class="err-text" id="loginErr" hidden></div>
        <button class="btn primary block" style="margin-top:8px">Masuk</button>
      </form>
      <div class="demo-hint"><b>Akun demo (data dummy):</b><br>Petugas: <code>petugas01</code> / <code>petugas123</code><br>
      <span class="muted">Akun staf/admin ditolak di aplikasi ponsel; <code>petugas03</code> dinonaktifkan.</span></div>
    </div>`;
    $('#fLogin').onsubmit = (e) => {
      e.preventDefault();
      const u = $('#u').value.trim(), pw = $('#pw').value;
      const err = $('#loginErr');
      const show = (m) => { err.textContent = m; err.hidden = false; };
      if (!u || !pw) return show('Nama pengguna dan kata sandi wajib diisi.');
      const user = db.pengguna.find(x => x.nama_pengguna === u);
      if (!user || user._demo !== pw) return show('Nama pengguna atau kata sandi salah.');
      if (!user.aktif) return show('Akun dinonaktifkan. Hubungi admin.');
      if (user.peran !== 'petugas') return show('Aplikasi ponsel khusus petugas lapangan. Staf/admin gunakan versi komputer.');
      session = { id: user.id, masuk: nowTs() };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      toast(`Selamat datang, ${user.nama.split(' ')[0]}`, 'ok');
      go('#/beranda');
    };
  }

  /* ====================== (b) BERANDA ====================== */
  function viewBeranda() {
    setChrome({ nav: 'beranda' });
    const u = me();
    const mine = db.pemeriksaan.filter(p => p.diperiksa_oleh === u.id)
      .sort((x, y) => y.dibuat_pada.localeCompare(x.dibuat_pada)).slice(0, 6);
    const asetSaya = db.aset.filter(a => a.dibuat_oleh === u.id).length;
    const bulanIni = today().slice(0, 7);
    const periksaBulanIni = db.pemeriksaan.filter(p => p.diperiksa_oleh === u.id && p.tanggal_survei.startsWith(bulanIni)).length;
    const rusak = db.aset.filter(a => info(a).last?.kondisi === 'Rusak').length;

    view.innerHTML = `
    <div class="page">
      <div class="greet"><h2>Selamat bertugas</h2><p>${esc(u.nama)} · Petugas lapangan · Dinas Perhubungan Kab. Malang</p></div>
      <a class="card action-card primary" href="#/input/1"><strong>+ Input Aset Baru</strong><span>Rekam lokasi GPS, isi data, dan unggah foto</span></a>
      <a class="card action-card" href="#/peta?pilih=1"><strong>Catat Pemeriksaan Kondisi</strong><span>Pilih aset di peta, lalu perbarui kondisinya</span></a>
      <div class="stats">
        <div class="card stat"><b>${asetSaya}</b><small>Aset saya</small></div>
        <div class="card stat"><b>${periksaBulanIni}</b><small>Periksa bln ini</small></div>
        <div class="card stat"><b style="color:var(--rusak)">${rusak}</b><small>Aset rusak</small></div>
      </div>
      <div class="card panel">
        <p class="section-title">Pemeriksaan terakhir saya</p>
        ${mine.length ? `<table class="tbl"><thead><tr><th>Kode</th><th>Jenis</th><th>Kondisi</th></tr></thead><tbody>
          ${mine.map(p => { const a = byId('aset', p.aset_id); const j = byId('jenis_perlengkapan', a.jenis_id);
            return `<tr data-href="#/aset/${a.id}"><td><b>${esc(a.kode_aset)}</b><div class="muted">${fmtDate(p.tanggal_survei)}</div></td><td>${esc(j.nama)}</td><td>${badge(p.kondisi)}</td></tr>`; }).join('')}
        </tbody></table>` : '<div class="empty">Belum ada pemeriksaan.</div>'}
      </div>
    </div>`;
    $$('tr[data-href]').forEach(tr => tr.onclick = () => go(tr.dataset.href));
  }

  /* ====================== (c) INPUT LANGKAH 1 ====================== */
  function newDraft() {
    return { kategori_id: '', jenis_id: '', kecamatan_id: '', ruas_jalan_id: '', posisi_penempatan: 'Kiri', arah_jalur: '', lokasi_km: '',
      latitude: null, longitude: null, sumber_koordinat: null, akurasi_meter: null, gpsState: 'idle', gpsMsg: '',
      kondisi: '', visibilitas: '', panjang_meter: '', keterangan: '', foto: null };
  }

  function viewInput1() {
    setChrome({ title: 'Input Aset Baru · 1 dari 2', nav: 'input' });
    if (!draft) draft = newDraft();
    const d = draft;
    const kat = d.kategori_id ? byId('kategori', +d.kategori_id) : null;
    const ruasList = d.kecamatan_id ? db.ruas_jalan.filter(r => r._kecamatan_ids.includes(+d.kecamatan_id)) : [];
    const ruas = d.ruas_jalan_id ? byId('ruas_jalan', +d.ruas_jalan_id) : null;
    const opt = (v, l, sel) => `<option value="${v}" ${String(sel) === String(v) ? 'selected' : ''}>${esc(l)}</option>`;

    view.innerHTML = `
    <div class="page-wrap">
    <form class="form" id="f1" novalidate>
      <div class="steps"><i class="on"></i><i></i></div>
      <div class="field"><label>Kategori</label>
        <select class="input" name="kategori_id"><option value="">Pilih kategori…</option>${db.kategori.map(k => opt(k.id, k.nama, d.kategori_id)).join('')}</select></div>
      <div class="field"><label>Jenis perlengkapan</label>
        <select class="input" name="jenis_id" ${kat ? '' : 'disabled'}><option value="">${kat ? 'Pilih jenis…' : 'Pilih kategori dulu'}</option>
        ${kat ? db.jenis_perlengkapan.filter(j => j.kategori_id === kat.id).map(j => opt(j.id, `${j.nama} (${j.kode})`, d.jenis_id)).join('') : ''}</select></div>
      <div class="field"><label>Kode aset <span class="hint">(otomatis, unik)</span></label>
        <input class="input" readonly value="${kat ? nextKodeAset(kat.id) : '—'}"></div>
      <div class="field"><label>Kecamatan</label>
        <select class="input" name="kecamatan_id"><option value="">Pilih kecamatan…</option>${db.kecamatan.map(k => opt(k.id, k.nama, d.kecamatan_id)).join('')}</select></div>
      <div class="field"><label>Ruas jalan</label>
        <select class="input" name="ruas_jalan_id" ${d.kecamatan_id ? '' : 'disabled'}><option value="">${d.kecamatan_id ? 'Pilih ruas jalan…' : 'Pilih kecamatan dulu'}</option>
        ${ruasList.map(r => opt(r.id, r.nama, d.ruas_jalan_id)).join('')}</select></div>
      <div class="row2">
        <div class="field"><label>Status jalan</label><input class="input" readonly value="${ruas ? ruas.status_jalan : '—'}" title="Otomatis dari ruas jalan"></div>
        <div class="field"><label>Posisi</label>
          <select class="input" name="posisi_penempatan">${['Kiri', 'Kanan', 'Median'].map(v => opt(v, v, d.posisi_penempatan)).join('')}</select></div>
      </div>
      <div class="row2">
        <div class="field"><label>Arah jalur</label><input class="input" name="arah_jalur" value="${esc(d.arah_jalur)}" placeholder="Arah Kepanjen" list="arahList">
          <datalist id="arahList">${['Arah Kota Malang', 'Arah Kepanjen', 'Arah Surabaya', 'Arah Blitar', 'Arah Dampit', 'Arah Batu', 'Dua arah'].map(v => `<option value="${v}">`).join('')}</datalist></div>
        <div class="field"><label>Lokasi KM <span class="hint">(ops.)</span></label><input class="input" name="lokasi_km" value="${esc(d.lokasi_km)}" placeholder="KM 12+300"></div>
      </div>

      <button type="button" class="btn block accent" id="btnGps">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/></svg> Ambil Lokasi GPS</button>
      <div class="gps-alt"><button type="button" class="linkbtn" id="btnSim">Simulasi GPS (demo)</button><button type="button" class="linkbtn" id="btnManual">Isi manual</button></div>
      <div id="gpsBox"></div>
      <div id="manualBox"></div>
    </form>
    <div class="form-actions"><button class="btn" id="btnBatal">Batal</button><button class="btn primary" id="btnLanjut">Lanjut ›</button></div>
    </div>`;

    const f = $('#f1');
    const sync = () => { for (const el of f.elements) if (el.name) d[el.name] = el.value; };
    f.onchange = (e) => {
      const n = e.target.name; sync();
      if (n === 'kategori_id') { d.jenis_id = ''; viewInput1(); }
      else if (n === 'kecamatan_id') { d.ruas_jalan_id = ''; viewInput1(); }
      else if (n === 'ruas_jalan_id') viewInput1();
    };
    f.oninput = sync;
    renderGps();

    $('#btnGps').onclick = () => {
      if (!('geolocation' in navigator)) { d.gpsState = 'bad'; d.gpsMsg = 'Perangkat/peramban tidak mendukung geolokasi. Gunakan simulasi atau isi manual.'; return renderGps(); }
      d.gpsState = 'loading'; renderGps();
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoord(pos.coords.latitude, pos.coords.longitude, 'GPS', pos.coords.accuracy);
      }, (err) => {
        d.gpsState = 'bad';
        d.gpsMsg = (err.code === 1 ? 'Izin lokasi ditolak.' : err.code === 3 ? 'Waktu habis mencari sinyal GPS.' : 'Lokasi tidak tersedia.') + ' Coba lagi, gunakan simulasi, atau isi manual.';
        renderGps();
      }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    };
    $('#btnSim').onclick = () => {
      d.gpsState = 'loading'; renderGps();
      const base = d.kecamatan_id ? byId('kecamatan', +d.kecamatan_id) : db.kecamatan[Math.floor(Math.random() * db.kecamatan.length)];
      setTimeout(() => {
        let lat, lng, n = 0;
        do { lat = base._lat + (Math.random() - 0.5) * 0.02; lng = base._lng + (Math.random() - 0.5) * 0.02; n++; } while (!cekWilayah(lat, lng).ok && n < 20);
        setCoord(lat, lng, 'GPS', 3 + Math.random() * 9);
      }, 900);
    };
    $('#btnManual').onclick = () => {
      $('#manualBox').innerHTML = `
        <div class="card panel" style="margin-top:10px">
          <div class="row2">
            <div class="field"><label>Lintang</label><input class="input" id="mLat" inputmode="decimal" placeholder="-8.13000" value="${d.latitude ?? ''}"></div>
            <div class="field"><label>Bujur</label><input class="input" id="mLng" inputmode="decimal" placeholder="112.57000" value="${d.longitude ?? ''}"></div>
          </div>
          <button type="button" class="btn sm block" id="mSet">Gunakan koordinat ini</button>
        </div>`;
      $('#mSet').onclick = () => setCoord(parseFloat($('#mLat').value.replace(',', '.')), parseFloat($('#mLng').value.replace(',', '.')), 'Manual', null);
    };
    $('#btnBatal').onclick = () => { draft = null; go('#/beranda'); };
    $('#btnLanjut').onclick = () => {
      sync();
      const req = ['kategori_id', 'jenis_id', 'kecamatan_id', 'ruas_jalan_id', 'posisi_penempatan'];
      let bad = false;
      req.forEach(n => { const el = f.elements[n]; const miss = !d[n]; el.classList.toggle('invalid', miss); bad ||= miss; });
      if (bad) return toast('Lengkapi isian wajib yang ditandai merah.', 'err');
      if (d.latitude == null) { d.gpsState = 'bad'; d.gpsMsg = 'Koordinat belum direkam. Tekan "Ambil Lokasi GPS".'; renderGps(); return toast('Koordinat wajib direkam.', 'err'); }
      const w = cekWilayah(d.latitude, d.longitude);
      if (!w.ok) return toast(w.msg, 'err');
      go('#/input/2');
    };

    function setCoord(lat, lng, sumber, akurasi) {
      if (!isFinite(lat) || !isFinite(lng)) { d.gpsState = 'bad'; d.gpsMsg = 'Format koordinat tidak valid.'; return renderGps(); }
      d.latitude = +lat.toFixed(7); d.longitude = +lng.toFixed(7);
      d.sumber_koordinat = sumber; d.akurasi_meter = akurasi == null ? null : +akurasi.toFixed(2);
      const w = cekWilayah(d.latitude, d.longitude);
      d.gpsState = w.ok ? 'ok' : 'bad'; d.gpsMsg = w.msg;
      if (w.ok && !d.kecamatan_id) {   // saran kecamatan terdekat
        const k = nearestKecamatan(d.latitude, d.longitude);
        d.kecamatan_id = String(k.id); d.ruas_jalan_id = '';
        toast(`Kecamatan terisi otomatis: ${k.nama}`);
        return viewInput1();
      }
      renderGps();
    }
    function renderGps() {
      const box = $('#gpsBox');
      if (d.gpsState === 'loading') { box.innerHTML = `<div class="gps-box"><span class="spin"></span>Mencari sinyal GPS…</div>`; return; }
      if (d.latitude == null && d.gpsState !== 'bad') { box.innerHTML = `<div class="gps-box muted">Koordinat belum direkam.</div>`; return; }
      const coord = d.latitude != null ? `Lintang: ${d.latitude.toFixed(5)}<br>Bujur: ${d.longitude.toFixed(5)}<br>
        Akurasi: ${d.akurasi_meter != null ? '± ' + Math.round(d.akurasi_meter) + ' meter' : '—'} · Sumber: ${d.sumber_koordinat}<br>` : '';
      box.innerHTML = `<div class="gps-box ${d.gpsState}">${coord}<span class="${d.gpsState === 'ok' ? 'ok-line' : 'bad-line'}">${d.gpsState === 'ok' ? '✓' : '✕'} ${esc(d.gpsMsg)}</span></div>`;
    }
  }

  /* ====================== (d) INPUT LANGKAH 2 ====================== */
  function viewInput2() {
    if (!draft || draft.latitude == null) { toast('Isi langkah 1 terlebih dahulu.'); return go('#/input/1'); }
    setChrome({ title: 'Input Aset Baru · 2 dari 2', nav: 'input' });
    const d = draft;
    const kat = byId('kategori', +d.kategori_id);

    view.innerHTML = `
    <div class="page-wrap">
    <div class="form">
      <div class="steps"><i class="on"></i><i class="on"></i></div>
      ${formKondisi(d, kat, true)}
      <div class="note"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.5"/></svg>
        <span>Data ganda akan ditolak otomatis (jenis dan titik koordinat yang sama).</span></div>
    </div>
    <div class="form-actions"><button class="btn" id="btnKembali">‹ Kembali</button><button class="btn primary" id="btnSimpan">Simpan</button></div>
    </div>`;
    bindKondisi(d, kat);

    $('#btnKembali').onclick = () => go('#/input/1');
    $('#btnSimpan').onclick = () => {
      if (!validateKondisi(d, kat)) return;
      const dup = findDuplicate(+d.jenis_id, d.latitude, d.longitude);
      if (dup) {
        return openModal(`<h3 style="color:var(--rusak)">Data ganda ditolak</h3>
          <p>Sudah ada aset <b>${esc(dup.kode_aset)}</b> dengan jenis perlengkapan dan titik koordinat yang sama.</p>
          <div class="btn-row"><button class="btn" data-x>Tutup</button><a class="btn primary" href="#/aset/${dup.id}">Lihat aset</a></div>`,
          { onOpen: m => $('[data-x]', m).onclick = closeModal });
      }
      const u = me();
      const ts = nowTs();
      const a = {
        id: nextId('aset'), kode_aset: nextKodeAset(kat.id), jenis_id: +d.jenis_id, kecamatan_id: +d.kecamatan_id, ruas_jalan_id: +d.ruas_jalan_id,
        latitude: d.latitude, longitude: d.longitude, sumber_koordinat: d.sumber_koordinat, akurasi_meter: d.akurasi_meter,
        posisi_penempatan: d.posisi_penempatan, arah_jalur: d.arah_jalur || null, lokasi_km: d.lokasi_km || null,
        panjang_meter: kat.linear && d.panjang_meter ? +(+d.panjang_meter).toFixed(2) : null,
        tanggal_pasang: null, dibuat_oleh: u.id, dibuat_pada: ts, diubah_pada: ts,
      };
      const p = { id: nextId('pemeriksaan'), aset_id: a.id, tanggal_survei: today(), kondisi: d.kondisi,
        visibilitas: kat.kode === 'MRK' ? d.visibilitas : null, keterangan: d.keterangan || null, diperiksa_oleh: u.id, dibuat_pada: ts };
      const ft = { id: nextId('foto'), pemeriksaan_id: p.id, nama_berkas: `${a.kode_aset}_${today().replace(/-/g, '')}.jpg`, url: d.foto, dibuat_pada: ts };
      db.aset.push(a); db.pemeriksaan.push(p); db.foto.push(ft);
      if (!persist()) { db.aset.pop(); db.pemeriksaan.pop(); db.foto.pop(); return; }  // gagal simpan → data tidak berubah
      draft = null;
      openModal(`<div class="success-ico"><svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg></div>
        <h3>Aset tersimpan</h3><p>Kode aset <b>${esc(a.kode_aset)}</b> tersimpan di basis data terpusat.</p>
        <div class="btn-row"><a class="btn" href="#/input/1">Input lagi</a><a class="btn primary" href="#/peta?aset=${a.id}">Lihat di peta</a></div>`, { center: true });
    };
  }

  /* --- Blok form kondisi + foto (dipakai Input langkah 2 & Periksa Ulang) --- */
  function formKondisi(d, kat, withPanjang) {
    const isMarka = kat.kode === 'MRK';
    return `
      <div class="field"><span class="lbl">Kondisi</span>
        <div class="seg" id="segKondisi">${['Baik', 'Sedang', 'Rusak'].map(v => `<button type="button" data-v="${v}" class="${d.kondisi === v ? 'on' : ''}">${v}</button>`).join('')}</div></div>
      ${isMarka ? `<div class="field"><span class="lbl">Visibilitas marka</span>
        <div class="seg" id="segVis">${['Jelas', 'Kurang', 'Tidak terlihat'].map(v => `<button type="button" data-v="${v}" class="neutral ${d.visibilitas === v ? 'on' : ''}">${v}</button>`).join('')}</div></div>` : ''}
      ${withPanjang ? `<div class="field"><label>Panjang segmen, meter <span class="hint">(khusus marka dan guardrail)</span></label>
        <input class="input" id="inPanjang" type="number" min="0" step="0.01" inputmode="decimal" ${kat.linear ? '' : 'disabled'} placeholder="${kat.linear ? 'cth. 120' : '—'}" value="${kat.linear ? esc(d.panjang_meter) : ''}"></div>` : ''}
      <div class="field"><span class="lbl">Foto dokumentasi <span class="hint">(wajib)</span></span>
        <label class="photo-drop ${d.foto ? 'has' : ''}" id="dropFoto">
          ${d.foto ? `<img src="${d.foto}" alt="Foto"><span class="btn sm retake">Ganti foto</span>`
            : `<span><svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>Ketuk untuk ambil foto</span>`}
          <input type="file" accept="image/*" capture="environment" id="inFoto" hidden>
        </label></div>
      <div class="field"><label for="inKet">Keterangan <span class="hint">(bagian yang perlu ditangani)</span></label>
        <textarea class="input" id="inKet" placeholder="Catatan petugas…">${esc(d.keterangan)}</textarea></div>`;
  }
  function bindKondisi(d, kat) {
    $$('#segKondisi button').forEach(b => b.onclick = () => { d.kondisi = b.dataset.v; $$('#segKondisi button').forEach(x => x.classList.toggle('on', x === b)); });
    $$('#segVis button').forEach(b => b.onclick = () => { d.visibilitas = b.dataset.v; $$('#segVis button').forEach(x => x.classList.toggle('on', x === b)); });
    const pj = $('#inPanjang'); if (pj) pj.oninput = () => d.panjang_meter = pj.value;
    $('#inKet').oninput = (e) => d.keterangan = e.target.value;
    $('#inFoto').onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try {
        d.foto = await compressImage(file);
        const drop = $('#dropFoto');
        drop.classList.add('has'); drop.classList.remove('invalid');
        drop.querySelector('img, span:not(.retake)')?.remove();
        drop.insertAdjacentHTML('afterbegin', `<img src="${d.foto}" alt="Foto">`);
        if (!drop.querySelector('.retake')) drop.insertAdjacentHTML('beforeend', '<span class="btn sm retake">Ganti foto</span>');
      } catch { toast('Gagal membaca foto.', 'err'); }
    };
  }
  function validateKondisi(d, kat) {
    if (!d.kondisi) { toast('Pilih kondisi aset.', 'err'); return false; }
    if (kat.kode === 'MRK' && !d.visibilitas) { toast('Pilih visibilitas marka.', 'err'); return false; }
    if (d.panjang_meter && (+d.panjang_meter <= 0 || +d.panjang_meter > 5000)) { toast('Panjang segmen tidak wajar (0–5000 m).', 'err'); return false; }
    if (!d.foto) { $('#dropFoto').classList.add('invalid'); toast('Foto dokumentasi wajib dilampirkan.', 'err'); return false; }
    return true;
  }

  /* ====================== (e) PETA SEBARAN ====================== */
  function viewPeta(q) {
    const pilih = q.get('pilih') === '1';
    setChrome({ title: pilih ? 'Pilih Aset untuk Diperiksa' : 'Peta Sebaran', nav: 'peta' });
    view.innerHTML = `
      <div class="map-page" id="mapPage">
        <div id="map"></div>
        <div class="map-top">
          ${pilih ? `<div class="pick-banner">Ketuk penanda aset, lalu pilih “Periksa Ulang”. <button id="exitPick" aria-label="Tutup">✕</button></div>` : ''}
          <div class="map-bar">
            <div class="summary-chip" id="sumChip"></div>
            <button class="filter-btn" id="btnFilter"><svg viewBox="0 0 24 24"><path d="M3 5h18l-7 8v6l-4 2v-8z"/></svg>Filter</button>
          </div>
          <div class="chips" id="katChips">${db.kategori.map(k => `<button class="chip ${mapFilter.kat.has(k.id) ? '' : 'off'}" style="--c:${k.warna}" data-k="${k.id}"><i></i>${esc(k.nama)}</button>`).join('')}</div>
        </div>
        <button class="btn sm locate-btn" id="btnLocate" style="background:#fff;box-shadow:var(--shadow)">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/></svg> Lokasi saya</button>
        <div id="cardSlot"></div>
      </div>`;

    if (typeof L === 'undefined') {
      $('#map').innerHTML = '<div class="empty" style="padding-top:140px">Pustaka peta (Leaflet) gagal dimuat. Periksa koneksi internet.</div>';
      return;
    }
    map = L.map('map', { zoomControl: false, attributionControl: true }).fitBounds(KAB_BOUNDS);
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    const layer = L.layerGroup().addTo(map);
    let selected = null; const markers = new Map();
    setTimeout(() => map && map.invalidateSize(), 60);

    function draw() {
      layer.clearLayers(); markers.clear();
      const list = db.aset.map(info).filter(x => mapFilter.kat.has(x.k.id)
        && (!mapFilter.kec || x.kec.id === +mapFilter.kec)
        && (!mapFilter.kondisi || x.last?.kondisi === mapFilter.kondisi));
      for (const x of list) {
        const c = mapFilter.warna === 'kondisi' ? (KONDISI_WARNA[x.last?.kondisi] || '#999') : x.k.warna;
        if (x.k.linear && x.a.panjang_meter) {   // garis gambaran segmen memanjang
          const b = ((x.a.id * 47) % 180) * Math.PI / 180, h = x.a.panjang_meter / 2;
          const dLat = (h * Math.cos(b)) / 111320, dLng = (h * Math.sin(b)) / (111320 * Math.cos(x.a.latitude * Math.PI / 180));
          L.polyline([[x.a.latitude - dLat, x.a.longitude - dLng], [x.a.latitude + dLat, x.a.longitude + dLng]],
            { color: c, weight: 6, opacity: .75, dashArray: x.k.kode === 'MRK' ? '8 6' : null }).addTo(layer);
        }
        const m = L.marker([x.a.latitude, x.a.longitude], {
          icon: L.divIcon({ className: '', html: `<div class="mk ${selected === x.a.id ? 'sel' : ''}" style="--c:${c}">${x.k.huruf}</div>`, iconSize: [26, 26], iconAnchor: [13, 13] }),
          title: x.a.kode_aset,
        }).addTo(layer).on('click', () => select(x.a.id, false));
        markers.set(x.a.id, m);
      }
      const n = { Baik: 0, Sedang: 0, Rusak: 0 }; list.forEach(x => x.last && n[x.last.kondisi]++);
      $('#sumChip').innerHTML = `<span><b>${list.length}</b> aset</span>
        <span><i style="background:${KONDISI_WARNA.Baik}"></i>Baik ${n.Baik}</span>
        <span><i style="background:${KONDISI_WARNA.Sedang}"></i>Sedang ${n.Sedang}</span>
        <span><i style="background:${KONDISI_WARNA.Rusak}"></i>Rusak ${n.Rusak}</span>`;
      $('#btnFilter').style.background = (mapFilter.kec || mapFilter.kondisi) ? 'var(--primary-soft)' : '#fff';
    }

    function select(id, fly) {
      selected = id; draw();
      const x = info(byId('aset', id));
      if (fly) map.setView([x.a.latitude, x.a.longitude], 16);
      $('#mapPage').classList.add('has-card');
      $('#cardSlot').innerHTML = `
        <div class="card asset-card">
          <button class="close" aria-label="Tutup">×</button>
          <img class="ph" src="${fotoSrc(x.foto, x.k.kode)}" alt="Foto ${esc(x.a.kode_aset)}">
          <div class="info">
            <h3>${esc(x.j.nama)} · ${esc(x.a.kode_aset)}</h3>
            <p>${esc(x.kec.nama)} · ${esc(x.ruas.nama)} · ${esc(x.ruas.status_jalan)}</p>
            ${badge(x.last?.kondisi)} <span class="muted">${x.last ? fmtDate(x.last.tanggal_survei) : ''}</span>
            <div class="acts"><a class="btn sm" href="#/aset/${id}">Detail Lengkap</a><a class="btn sm primary" href="#/periksa/${id}">Periksa Ulang</a></div>
          </div>
        </div>`;
      $('#cardSlot .close').onclick = () => { selected = null; $('#cardSlot').innerHTML = ''; $('#mapPage').classList.remove('has-card'); draw(); };
      $('#cardSlot .ph').onclick = () => zoomPhoto(fotoSrc(x.foto, x.k.kode));
    }

    draw();
    if (q.get('aset')) select(+q.get('aset'), true);

    $$('#katChips .chip').forEach(ch => ch.onclick = () => {
      const id = +ch.dataset.k;
      mapFilter.kat.has(id) ? mapFilter.kat.delete(id) : mapFilter.kat.add(id);
      ch.classList.toggle('off', !mapFilter.kat.has(id)); draw();
    });
    $('#exitPick') && ($('#exitPick').onclick = () => go('#/peta'));
    $('#btnFilter').onclick = () => openModal(`
      <h3>Filter peta</h3>
      <div class="field"><label>Kecamatan</label><select class="input" id="fKec"><option value="">Semua kecamatan</option>
        ${db.kecamatan.map(k => `<option value="${k.id}" ${String(mapFilter.kec) === String(k.id) ? 'selected' : ''}>${esc(k.nama)}</option>`).join('')}</select></div>
      <div class="field"><label>Kondisi terakhir</label><select class="input" id="fKon"><option value="">Semua kondisi</option>
        ${['Baik', 'Sedang', 'Rusak'].map(v => `<option ${mapFilter.kondisi === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="field"><label>Warna penanda berdasarkan</label><select class="input" id="fWarna">
        <option value="kategori" ${mapFilter.warna === 'kategori' ? 'selected' : ''}>Kategori</option>
        <option value="kondisi" ${mapFilter.warna === 'kondisi' ? 'selected' : ''}>Kondisi</option></select></div>
      <div class="btn-row"><button class="btn" id="fReset">Reset</button><button class="btn primary" id="fApply">Terapkan</button></div>`,
      { onOpen: (m) => {
        $('#fApply', m).onclick = () => {
          mapFilter.kec = $('#fKec', m).value; mapFilter.kondisi = $('#fKon', m).value; mapFilter.warna = $('#fWarna', m).value;
          closeModal(); draw();
          if (mapFilter.kec) { const k = byId('kecamatan', +mapFilter.kec); map.setView([k._lat, k._lng], 13); }
        };
        $('#fReset', m).onclick = () => { mapFilter.kec = ''; mapFilter.kondisi = ''; mapFilter.warna = 'kategori'; closeModal(); draw(); map.fitBounds(KAB_BOUNDS); };
      } });

    let meLayer = null;
    $('#btnLocate').onclick = () => {
      if (!navigator.geolocation) return toast('Geolokasi tidak didukung.', 'err');
      toast('Mencari lokasi…');
      navigator.geolocation.getCurrentPosition((pos) => {
        if (!map) return;
        const ll = [pos.coords.latitude, pos.coords.longitude];
        meLayer && meLayer.remove();
        meLayer = L.layerGroup([
          L.circle(ll, { radius: pos.coords.accuracy, color: '#1e88e5', weight: 1, fillOpacity: .12 }),
          L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }) }),
        ]).addTo(map);
        map.setView(ll, 15);
        if (!cekWilayah(ll[0], ll[1]).ok) toast('Lokasi Anda di luar wilayah Kab. Malang.');
      }, () => toast('Lokasi tidak tersedia / izin ditolak.', 'err'), { enableHighAccuracy: true, timeout: 12000 });
    };
  }

  /* ====================== DETAIL LENGKAP ====================== */
  function viewDetail(id) {
    const a = byId('aset', id);
    if (!a) { toast('Aset tidak ditemukan.', 'err'); return go('#/peta'); }
    setChrome({ title: `Detail ${a.kode_aset}`, nav: 'peta', back: true });
    const x = info(a);
    const pembuat = byId('pengguna', a.dibuat_oleh);
    const row = (k, v) => `<dt>${k}</dt><dd>${v ?? '—'}</dd>`;
    view.innerHTML = `
      <div class="hero"><img src="${fotoSrc(x.foto, x.k.kode)}" alt="Foto aset" id="heroImg">
        <div class="cap"><h2>${esc(x.j.nama)}</h2><p>${esc(a.kode_aset)} · ${esc(x.k.nama)}</p></div></div>
      <div class="page">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span>Kondisi terakhir: ${badge(x.last?.kondisi)}</span><span class="muted">${x.last ? fmtDate(x.last.tanggal_survei) : ''}</span></div>
        <div class="btn-row" style="margin-top:0"><a class="btn" href="#/peta?aset=${a.id}">Lihat di peta</a><a class="btn primary" href="#/periksa/${a.id}">Periksa Ulang</a></div>
        <div class="card panel" style="margin-bottom:14px">
          <p class="section-title">Identitas &amp; lokasi</p>
          <dl class="kv">
            ${row('Kode aset', esc(a.kode_aset))}
            ${row('Kategori', `<span class="kat-dot" style="background:${x.k.warna}"></span>${esc(x.k.nama)}`)}
            ${row('Jenis (kode)', `${esc(x.j.nama)} (${esc(x.j.kode)})`)}
            ${row('Kecamatan', esc(x.kec.nama))}
            ${row('Ruas jalan', esc(x.ruas.nama))}
            ${row('Status jalan', esc(x.ruas.status_jalan))}
            ${row('Posisi / arah', `${esc(a.posisi_penempatan)} · ${esc(a.arah_jalur || '—')}`)}
            ${row('Lokasi KM', esc(a.lokasi_km || '—'))}
            ${row('Panjang segmen', a.panjang_meter ? `${a.panjang_meter.toLocaleString('id-ID')} m` : '—')}
            ${row('Koordinat', `${a.latitude.toFixed(6)}, ${a.longitude.toFixed(6)}`)}
            ${row('Sumber / akurasi', `${esc(a.sumber_koordinat)}${a.akurasi_meter != null ? ' · ± ' + Math.round(a.akurasi_meter) + ' m' : ''}`)}
            ${row('Tanggal pasang', fmtDate(a.tanggal_pasang))}
            ${row('Dibuat oleh', `${esc(pembuat?.nama)}<div class="muted">${fmtDate(a.dibuat_pada)}</div>`)}
          </dl>
        </div>
        <div class="card panel">
          <p class="section-title">Riwayat pemeriksaan (${x.checks.length})</p>
          <ul class="timeline">
            ${x.checks.map(p => { const f = db.foto.find(ff => ff.pemeriksaan_id === p.id); const by = byId('pengguna', p.diperiksa_oleh);
              return `<li><img src="${fotoSrc(f, x.k.kode)}" alt="Foto pemeriksaan" data-zoom>
                <div><div>${badge(p.kondisi)} ${p.visibilitas ? `<span class="muted">· Visibilitas: ${esc(p.visibilitas)}</span>` : ''}</div>
                <div class="t-ket">${esc(p.keterangan || '—')}</div>
                <div class="t-meta">${fmtDate(p.tanggal_survei)} · ${esc(by?.nama)}</div></div></li>`; }).join('')}
          </ul>
        </div>
      </div>`;
    $('#heroImg').onclick = (e) => zoomPhoto(e.target.src);
    $$('[data-zoom]').forEach(img => img.onclick = () => zoomPhoto(img.src));
  }

  /* ====================== PERIKSA ULANG (catat pemeriksaan) ====================== */
  function viewPeriksa(id) {
    const a = byId('aset', id);
    if (!a) return go('#/peta?pilih=1');
    setChrome({ title: 'Catat Pemeriksaan', nav: 'peta', back: true });
    const x = info(a);
    const d = { tanggal: today(), kondisi: '', visibilitas: '', keterangan: '', foto: null };
    view.innerHTML = `
    <div class="page-wrap">
      <div class="form">
        <div class="card panel" style="display:flex;gap:12px;align-items:center;margin-bottom:14px">
          <img src="${fotoSrc(x.foto, x.k.kode)}" style="width:62px;height:62px;border-radius:8px;object-fit:cover" alt="">
          <div><b>${esc(x.j.nama)} · ${esc(a.kode_aset)}</b><div class="muted">${esc(x.kec.nama)} · ${esc(x.ruas.nama)}</div>
          <div style="margin-top:4px">Terakhir: ${badge(x.last?.kondisi)} <span class="muted">${x.last ? fmtDate(x.last.tanggal_survei) : ''}</span></div></div>
        </div>
        <div class="field"><label>Tanggal survei</label><input class="input" type="date" id="inTgl" value="${d.tanggal}" max="${today()}"></div>
        ${formKondisi(d, x.k, false)}
        <p class="muted">Pemeriksaan baru ditambahkan ke riwayat tanpa menimpa catatan sebelumnya.</p>
      </div>
      <div class="form-actions"><a class="btn" href="#/aset/${a.id}">Batal</a><button class="btn primary" id="btnSimpanP">Simpan</button></div>
    </div>`;
    bindKondisi(d, x.k);
    $('#inTgl').onchange = (e) => d.tanggal = e.target.value;
    $('#btnSimpanP').onclick = () => {
      if (!d.tanggal) return toast('Tanggal survei wajib diisi.', 'err');
      if (!validateKondisi(d, x.k)) return;
      const ts = nowTs();
      const p = { id: nextId('pemeriksaan'), aset_id: a.id, tanggal_survei: d.tanggal, kondisi: d.kondisi,
        visibilitas: x.k.kode === 'MRK' ? d.visibilitas : null, keterangan: d.keterangan || null, diperiksa_oleh: me().id, dibuat_pada: ts };
      const ft = { id: nextId('foto'), pemeriksaan_id: p.id, nama_berkas: `${a.kode_aset}_${d.tanggal.replace(/-/g, '')}.jpg`, url: d.foto, dibuat_pada: ts };
      db.pemeriksaan.push(p); db.foto.push(ft); a.diubah_pada = ts;
      if (!persist()) { db.pemeriksaan.pop(); db.foto.pop(); return; }
      toast('Pemeriksaan tersimpan', 'ok');
      history.replaceState(null, '', `#/aset/${a.id}`); render();
    };
  }

  /* ====================== AKUN ====================== */
  function viewAkun() {
    setChrome({ title: 'Akun', nav: 'akun' });
    const u = me();
    const inisial = u.nama.split(' ').map(s => s[0]).slice(0, 2).join('');
    const nAset = db.aset.filter(a => a.dibuat_oleh === u.id).length;
    const nPer = db.pemeriksaan.filter(p => p.diperiksa_oleh === u.id).length;
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    view.innerHTML = `
      <div class="page">
        <div class="card profile"><div class="avatar">${esc(inisial)}</div>
          <div><h2>${esc(u.nama)}</h2><p>@${esc(u.nama_pengguna)} · Petugas lapangan</p><p>Akun ${u.aktif ? 'aktif' : 'nonaktif'} sejak ${fmtDate(u.dibuat_pada)}</p></div></div>
        <div class="stats" style="grid-template-columns:1fr 1fr">
          <div class="card stat"><b>${nAset}</b><small>Aset diinput</small></div>
          <div class="card stat"><b>${nPer}</b><small>Pemeriksaan</small></div>
        </div>
        <div class="card menu-list">
          ${!standalone ? `<button id="mInstall"><svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>Pasang aplikasi di layar utama</button>` : ''}
          <button id="mReset"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/></svg>Reset data dummy</button>
          <button id="mLogout" class="danger"><svg viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l-5-5 5-5M5 12h11"/></svg>Keluar</button>
        </div>
        <p class="muted" style="text-align:center">Prototipe PWA statik · data dummy Kabupaten Malang<br>
        ${db.aset.length} aset · ${db.pemeriksaan.length} pemeriksaan · ${db.kecamatan.length} kecamatan · ${db.ruas_jalan.length} ruas</p>
      </div>`;
    $('#mInstall') && ($('#mInstall').onclick = async () => {
      if (deferredInstall) { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; }
      else openModal(`<h3>Pasang aplikasi</h3><p>Android (Chrome): menu ⋮ → <b>Tambahkan ke layar utama</b> / <b>Instal aplikasi</b>.</p>
        <p>iPhone (Safari): tombol Bagikan → <b>Tambah ke Layar Utama</b>.</p><button class="btn primary block" data-x>Mengerti</button>`,
        { onOpen: m => $('[data-x]', m).onclick = closeModal });
    });
    $('#mReset').onclick = () => openModal(`<h3>Reset data dummy?</h3><p>Semua aset, pemeriksaan, dan foto yang Anda input di perangkat ini akan dihapus dan diganti data dummy awal.</p>
      <div class="btn-row"><button class="btn" data-x>Batal</button><button class="btn primary" data-ok style="background:var(--rusak);border-color:var(--rusak)">Reset</button></div>`,
      { onOpen: m => { $('[data-x]', m).onclick = closeModal; $('[data-ok]', m).onclick = () => { db = seedDB(); persist(); draft = null; closeModal(); toast('Data dummy dipulihkan', 'ok'); render(); }; } });
    $('#mLogout').onclick = () => { session = null; draft = null; localStorage.removeItem(SESSION_KEY); go('#/login'); };
  }

  /* ---------------- PWA ---------------- */
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
  }

  render();
})();
