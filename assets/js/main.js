const MANIFEST_URL = 'data/index.json';
let allRoms = [];
let loading = false;
const input = document.getElementById('search-input');
const btn = document.getElementById('search-btn');
const wrap = document.getElementById('results-wrap');
const stateMsg = document.getElementById('state-msg');
const statTotal = document.getElementById('stat-total');
const statConsoles = document.getElementById('stat-consoles');
async function loadAllData() {
try {
const manifest = await fetch(MANIFEST_URL).then(r => r.json());
const { consoles } = manifest;
const fetches = consoles.map(c =>
fetch(`data/${c}.json`)
.then(r => r.json())
.then(roms => roms.map(rom => ({ ...rom, _file: c })))
.catch(() => [])
);
const results = await Promise.all(fetches);
allRoms = results.flat();
statTotal.textContent = allRoms.length.toLocaleString('pt-BR');
statConsoles.textContent = consoles.map(c => c.toUpperCase()).join(' • ');
} catch (err) {
statTotal.textContent = 'ERRO';
statConsoles.textContent = 'Falha ao carregar banco';
console.error('[ROM Vault] Erro ao carregar dados:', err);
}
}
function formatSize(sizeStr) {
if (!sizeStr || sizeStr === '—') return '—';
const cleanStr = sizeStr.replace(/,/g, '').trim();
const num = parseFloat(cleanStr);
const unit = cleanStr.replace(/[0-9.]/g, '').toUpperCase();
if (isNaN(num)) return sizeStr;
if (unit.includes('K') && num >= 1024) {
const mb = (num / 1024).toFixed(1);
return `${mb.replace('.0', '')} MB`;
}
if (unit.includes('M') && num >= 1024) {
const gb = (num / 1024).toFixed(1);
return `${gb.replace('.0', '')} GB`;
}
return `${String(num).replace('.0', '')} ${unit.replace('K', 'KB').replace('M', 'MB')}`;
}
function search(query) {
const q = query.toLowerCase().trim();
if (!q) return [];
return allRoms.filter(r => r.name.toLowerCase().includes(q));
}
async function downloadMediafire(el, mfUrl) {
const original = el.textContent;
el.textContent = 'AGUARDE...';
el.style.pointerEvents = 'none';
el.classList.add('is-disabled');
try {
const endpoint = `/.netlify/functions/mediafire?url=${encodeURIComponent(mfUrl)}`;
const res = await fetch(endpoint);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const { url: directUrl } = await res.json();
const a = document.createElement('a');
a.href = directUrl;
a.download = '';
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
el.textContent = 'BAIXANDO...';
setTimeout(() => {
el.textContent = original;
el.style.pointerEvents = '';
el.classList.remove('is-disabled');
}, 3000);
} catch (err) {
console.error('[MediaFire]', err);
el.textContent = 'ERRO!';
setTimeout(() => {
el.textContent = original;
el.style.pointerEvents = '';
el.classList.remove('is-disabled');
}, 2000);
}
}
window.downloadMediafire = downloadMediafire;
function renderResults(roms, query) {
wrap.innerHTML = '';
if (!query.trim()) {
wrap.innerHTML = '';
return;
}
if (roms.length === 0) {
wrap.innerHTML = `
<div class="state-msg">
<span class="icon">❌</span>
NENHUM DADO ENCONTRADO<br>
<span style="font-size:0.4rem;color:var(--border)">TENTE OUTRO TERMO DE BUSCA</span>
</div>`;
return;
}
const header = document.createElement('div');
header.style.cssText = 'font-size:0.42rem;color:var(--muted);margin-bottom:0.75rem;';
header.textContent = `${roms.length} resultado(s) para "${query.toUpperCase()}"`;
wrap.appendChild(header);
roms.forEach((rom, i) => {
const isMF = rom.link && rom.link.includes('mediafire.com');
const item = document.createElement('div');
item.className = 'result-item';
item.style.animationDelay = `${i * 0.04}s`;
item.innerHTML = `
<div class="rom-info">
<div class="rom-name">${escapeHtml(rom.name)}</div>
<div class="rom-meta" style="display: flex; gap: 10px; align-items: center;">
<span class="tag-console" style="border: 1px solid var(--info); padding: 2px 6px;">${escapeHtml(rom.console)}</span>
<span class="tag-size" style="border: 1px solid var(--warning); padding: 2px 6px;">${escapeHtml(formatSize(rom.size))}</span>
<span class="tag-lang" style="color: var(--accent); border: 1px solid var(--accent); padding: 2px 6px;">PT-BR</span>
</div>
</div>
${isMF
? `<a href="#" class="nes-btn is-primary btn-download" onclick="event.preventDefault(); window.downloadMediafire(this, '${escapeHtml(rom.link)}')">BAIXAR</a>`
: `<a href="${escapeHtml(rom.link)}" class="nes-btn is-primary btn-download" download target="_blank" rel="noopener">BAIXAR</a>`
}
`;
wrap.appendChild(item);
});
}
function escapeHtml(str) {
if (str == null) return '';
return String(str)
.replace(/&/g, '&amp;')
.replace(/</g, '&lt;')
.replace(/>/g, '&gt;')
.replace(/"/g, '&quot;');
}
btn.addEventListener('click', () => {
renderResults(search(input.value), input.value);
});
input.addEventListener('keydown', e => {
if (e.key === 'Enter') {
renderResults(search(input.value), input.value);
}
});
let debounceTimer;
input.addEventListener('input', () => {
clearTimeout(debounceTimer);
debounceTimer = setTimeout(() => {
if (input.value.length >= 2) {
renderResults(search(input.value), input.value);
} else if (input.value.length === 0) {
renderResults([], '');
}
}, 300);
});
loadAllData().then(() => {
input.focus();
const footerRoms = document.getElementById('footer-stat-roms');
if (footerRoms) {
const sync = () => {
const val = statTotal.textContent.trim();
if (val && val !== '—') footerRoms.textContent = val;
};
new MutationObserver(sync).observe(statTotal, { childList: true, characterData: true, subtree: true });
sync();
}
});