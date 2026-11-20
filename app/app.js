/* Leonida Platinum Log — tracker + cited guides. All data comes from data/*.json. */
var TROPHIES = [], SOURCES = [], ROADMAP = null;
var earned = new Set(), counts = {};
var shield = true, filter = "all", gradeFilter = "all", search = "", sortMode = "roadmap";
var selected = "t03", view = "tracker";
var SHOT = null;

function $(id) { return document.getElementById(id); }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function citeHtml(list) { return (list || []).map(function (n) { return '<span class="cite">[' + n + ']</span>'; }).join(" "); }
function srcById(n) { for (var i = 0; i < SOURCES.length; i++) if (SOURCES[i].id === n) return SOURCES[i]; return null; }
function trophyById(id) { for (var i = 0; i < TROPHIES.length; i++) if (TROPHIES[i].id === id) return TROPHIES[i]; return null; }
function gradeLetter(t) { return t.grade; }
function isStory(t) { return t.kind === "story" || t.hidden; }
function hiddenName(t) { return shield && t.hidden && !earned.has(t.id); }

function loadJson(path) { return fetch(path).then(function (r) { if (!r.ok) throw new Error("cannot load " + path); return r.json(); }); }

function readHash() {
  var h = location.hash.slice(1), out = { earned: [], counts: {} };
  h.split("&").forEach(function (part) {
    var kv = part.split("=");
    if (kv[0] === "earned" && kv[1]) out.earned = kv[1].split(",");
    if (kv[0] === "counts" && kv[1]) kv[1].split(",").forEach(function (c) { var p = c.split(":"); out.counts[p[0]] = parseInt(p[1], 10) || 0; });
  });
  return out;
}
function writeHash() {
  var e = Array.from(earned).join(",");
  var c = Object.keys(counts).filter(function (k) { return counts[k] > 0; }).map(function (k) { return k + ":" + counts[k]; }).join(",");
  var h = "#earned=" + e + (c ? "&counts=" + c : "");
  try { history.replaceState(null, "", h); } catch (err) { /* offline file mode */ }
}
function save() {
  try { localStorage.setItem("leonida-log-v4", JSON.stringify({ earned: Array.from(earned), counts: counts, shield: shield })); } catch (err) { /* storage unavailable */ }
  writeHash(); renderAll();
}
function loadSaved() {
  var h = readHash();
  if (h.earned.length) { h.earned.forEach(function (id) { earned.add(id); }); counts = h.counts; return; }
  try {
    var raw = localStorage.getItem("leonida-log-v4");
    if (raw) { var d = JSON.parse(raw); (d.earned || []).forEach(function (id) { earned.add(id); }); counts = d.counts || {}; if (typeof d.shield === "boolean") shield = d.shield; }
  } catch (err) { /* ignore */ }
}

function stepsOf(t) { return t.steps || []; }
function allSteps() { var out = []; TROPHIES.forEach(function (t) { stepsOf(t).forEach(function (s) { out.push(s); }); }); return out; }
function disputesCount() { var n = 0; TROPHIES.forEach(function (t) { n += (t.disputes || []).length; }); return n; }
function unconfirmedCount() { return TROPHIES.filter(function (t) { return t.unconfirmed; }).length; }
function watchList() { return TROPHIES.filter(function (t) { return t.missable; }); }
function sitesCount() { var s = {}; SOURCES.forEach(function (x) { s[x.site] = 1; }); return Object.keys(s).length; }

