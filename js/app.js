let currentView = "cdd-barista"; // template id, or "registre"
let disclaimerAccepted = false;
let registryCache = [];
let importedRows = null;

function esc(s) {
  return (s ?? "").toString().replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function todayISO() { return new Date().toISOString().slice(0, 10); }

function storageKey(templateId) { return `contrat-draft-${templateId}`; }
function loadDraft(templateId) { try { return JSON.parse(localStorage.getItem(storageKey(templateId)) || "{}"); } catch { return {}; } }
function saveDraft(templateId, values) { try { localStorage.setItem(storageKey(templateId), JSON.stringify(values)); } catch {} }

function recordLabel(record) {
  const v = record.values || {};
  return v.salarieNom || v.prestataireNom || "(sans nom)";
}
function recordAnnee(record) {
  const v = record.values || {};
  const d = v.dateSignature || v.dateDebut;
  return d ? new Date(d).getFullYear() : new Date(record.createdAt).getFullYear();
}

async function loadRegistry() {
  registryCache = await DB.dbGetAll("contrats");
}

async function saveRecordToRegistry(templateId, values) {
  const id = await DB.nextRef("CTR");
  const record = { id, templateId, values, createdAt: new Date().toISOString() };
  await DB.dbPut("contrats", record);
  await loadRegistry();
  return record;
}

// ---------- Navigation ----------
function renderNav() {
  const nav = document.getElementById("template-nav");
  const templateItems = Object.values(TEMPLATES)
    .map((t) => `<div class="nav-item ${currentView === t.id ? "active" : ""}" data-view="${t.id}">${t.nom}</div>`)
    .join("");
  nav.innerHTML = `
    <div class="nav-section-label">Modèles</div>
    ${templateItems}
    <div class="nav-section-label" style="margin-top:14px;">Archives</div>
    <div class="nav-item ${currentView === "registre" ? "active" : ""}" data-view="registre">Registre annuel</div>
  `;
  nav.querySelectorAll("[data-view]").forEach((el) =>
    el.addEventListener("click", () => { currentView = el.dataset.view; render(); })
  );
}

function fieldHtml(champ, value) {
  const val = value ?? champ.default ?? "";
  if (champ.type === "select") {
    return `<select id="champ-${champ.id}" data-champ="${champ.id}">${champ.options.map((o) => `<option ${val === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
  }
  if (champ.type === "textarea") {
    return `<textarea id="champ-${champ.id}" data-champ="${champ.id}" rows="3">${esc(val)}</textarea>`;
  }
  return `<input type="${champ.type}" id="champ-${champ.id}" data-champ="${champ.id}" value="${esc(val)}" ${champ.step ? `step="${champ.step}"` : ""}>`;
}

function collectValues(template) {
  const values = {};
  template.champs.forEach((c) => {
    const el = document.getElementById(`champ-${c.id}`);
    values[c.id] = el ? el.value : "";
  });
  return values;
}

function applyValuesToForm(template, values) {
  template.champs.forEach((c) => {
    const el = document.getElementById(`champ-${c.id}`);
    if (el && values[c.id] !== undefined) el.value = values[c.id];
  });
}

async function render() {
  renderNav();
  if (currentView === "registre") { await renderRegistre(); return; }
  renderGenerator();
}

// ---------- Générateur ----------
function renderGenerator() {
  const template = TEMPLATES[currentView];
  const draft = loadDraft(currentView);
  const main = document.getElementById("main");

  main.innerHTML = `
    <div class="page-title">${esc(template.nom)}</div>
    <div class="page-sub">${esc(template.intro)}</div>
    <div class="disclaimer">⚠️ Ce document est une <b>aide à la rédaction</b>, pas un document juridique certifié. Fais-le valider par un professionnel du droit ou ton expert-comptable avant toute signature.</div>

    <div class="toolbar">
      <div class="search">
        <button class="btn secondary small" id="btn-template-xlsx">Modèle Excel vierge</button>
        <label class="btn secondary small" style="cursor:pointer;">Importer un fichier<input type="file" id="input-import" accept=".csv,.xlsx" style="display:none;"></label>
      </div>
    </div>
    <div id="import-panel"></div>

    <div class="layout">
      <div class="card form-col">
        <h3>Informations à compléter</h3>
        <div class="form-grid">
          ${template.champs.map((c) => `<label class="${c.type === "textarea" ? "full" : ""}">${esc(c.label)}${fieldHtml(c, draft[c.id])}</label>`).join("")}
        </div>
      </div>
      <div class="card preview-col">
        <div class="preview-toolbar">
          <h3>Aperçu</h3>
          <label class="check"><input type="checkbox" id="accept-disclaimer" ${disclaimerAccepted ? "checked" : ""}> J'ai compris que ce document doit être validé avant usage</label>
        </div>
        <pre id="preview-text" class="preview"></pre>
        <div class="modal-actions" style="justify-content:flex-start;">
          <button class="btn" id="btn-pdf" ${disclaimerAccepted ? "" : "disabled"}>Télécharger en PDF</button>
          <button class="btn secondary" id="btn-copy">Copier le texte</button>
          <button class="btn secondary" id="btn-save-registry">Enregistrer dans le registre</button>
        </div>
      </div>
    </div>
  `;

  updatePreview();

  template.champs.forEach((c) => {
    document.getElementById(`champ-${c.id}`).addEventListener("input", () => {
      updatePreview();
      saveDraft(currentView, collectValues(template));
    });
  });

  document.getElementById("accept-disclaimer").addEventListener("change", (e) => {
    disclaimerAccepted = e.target.checked;
    document.getElementById("btn-pdf").disabled = !disclaimerAccepted;
  });
  document.getElementById("btn-pdf").addEventListener("click", () => generatePDF(template, collectValues(template)));
  document.getElementById("btn-copy").addEventListener("click", () => {
    navigator.clipboard.writeText(document.getElementById("preview-text").textContent).then(() => {
      const btn = document.getElementById("btn-copy");
      const original = btn.textContent;
      btn.textContent = "Copié !";
      setTimeout(() => (btn.textContent = original), 1500);
    });
  });
  document.getElementById("btn-save-registry").addEventListener("click", async () => {
    await saveRecordToRegistry(template.id, collectValues(template));
    const btn = document.getElementById("btn-save-registry");
    const original = btn.textContent;
    btn.textContent = "Enregistré ✓";
    setTimeout(() => (btn.textContent = original), 1500);
  });
  document.getElementById("btn-template-xlsx").addEventListener("click", () => downloadBlankTemplate(template));
  document.getElementById("input-import").addEventListener("change", (e) => handleImportFile(e, template));
}

function updatePreview() {
  const template = TEMPLATES[currentView];
  const values = collectValues(template);
  document.getElementById("preview-text").textContent = template.texte(values);
}

function generatePDF(template, values) {
  const text = template.texte(values);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 20;
  const maxWidth = 210 - margin * 2;
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.setFont("times", "normal");
  doc.setFontSize(10.5);
  let y = margin;
  const lineHeight = 5.2;
  const pageHeight = 297 - margin;
  lines.forEach((line) => {
    if (y > pageHeight) { doc.addPage(); y = margin; }
    doc.text(line, margin, y);
    y += lineHeight;
  });
  doc.save(`${template.id}-${(values.salarieNom || values.prestataireNom || "contrat").replace(/\s+/g, "_")}.pdf`);
}

// ---------- Export / Modèle Excel / Import ----------
function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function downloadBlankTemplate(template) {
  const headers = template.champs.map((c) => c.label);
  const exampleRow = {};
  template.champs.forEach((c) => {
    exampleRow[c.label] = c.type === "select" ? c.options[0] : c.default ?? "";
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet([exampleRow], { header: headers });
  XLSX.utils.book_append_sheet(wb, ws, "Modèle");
  XLSX.writeFile(wb, `modele-${template.id}.xlsx`);
}

function parseCSV(text) {
  const rows = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  if (rows.length === 0) return [];
  const delim = rows[0].includes(";") ? ";" : ",";
  const parseLine = (line) => {
    const out = []; let cur = ""; let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQuotes = false;
        else cur += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === delim) { out.push(cur); cur = ""; }
        else cur += ch;
      }
    }
    out.push(cur);
    return out;
  };
  const headers = parseLine(rows[0]);
  return rows.slice(1).map((line) => {
    const cells = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => (obj[h] = cells[i] ?? ""));
    return obj;
  });
}

