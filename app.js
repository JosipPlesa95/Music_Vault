// ═══════════════════════════════════════════════════
//  app.js  —  Music Vault
//  Predmet: Podatkovna Povezanost i Digitalna Infrastruktura
//  Demonstrira: XML, XML Schema, XPath, JSON, localStorage
// ═══════════════════════════════════════════════════

// ── XML Schema (XSD) kao string ─────────────────────────────────
// Ovo je schema koja definira strukturu naše XML baze albuma.
// U pravom projektu bio bi poseban .xsd file, ali browser ne
// može čitati lokalne fileove, pa ga čuvamo ovdje kao string.
const XSD_SCHEMA = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">

  <xs:element name="library">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="album" type="albumType"
                    minOccurs="0" maxOccurs="unbounded"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>

  <xs:complexType name="albumType">
    <xs:sequence>
      <xs:element name="title"    type="xs:string"/>
      <xs:element name="artist"   type="xs:string"/>
      <xs:element name="year"     type="xs:gYear"/>
      <xs:element name="genre"    type="xs:string"/>
      <xs:element name="rating"   type="ratingType"/>
      <xs:element name="tracks"   type="tracksType"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string" use="required"/>
  </xs:complexType>

  <xs:simpleType name="ratingType">
    <xs:restriction base="xs:integer">
      <xs:minInclusive value="1"/>
      <xs:maxInclusive value="5"/>
    </xs:restriction>
  </xs:simpleType>

  <xs:complexType name="tracksType">
    <xs:sequence>
      <xs:element name="track" type="trackType"
                  minOccurs="1" maxOccurs="unbounded"/>
    </xs:sequence>
  </xs:complexType>

  <xs:complexType name="trackType">
    <xs:sequence>
      <xs:element name="name"     type="xs:string"/>
      <xs:element name="duration" type="xs:string"/>
    </xs:sequence>
    <xs:attribute name="num" type="xs:positiveInteger" use="required"/>
  </xs:complexType>

</xs:schema>`;

// ── Defaultni XML users (login baza) ────────────────────────────
// Simuliramo users.xml — u pravoj aplikaciji bio bi na serveru
const DEFAULT_USERS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<users>
  <user id="u1">
    <username>admin</username>
    <password>admin123</password>
    <displayName>Admin</displayName>
  </user>
  <user id="u2">
    <username>josip</username>
    <password>glazba2024</password>
    <displayName>Josip</displayName>
  </user>
</users>`;

// ── Defaultni XML albumi (početni podaci) ────────────────────────
const DEFAULT_MUSIC_XML = `<?xml version="1.0" encoding="UTF-8"?>
<library>
  <album id="a1">
    <title>Random Access Memories</title>
    <artist>Daft Punk</artist>
    <year>2013</year>
    <genre>Electronic</genre>
    <rating>5</rating>
    <tracks>
      <track num="1"><name>Give Life Back to Music</name><duration>4:34</duration></track>
      <track num="2"><name>Giorgio by Moroder</name><duration>9:05</duration></track>
      <track num="3"><name>Instant Crush</name><duration>5:37</duration></track>
      <track num="4"><name>Get Lucky</name><duration>6:09</duration></track>
    </tracks>
  </album>
  <album id="a2">
    <title>OK Computer</title>
    <artist>Radiohead</artist>
    <year>1997</year>
    <genre>Alternative</genre>
    <rating>5</rating>
    <tracks>
      <track num="1"><name>Airbag</name><duration>4:44</duration></track>
      <track num="2"><name>Paranoid Android</name><duration>6:23</duration></track>
      <track num="3"><name>Subterranean Homesick Alien</name><duration>4:27</duration></track>
    </tracks>
  </album>
  <album id="a3">
    <title>Currents</title>
    <artist>Tame Impala</artist>
    <year>2015</year>
    <genre>Psychedelic Pop</genre>
    <rating>4</rating>
    <tracks>
      <track num="1"><name>Let It Happen</name><duration>7:47</duration></track>
      <track num="2"><name>Nangs</name><duration>1:49</duration></track>
      <track num="3"><name>The Moment</name><duration>4:16</duration></track>
    </tracks>
  </album>
</library>`;

// ════════════════════════════════════════════════════
//  STORAGE HELPERS  —  XML u localStorage
// ════════════════════════════════════════════════════

function initStorage() {
  if (!localStorage.getItem('music_users_xml')) {
    localStorage.setItem('music_users_xml', DEFAULT_USERS_XML);
  }
  if (!localStorage.getItem('music_db_xml')) {
    localStorage.setItem('music_db_xml', DEFAULT_MUSIC_XML);
  }
}