function renderAudit() {
  var steps = allSteps();
  var cited = steps.filter(function (s) { return (s.c || []).length > 0; }).length;
  var backed2 = steps.filter(function (s) { return (s.c || []).length >= 2; }).length;
  var cites = 0; steps.forEach(function (s) { cites += (s.c || []).length; });
  $("auditStrip").innerHTML =
    "<span><b>" + TROPHIES.length + "/55</b> official name, description, grade</span>" +
    "<span><b>1P 2G 6S 46B</b></span><span><b>28</b> PSN-hidden</span>" +
    "<span><b>" + cited + "/" + steps.length + "</b> steps cited</span>" +
    "<span><b>" + backed2 + "</b> backed by 2+ sources</span>" +
    "<span><b>" + cites + "</b> citations</span>" +
    "<span><b>" + SOURCES.length + "</b> pages · <b>" + sitesCount() + "</b> sites read 20 Nov 2026</span>" +
    "<span><b>1</b> possibly missable · <b>8</b> at risk</span>" +
    "<span><b>" + unconfirmedCount() + "</b> unconfirmed</span>" +
    "<span><b>" + disputesCount() + "</b> disputes shown both ways</span>";
}

function renderProgress() {
  var grades = { P: [0, 0], G: [0, 0], S: [0, 0], B: [0, 0] };
  TROPHIES.forEach(function (t) { grades[t.grade][1]++; if (earned.has(t.id)) grades[t.grade][0]++; });
  var done = earned.size, total = TROPHIES.length, pct = Math.round(done / total * 100);
  $("progressBox").innerHTML = '<div class="big">' + done + "/" + total + " earned · " + pct + "%</div>" +
    '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
    '<div class="grades">P ' + grades.P[0] + "/" + grades.P[1] + " · G " + grades.G[0] + "/" + grades.G[1] + " · S " + grades.S[0] + "/" + grades.S[1] + " · B " + grades.B[0] + "/" + grades.B[1] + "</div>";
  $("shieldBtn").textContent = "Spoiler shield: " + (shield ? "ON" : "OFF");
}

var FILTERS = [["all", "All 55"], ["story", "Story"], ["missable", "Missable"], ["collectibles", "Collectibles"], ["activities", "Activities"], ["online", "Online 0"], ["hidden", "PSN-hidden"], ["disputed", "Disputed"], ["notearned", "Not earned"]];
function matchFilter(t) {
  if (filter === "story") return t.kind === "story";
  if (filter === "missable") return !!t.missable;
  if (filter === "collectibles") return t.kind === "collectible";
  if (filter === "activities") return t.kind === "activity";
  if (filter === "online") return false;
  if (filter === "hidden") return t.hidden;
  if (filter === "disputed") return (t.disputes || []).length > 0;
  if (filter === "notearned") return !earned.has(t.id);
  return true;
}
function filteredList() {
  var list = TROPHIES.filter(matchFilter);
  if (gradeFilter !== "all") list = list.filter(function (t) { return t.grade === gradeFilter; });
  if (search) { var q = search.toLowerCase(); list = list.filter(function (t) { return (t.name + " " + t.desc).toLowerCase().indexOf(q) >= 0; }); }
  if (sortMode === "name") list = list.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
  if (sortMode === "grade") { var order = { P: 0, G: 1, S: 2, B: 3 }; list = list.slice().sort(function (a, b) { return order[a.grade] - order[b.grade] || a.name.localeCompare(b.name); }); }
  if (sortMode === "stage") list = list.slice().sort(function (a, b) { return a.stage - b.stage || a.id.localeCompare(b.id); });
  return list;
}

function renderFilters() {
  var html = FILTERS.map(function (f) {
    var n = TROPHIES.filter(function (t) { return f[0] === "all" ? true : (function () { var old = filter; filter = f[0]; var m = matchFilter(t); filter = old; return m; })(); }).length;
    return '<button type="button" data-f="' + f[0] + '" class="' + (filter === f[0] ? "active" : "") + '">' + f[1] + " " + n + "</button>";
  }).join("");
  html += '<select id="gradeSel" aria-label="Grade filter"><option value="all">Grade: all</option><option value="P">Platinum</option><option value="G">Gold</option><option value="S">Silver</option><option value="B">Bronze</option></select>';
  $("filterBar").innerHTML = html;
  $("filterBar").querySelectorAll("button[data-f]").forEach(function (b) { b.addEventListener("click", function () { filter = b.getAttribute("data-f"); renderAll(); }); });
  var gs = $("gradeSel"); gs.value = gradeFilter;
  gs.addEventListener("change", function () { gradeFilter = gs.value; renderAll(); });
}