function rowsFromLabels(template, rawRows) {
  const labelToId = {};
  template.champs.forEach((c) => (labelToId[c.label] = c.id));
  return rawRows.map((row) => {
    const values = {};
    Object.entries(row).forEach(([label, val]) => {
      const id = labelToId[label];
      if (id) values[id] = String(val ?? "");
    });
    return values;
  });
}

function handleImportFile(e, template) {
  const file = e.target.files[0];
  if (!file) return;
  const isXlsx = /\.xlsx$/i.test(file.name);
  const reader = new FileReader();
  reader.onload = (ev) => {
    let rawRows;
    if (isXlsx) {
      const wb = XLSX.read(ev.target.result, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    } else {
      rawRows = parseCSV(ev.target.result);
    }
    importedRows = rowsFromLabels(template, rawRows);
    renderImportPanel(template);
  };
  if (isXlsx) reader.readAsArrayBuffer(file);
  else reader.readAsText(file, "UTF-8");
  e.target.value = "";
}

function renderImportPanel(template) {
  const panel = document.getElementById("import-panel");
  if (!importedRows || importedRows.length === 0) {
    panel.innerHTML = `<div class="card empty">Aucune ligne exploitable dans le fichier importé.</div>`;
    return;
  }
  panel.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <h3>${importedRows.length} ligne(s) trouvée(s) dans le fichier</h3>
      <table><thead><tr><th></th>${template.champs.slice(0, 4).map((c) => `<th>${esc(c.label)}</th>`).join("")}<th></th></tr></thead>
      <tbody>
        ${importedRows
          .map(
            (row, i) => `<tr>
              <td><input type="checkbox" class="import-check" data-idx="${i}" checked></td>
              ${template.champs.slice(0, 4).map((c) => `<td>${esc(row[c.id] || "")}</td>`).join("")}
              <td><button class="btn secondary small" data-load-row="${i}">Charger dans le formulaire</button></td>
            </tr>`
          )
          .join("")}
      </tbody></table>
      <div class="modal-actions" style="justify-content:flex-start;">
        <button class="btn" id="btn-import-bulk">Enregistrer les lignes cochées dans le registre</button>
        <button class="btn secondary" id="btn-import-cancel">Annuler l'import</button>
      </div>
    </div>
  `;
  panel.querySelectorAll("[data-load-row]").forEach((btn) =>
    btn.addEventListener("click", () => {
      applyValuesToForm(template, importedRows[btn.dataset.loadRow]);
      updatePreview();
      saveDraft(currentView, collectValues(template));
      panel.innerHTML = "";
      importedRows = null;
    })
  );
  document.getElementById("btn-import-bulk").addEventListener("click", async () => {
    const checked = [...panel.querySelectorAll(".import-check:checked")].map((c) => Number(c.dataset.idx));
    for (const idx of checked) await saveRecordToRegistry(template.id, importedRows[idx]);
    importedRows = null;
    panel.innerHTML = `<div class="card" style="margin-bottom:16px;color:var(--slate);">${checked.length} contrat(s) enregistré(s) dans le registre.</div>`;
  });
  document.getElementById("btn-import-cancel").addEventListener("click", () => {
    importedRows = null;
    panel.innerHTML = "";
  });
}

// ---------- Registre ----------
async function renderRegistre(filterAnnee = "") {
  await loadRegistry();
  const annees = [...new Set(registryCache.map(recordAnnee))].sort((a, b) => b - a);
  const rows = registryCache
    .filter((r) => !filterAnnee || String(recordAnnee(r)) === filterAnnee)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const main = document.getElementById("main");
  main.innerHTML = `
    <div class="page-title">Registre annuel</div>
    <div class="page-sub">Tous les contrats enregistrés — extraits et sauvegardes pour ta gestion</div>
    <div class="toolbar">
      <div class="search">
        <select id="filtre-annee">
          <option value="">Toutes les années</option>
          ${annees.map((a) => `<option value="${a}" ${filterAnnee === String(a) ? "selected" : ""}>${a}</option>`).join("")}
        </select>
      </div>
      <div class="search">
        <button class="btn secondary" id="btn-export-csv">Export CSV</button>
        <button class="btn secondary" id="btn-export-xlsx">Export Excel</button>
      </div>
    </div>
    ${
      rows.length === 0
        ? `<div class="card empty">Aucun contrat enregistré ${filterAnnee ? "pour " + filterAnnee : ""} pour l'instant.</div>`
        : `<table><thead><tr><th>Référence</th><th>Année</th><th>Type</th><th>Nom</th><th>Date création</th><th></th></tr></thead><tbody>
        ${rows
          .map(
            (r) => `<tr>
              <td>${esc(r.id)}</td><td>${recordAnnee(r)}</td><td>${esc(TEMPLATES[r.templateId]?.nom || r.templateId)}</td>
              <td>${esc(recordLabel(r))}</td><td>${new Date(r.createdAt).toLocaleDateString("fr-FR")}</td>
              <td><button class="btn secondary small" data-pdf-record="${r.id}">PDF</button>
                  <button class="btn danger small" data-del-record="${r.id}">Suppr.</button></td>
            </tr>`
          )
          .join("")}
        </tbody></table>`
    }
  `;

  document.getElementById("filtre-annee").addEventListener("change", (e) => renderRegistre(e.target.value));
  document.getElementById("btn-export-csv").addEventListener("click", () => exportRegistry("csv", filterAnnee));
  document.getElementById("btn-export-xlsx").addEventListener("click", () => exportRegistry("xlsx", filterAnnee));
  main.querySelectorAll("[data-pdf-record]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const r = registryCache.find((x) => x.id === btn.dataset.pdfRecord);
      generatePDF(TEMPLATES[r.templateId], r.values);
    })
  );
  main.querySelectorAll("[data-del-record]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      if (!confirm("Supprimer ce contrat du registre ?")) return;
      await DB.dbDelete("contrats", btn.dataset.delRecord);
      renderRegistre(filterAnnee);
    })
  );
}

function exportRegistry(format, filterAnnee) {
  const rows = registryCache
    .filter((r) => !filterAnnee || String(recordAnnee(r)) === filterAnnee)
    .map((r) => ({
      Référence: r.id, Année: recordAnnee(r), Type: TEMPLATES[r.templateId]?.nom || r.templateId,
      Nom: recordLabel(r), "Date création": new Date(r.createdAt).toLocaleDateString("fr-FR"),
      ...r.values,
    }));
  if (format === "csv") {
    const headers = rows.length ? Object.keys(rows[0]) : ["Référence"];
    const escCsv = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = ["﻿" + headers.join(";"), ...rows.map((r) => headers.map((h) => escCsv(r[h])).join(";"))];
    downloadBlob(lines.join("\r\n"), "registre-contrats.csv", "text/csv;charset=utf-8");
  } else {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Registre");
    XLSX.writeFile(wb, "registre-contrats.xlsx");
  }
}

(async function init() {
  await loadRegistry();
  render();
})();