// Čita XML iz localStorage i parsira ga u DOM objekt
function getXmlDoc(key) {
  const xmlStr = localStorage.getItem(key) || '';
  const parser = new DOMParser();
  return parser.parseFromString(xmlStr, 'application/xml');
}

// Serializira XML DOM objekt nazad u string i sprema
function saveXmlDoc(key, xmlDoc) {
  const serializer = new XMLSerializer();
  const xmlStr = serializer.serializeToString(xmlDoc);
  localStorage.setItem(key, xmlStr);
}

// Generira jedinstveni ID (timestamp-based)
function generateId(prefix) {
  return prefix + Date.now().toString(36);
}

// ════════════════════════════════════════════════════
//  AUTH  —  Login / Logout
// ════════════════════════════════════════════════════

// Provjerava korisnika u users.xml koristeći XPath-like querySelector
function authenticate(username, password) {
  const xmlDoc = getXmlDoc('music_users_xml');

  // Koristimo querySelectorAll — CSS selektori na XML DOM-u
  // Ekvivalent XPath: //user[username='...' and password='...']
  const users = xmlDoc.querySelectorAll('user');

  for (const user of users) {
    const uname = user.querySelector('username')?.textContent;
    const pass  = user.querySelector('password')?.textContent;
    const name  = user.querySelector('displayName')?.textContent;

    if (uname === username && pass === password) {
      return { id: user.getAttribute('id'), username: uname, displayName: name };
    }
  }
  return null;
}

function login(username, password) {
  const user = authenticate(username, password);
  if (user) {
    sessionStorage.setItem('current_user', JSON.stringify(user));
    return true;
  }
  return false;
}

function logout() {
  sessionStorage.removeItem('current_user');
  window.location.href = 'index.html';
}

function getCurrentUser() {
  const raw = sessionStorage.getItem('current_user');
  return raw ? JSON.parse(raw) : null;
}

function requireAuth() {
  if (!getCurrentUser()) {
    window.location.href = 'index.html';
  }
}

// ════════════════════════════════════════════════════
//  XML CRUD  —  Albumi
// ════════════════════════════════════════════════════

// Čita sve albume i vraća array objekata
function getAllAlbums() {
  const xmlDoc = getXmlDoc('music_db_xml');
  // XPath ekvivalent: //album
  const albumNodes = xmlDoc.querySelectorAll('album');
  const albums = [];

  albumNodes.forEach(node => {
    const tracks = [];
    node.querySelectorAll('track').forEach(t => {
      tracks.push({
        num: t.getAttribute('num'),
        name: t.querySelector('name')?.textContent || '',
        duration: t.querySelector('duration')?.textContent || ''
      });
    });

    albums.push({
      id:     node.getAttribute('id'),
      title:  node.querySelector('title')?.textContent || '',
      artist: node.querySelector('artist')?.textContent || '',
      year:   node.querySelector('year')?.textContent || '',
      genre:  node.querySelector('genre')?.textContent || '',
      rating: parseInt(node.querySelector('rating')?.textContent || '3'),
      tracks
    });
  });

  return albums;
}

// Filtrira albume — simulira XPath filtriranje
// XPath: //album[contains(genre,'Electronic') and year > 2010]
function filterAlbums(albums, { search = '', genre = '', yearFrom = '', yearTo = '' } = {}) {
  return albums.filter(a => {
    const matchSearch = !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.artist.toLowerCase().includes(search.toLowerCase());

    const matchGenre = !genre || a.genre.toLowerCase().includes(genre.toLowerCase());

    const matchYear = (!yearFrom || a.year >= yearFrom) &&
                      (!yearTo   || a.year <= yearTo);

    return matchSearch && matchGenre && matchYear;
  });
}

// Dodaje novi album u XML dokument
function addAlbum(albumData) {
  // Validacija (imitacija XML Schema restrikcija)
  const errors = validateAlbum(albumData);
  if (errors.length > 0) return { ok: false, errors };

  const xmlDoc = getXmlDoc('music_db_xml');
  const library = xmlDoc.querySelector('library');

  // Gradimo XML element programmatski
  const albumEl = xmlDoc.createElement('album');
  albumEl.setAttribute('id', generateId('a'));

  const fields = ['title', 'artist', 'year', 'genre', 'rating'];
  fields.forEach(f => {
    const el = xmlDoc.createElement(f);
    el.textContent = albumData[f];
    albumEl.appendChild(el);
  });

  const tracksEl = xmlDoc.createElement('tracks');
  albumData.tracks.forEach((t, i) => {
    const trackEl = xmlDoc.createElement('track');
    trackEl.setAttribute('num', i + 1);

    const nameEl = xmlDoc.createElement('name');
    nameEl.textContent = t.name;
    const durEl = xmlDoc.createElement('duration');
    durEl.textContent = t.duration;

    trackEl.appendChild(nameEl);
    trackEl.appendChild(durEl);
    tracksEl.appendChild(trackEl);
  });

  albumEl.appendChild(tracksEl);
  library.appendChild(albumEl);

  saveXmlDoc('music_db_xml', xmlDoc);
  return { ok: true };
}