function renderList() {
  var list = filteredList();
  $("trophyList").innerHTML = list.map(function (t) {
    var hid = hiddenName(t), done = earned.has(t.id);
    var nm = hid ? "Hidden trophy — earn it to reveal" : esc(t.name);
    var ds = hid ? "Hidden on PlayStation until earned" : esc(t.desc);
    var badges = '<span class="badge ' + t.grade + '">' + t.grade + "</span>";
    if (t.hidden) badges += ' <span class="badge hid">PSN-hidden</span>';
    if (t.missable === "possible") badges += ' <span class="badge miss">POSSIBLY MISSABLE</span>';
    if (t.missable === "watch") badges += ' <span class="badge watch">WATCH</span>';
    if ((t.disputes || []).length) badges += ' <span class="badge">DISPUTED</span>';
    if (t.unconfirmed) badges += ' <span class="badge">UNCONFIRMED</span>';
    return '<li data-id="' + t.id + '" class="' + (t.id === selected ? "sel" : "") + (done ? " done" : "") + '">' +
      '<div class="nm">' + (done ? "✓ " : "") + nm + "</div><div class=\"ds\">" + ds + "</div>" +
      '<div class="meta">' + badges + "<span>Stage " + t.stage + "</span><span>" + stepsOf(t).length + " steps</span></div></li>";
  }).join("") || "<li>No trophies match this filter.</li>";
  $("trophyList").querySelectorAll("li[data-id]").forEach(function (li) { li.addEventListener("click", function () { selected = li.getAttribute("data-id"); renderAll(); }); });
}

function sourceCountsFor(t) {
  var map = {};
  stepsOf(t).forEach(function (s) { (s.c || []).forEach(function (n) { map[n] = (map[n] || 0) + 1; }); });
  return map;
}