// Briše album po ID-u
function deleteAlbum(id) {
  const xmlDoc = getXmlDoc('music_db_xml');
  // XPath: //album[@id='...']
  const albumNode = xmlDoc.querySelector(`album[id="${id}"]`);
  if (albumNode) {
    albumNode.parentNode.removeChild(albumNode);
    saveXmlDoc('music_db_xml', xmlDoc);
    return true;
  }
  return false;
}

// ════════════════════════════════════════════════════
//  VALIDACIJA  —  simulira XSD restrikcije
// ════════════════════════════════════════════════════

function validateAlbum(data) {
  const errors = [];

  // xs:string — nije prazno
  if (!data.title?.trim())  errors.push('Naslov je obavezan');
  if (!data.artist?.trim()) errors.push('Izvođač je obavezan');

  // xs:gYear — broj između 1900 i trenutne god.
  const year = parseInt(data.year);
  if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
    errors.push('Godina mora biti između 1900 i danas');
  }

  // ratingType: xs:integer minInclusive=1, maxInclusive=5
  const rating = parseInt(data.rating);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    errors.push('Ocjena mora biti između 1 i 5');
  }

  // minOccurs="1" na trackovima
  if (!data.tracks || data.tracks.length === 0) {
    errors.push('Album mora imati barem jednu pjesmu');
  } else {
    data.tracks.forEach((t, i) => {
      if (!t.name?.trim()) errors.push(`Pjesma ${i+1}: naziv je obavezan`);
    });
  }

  return errors;
}

// ════════════════════════════════════════════════════
//  JSON EXPORT  —  XML → JSON konverzija
// ════════════════════════════════════════════════════

function exportToJson() {
  const albums = getAllAlbums();
  const jsonObj = {
    library: {
      exportDate: new Date().toISOString(),
      totalAlbums: albums.length,
      albums: albums
    }
  };
  return JSON.stringify(jsonObj, null, 2);
}

function downloadJson() {
  const json = exportToJson();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'music-vault-export.json';
  a.click();
  URL.revokeObjectURL(url);
}

function downloadXml() {
  const xmlStr = localStorage.getItem('music_db_xml') || '';
  const blob = new Blob([xmlStr], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'music-vault.xml';
  a.click();
  URL.revokeObjectURL(url);
}

// ════════════════════════════════════════════════════
//  XML SYNTAX HIGHLIGHTER  (za prikaz raw XML-a)
// ════════════════════════════════════════════════════

function highlightXml(xmlStr) {
  return xmlStr
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(&lt;\/?)([\w:]+)/g, '<span class="xml-tag">$1$2</span>')
    .replace(/ ([\w:]+)=/g, ' <span class="xml-attr">$1</span>=')
    .replace(/=&quot;([^&]*)&quot;/g, '=<span class="xml-val">"$1"</span>')
    .replace(/&lt;!--.*?--&gt;/g, m => `<span class="xml-comment">${m}</span>`);
}

// ════════════════════════════════════════════════════
//  UI HELPERS
// ════════════════════════════════════════════════════

function starsHtml(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

const GENRE_EMOJI = {
  'electronic': '🎛️', 'alternative': '🎸', 'rock': '🎸',
  'pop': '🎵', 'jazz': '🎷', 'classical': '🎻',
  'hip-hop': '🎤', 'psychedelic': '🌀', 'default': '🎵'
};

function genreEmoji(genre) {
  const key = genre.toLowerCase();
  for (const k in GENRE_EMOJI) {
    if (key.includes(k)) return GENRE_EMOJI[k];
  }
  return GENRE_EMOJI.default;
}

function showAlert(el, msg, type = 'error') {
  el.textContent = msg;
  el.className = `alert alert-${type} show`;
  setTimeout(() => el.classList.remove('show'), 4000);
}

// ════════════════════════════════════════════════════
//  INICIJALIZACIJA
// ════════════════════════════════════════════════════
initStorage();