function renderDetail() {
  var t = trophyById(selected) || TROPHIES[0];
  if (!t) { $("detailPane").innerHTML = ""; return; }
  var hid = hiddenName(t), done = earned.has(t.id);
  var nm = hid ? "Hidden trophy — earn it to reveal" : esc(t.name);
  var ds = hid ? "Hidden on PlayStation until earned — the guide stays behind the spoiler shield until you earn it or switch the shield off." : esc(t.desc);
  var html = "<h2>" + nm + ' <span class="badge ' + t.grade + '">' + (t.grade === "P" ? "Platinum" : t.grade === "G" ? "Gold" : t.grade === "S" ? "Silver" : "Bronze") + "</span></h2>";
  html += '<p class="desc">Official: ' + ds + "</p>";
  html += '<p><label class="checkline"><input type="checkbox" id="earnBox" ' + (done ? "checked" : "") + "> <b>" + (done ? "Earned" : "Mark as earned") + "</b> · Stage " + t.stage + " · " + (t.kind || "") + (t.hidden ? " · PSN-hidden" : "") + (t.missable === "possible" ? " · <b>POSSIBLY MISSABLE</b> — last chance: " + esc(t.last || "") + '"' : "") + (t.missable === "watch" ? " · <b>AT RISK</b> — last chance: " + esc(t.last || "") + '"' : "") + "</label></p>";
  if (t.counter) {
    var cur = counts[t.id] || 0;
    html += '<div class="counterbox">YOUR COUNT — <b>' + cur + "/" + t.counter.max + " " + esc(t.counter.label) + '</b> <button type="button" data-count="-1" aria-label="Decrease">−</button><button type="button" data-count="1" aria-label="Increase">+</button></div>';
  }
  html += '<ol class="steps">' + stepsOf(t).map(function (s) { return "<li>" + esc(s.t) + " " + citeHtml(s.c) + "</li>"; }).join("") + "</ol>";
  (t.disputes || []).forEach(function (d) {
    html += '<div class="dispute"><h3>SOURCES DIFFER — BOTH VERSIONS SHOWN</h3><div class="ab"><div><b>A —</b> ' + esc(d.a) + '</div><div><b>B —</b> ' + esc(d.b) + "</div></div>" +
      '<div class="call">' + esc(d.c) + "</div></div>";
  });
  if (t.unconfirmed) html += '<p><span class="badge">UNCONFIRMED</span> This trophy\'s method is still unconfirmed — no second source has verified it.</p>';
  var sc = sourceCountsFor(t);
  var ids = Object.keys(sc).map(Number).sort(function (a, b) { return sc[b] - sc[a]; });
  html += "<h3>Sources for this guide · " + ids.length + "</h3><p>" + ids.map(function (n) { var s = srcById(n); return s ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">[' + n + "] " + esc(s.site) + " — " + esc(s.page) + "</a> (" + sc[n] + " steps)" : ""; }).join("<br>") + "</p>";
  $("detailPane").innerHTML = html;
  var eb = $("earnBox"); if (eb) eb.addEventListener("change", function () { if (eb.checked) earned.add(t.id); else earned.delete(t.id); save(); });
  $("detailPane").querySelectorAll("button[data-count]").forEach(function (b) {
    b.addEventListener("click", function () {
      var d = parseInt(b.getAttribute("data-count"), 10);
      var cur = Math.max(0, Math.min(t.counter.max, (counts[t.id] || 0) + d));
      counts[t.id] = cur; save();
    });
  });
}

function renderRail() {
  var order = { possible: 0, watch: 1 };
  var next = TROPHIES.filter(function (t) { return t.missable && !earned.has(t.id); }).sort(function (a, b) { return (order[a.missable] - order[b.missable]) || a.stage - b.stage; }).slice(0, 6);
  var html = "<h3>NEXT UP — MISSABLE FIRST</h3>" + (next.length ? next.map(function (t) {
    return '<div class="next" data-id="' + t.id + '"><b>' + esc(t.name) + '</b><br><span class="cite">' + (t.missable === "possible" ? "POSSIBLY MISSABLE" : "WATCH") + " · last: " + esc(t.last || "") + "</span></div>";
  }).join("") : "<p>All missables earned.</p>");
  var t = trophyById(selected);
  if (t) {
    var sc = sourceCountsFor(t), ids = Object.keys(sc).map(Number).sort(function (a, b) { return sc[b] - sc[a]; });
    html += "<h3>SOURCES FOR THIS GUIDE · " + ids.length + "</h3><div class=\"srcs\">" + ids.map(function (n) { var s = srcById(n); return s ? "<div>[" + n + "] " + esc(s.site) + " — " + sc[n] + " step" + (sc[n] > 1 ? "s" : "") + "</div>" : ""; }).join("") + "</div>";
  }
  $("sideRail").innerHTML = html;
  $("sideRail").querySelectorAll(".next[data-id]").forEach(function (el) { el.addEventListener("click", function () { selected = el.getAttribute("data-id"); renderAll(); }); });
}

function renderRoadmap() {
  if (!ROADMAP) return;
  var meta = ROADMAP.meta.map(function (m) { return "<span>" + esc(m.label) + " " + citeHtml(m.cites) + "</span>"; }).join("");
  var stages = ROADMAP.stages.map(function (st) {
    var done = st.trophies.filter(function (id) { return earned.has(id); }).length;
    return '<div class="stage"><h3>Stage ' + st.n + " — " + esc(st.title) + ' <span class="prog">(' + done + "/" + st.trophies.length + " earned · " + esc(st.hours) + ")</span></h3>" +
      '<ol class="steps">' + st.steps.map(function (s) { return "<li>" + esc(s.t) + " " + citeHtml(s.c) + "</li>"; }).join("") + "</ol></div>";
  }).join("");
  var watch = ROADMAP.watch.map(function (w) {
    return '<div class="witem"><b>' + esc(w.name) + '</b><br>Last chance: <b>' + esc(w.last) + "</b> — " + esc(w.note) + " " + citeHtml(w.cites) + "</div>";
  }).join("");
  $("roadmapPane").innerHTML = "<h2>Roadmap to the Platinum</h2><div class=\"meta\">" + meta + "</div>" +
    '<div class="stages"><div>' + stages + '</div><aside class="watch"><h3>MISSABLE WATCH — 9 TROPHIES</h3>' + watch + "</aside></div>";
}

function lastChapter(t) {
  if (!t.last) return -1;
  var m = t.last.match(/Chapter (\d)/);
  if (m) return parseInt(m[1], 10);
  if (t.last.indexOf("Ch. 5") === 0) return 5;
  if (t.last.indexOf("Ch. 3") === 0) return 3;
  return 5;
}
function renderMissables() {
  if (!ROADMAP) return;
  var watch = ROADMAP.watch.map(function (w) { return trophyById(w.t); }).filter(Boolean);
  var cols = ["Ch1", "Ch2", "Ch3", "Ch4", "Ch5", "Post"];
  var rows = ROADMAP.watch.map(function (w) {
    var t = trophyById(w.t); if (!t) return "";
    var last = lastChapter(t), from = w.from || 1, hid = hiddenName(t);
    var cells = cols.map(function (c, i) {
      var ch = i + 1;
      if (ch === last) return '<td class="last">LAST — ' + esc(t.last) + "</td>";
      if (ch >= from && ch < last) return '<td>•</td>';
      return '<td class="x">—</td>';
    }).join("");
    return "<tr><td><b>" + (hid ? "Hidden trophy" : esc(t.name)) + '</b><br><span class="cite">' + (t.missable === "possible" ? "POSSIBLY MISSABLE" : "AT RISK") + "</span></td>" + cells + "</tr>";
  }).join("");
  var notes = watch.map(function (t) {
    var w = ROADMAP.watch.filter(function (x) { return x.t === t.id; })[0];
    return '<div class="wn"><b>' + esc(t.name) + "</b> — watch: " + esc(w.note) + " Last chance: <b>" + esc(w.last) + "</b> " + citeHtml(w.cites) + "</div>";
  }).join("");
  var gates = ROADMAP.gates.map(function (g) {
    var chips = g.trophies.map(function (id) { var tt = trophyById(id); return tt ? '<span class="chip2">' + esc(tt.name) + "</span>" : ""; }).join("");
    return '<div class="gate"><h4>' + esc(g.ch) + "</h4><p>" + esc(g.missions) + "</p><p>" + chips + "</p></div>";
  }).join("");
  $("missablesPane").innerHTML = "<h2>Missable windows — 9 trophies to watch</h2><p>Built from the official descriptions: which story chapters and missions, which collectibles and counts, in what order.</p>" +
    '<table class="grid"><tr><th>Trophy</th>' + cols.map(function (c) { return "<th>" + c + "</th>"; }).join("") + "</tr>" + rows + "</table>" +
    '<div class="watchnotes"><h3>Watch notes — one per trophy, cited</h3>' + notes + "</div>" +
    "<h3>Story gates — chapter by chapter</h3><div class=\"gates\">" + gates + "</div>";
}

function guidesCiting(n) { var set = {}; TROPHIES.forEach(function (t) { stepsOf(t).forEach(function (s) { if ((s.c || []).indexOf(n) >= 0) set[t.id] = 1; }); }); return Object.keys(set).length; }
function stepsCiting(n) { var c = 0; TROPHIES.forEach(function (t) { stepsOf(t).forEach(function (s) { if ((s.c || []).indexOf(n) >= 0) c++; }); }); return c; }

function renderSources() {
  var rows = SOURCES.map(function (s) {
    return "<tr><td>" + esc(s.site) + "</td><td><a href=\"" + esc(s.url) + "\" target=\"_blank\" rel=\"noopener\">" + esc(s.page) + "</a></td><td>" + esc(s.topic) + "</td><td>" + guidesCiting(s.id) + "</td><td>" + stepsCiting(s.id) + "</td></tr>";
  }).join("");
  var head = "<tr><th>#</th><th>Trophy</th>" + SOURCES.map(function (s) { return "<th title=\"" + esc(s.site + " — " + s.page) + "\">[" + s.id + "]</th>"; }).join("") + "</tr>";
  var mrows = TROPHIES.map(function (t) {
    var cells = SOURCES.map(function (s) {
      var c = 0; stepsOf(t).forEach(function (st) { if ((st.c || []).indexOf(s.id) >= 0) c++; });
      return c ? '<td class="n">' + c + "</td>" : "<td></td>";
    }).join("");
    return "<tr><td>" + esc(t.name) + "</td>" + cells + "</tr>";
  }).join("");
  $("sourcesPane").innerHTML = "<h2>" + SOURCES.length + " sources · each one read on the date shown</h2>" +
    "<h3>Trophy × Source matrix — steps citing each source</h3><div class=\"matrix\"><table>" + head + mrows + "</table></div>" +
    '<table class="srctable"><tr><th>Site</th><th>Page</th><th>Topic</th><th>Guides citing</th><th>Steps citing</th></tr>' + rows + "</table>" +
    "<p>Every source above is cited by at least one real guide step. No source is listed for show.</p>";
}

function renderAll() {
  renderProgress(); renderAudit();
  if (view === "tracker") { renderFilters(); renderList(); renderDetail(); renderRail(); }
  if (view === "roadmap") renderRoadmap();
  if (view === "missables") renderMissables();
  if (view === "sources") renderSources();
}
function setView(v) {
  view = v;
  document.querySelectorAll(".tabs button").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-view") === v); });
  document.querySelectorAll(".view").forEach(function (s) { s.hidden = s.id !== "view-" + v; });
  renderAll();
}

function bindChrome() {
  document.querySelectorAll(".tabs button").forEach(function (b) { b.addEventListener("click", function () { setView(b.getAttribute("data-view")); }); });
  $("shieldBtn").addEventListener("click", function () { shield = !shield; save(); });
  $("searchBox").addEventListener("input", function () { search = $("searchBox").value; renderList(); });
  $("sortBox").addEventListener("change", function () { sortMode = $("sortBox").value; renderList(); });
  $("exportBtn").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify({ earned: Array.from(earned), counts: counts }, null, 2)], { type: "application/json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "leonida-platinum-log.json"; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
  $("importBtn").addEventListener("click", function () { $("importFile").click(); });
  $("importFile").addEventListener("change", function () {
    var f = $("importFile").files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () { try { var d = JSON.parse(r.result); earned = new Set(d.earned || []); counts = d.counts || {}; save(); } catch (err) { alert("Import failed: not a Leonida log file."); } };
    r.readAsText(f);
  });
  $("shareBtn").addEventListener("click", function () {
    writeHash();
    var url = location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { $("savedNote").textContent = "Share link copied"; }, function () { $("savedNote").textContent = url; });
    else $("savedNote").textContent = url;
  });
}

function applyShotMode() {
  var q = new URLSearchParams(location.search);
  var shot = q.get("shot");
  if (!shot) return;
  SHOT = parseInt(shot, 10) || 1;
  shield = false;
  if (!localStorage.getItem("leonida-log-v4") && !location.hash) {
    ["t01", "t02", "t09", "t11", "t04", "t05", "t06", "t07", "t10", "t21"].forEach(function (id) { earned.add(id); });
    counts["t03"] = 6; counts["t20"] = 41; counts["t38"] = 23;
  }
  view = ["tracker", "roadmap", "missables", "sources"][SHOT - 1] || "tracker";
  selected = "t03";
}

Promise.all([loadJson("data/trophies.json"), loadJson("data/sources.json"), loadJson("data/roadmap.json")]).then(function (res) {
  TROPHIES = res[0].trophies; SOURCES = res[1].sources; ROADMAP = res[2];
  loadSaved(); applyShotMode(); bindChrome(); setView(view);
}).catch(function (err) {
  document.body.insertAdjacentHTML("beforeend", "<p>Failed to load guide data: " + esc(err.message) + "</p>");
});
