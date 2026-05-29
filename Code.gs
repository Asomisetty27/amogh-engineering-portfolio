// ═══════════════════════════════════════════════════════════════════
// THERMALOS APPS SCRIPT v3 — REORGANIZED FOR CLARITY
// Amogh (EE/Software) + Sam (ME/Hardware) · Cal Poly SLO / UCI · YC W27
// GPU Thermal-Power Forensics for Clusters Without Hyperscaler Tooling
// ═══════════════════════════════════════════════════════════════════
// INSTALL: Extensions → Apps Script → paste entire file into Code.gs
// THEN: Thermal OS menu → Run full refresh → accept permissions
// THEN: Set emails in ⚙️ Config sheet
// ═══════════════════════════════════════════════════════════════════

// ─── SHEET NAME CONSTANTS ────────────────────────────────────────
// ⚠️  Sheet names marked [API] are read by the live dashboard.
//     Do NOT rename them.
const SH = {
  // ── Visible daily-use tabs ────────────────────────────────────
  HOME:       "🏠 Home",
  TODAY:      "📋 Today Plan",         // [API] read by dashboard
  TIMELINE:   "🗓 Master Timeline",
  OUTREACH:   "📬 Outreach",           // [API] read by dashboard
  EVIDENCE:   "🏆 Evidence Board",     // [API] read by dashboard
  MEASURE:    "📡 Measurements",       // [API] read by dashboard
  CONFIG:     "⚙️ Config",
  // ── Hidden reference tabs (archived, not deleted) ─────────────
  MISSION:    "🚀 Mission Control",
  AMOGH:      "🔬 Amogh Research Plan",
  SAM:        "🔧 Sam Research Plan",
  SECTOR:     "🧠 Sector Intelligence",
  YC_APP:     "📝 YC Application",
  INTERVIEW:  "🎤 Interview Prep",
  COFOUNDER:  "🤝 Co-founder Plan",
  CHECKLIST:  "✅ YC Readiness",
  BOM:        "🛒 Parts BOM",
  LOG:        "📒 Automation Log",
};

// ─── TAB COLORS ──────────────────────────────────────────────────
// Green = daily work  Blue = you edit this  Amber = evidence
// Dark gray = auto-generated (don't touch)  Light gray = admin
const TAB = {
  GREEN: "#04342C",
  BLUE:  "#185FA5",
  AMBER: "#854F0B",
  GRAY:  "#3C3C3A",
  LGRAY: "#888780",
};

// ─── PALETTE ─────────────────────────────────────────────────────
const C = {
  TEAL:  "#04342C", TEAL_L: "#E6F7F1", TEAL_T: "#0A5441", TEAL_3: "#35C792",
  PUR:   "#26215C", PUR_L:  "#EEEDFE", PUR_T:  "#3C3489",
  RED:   "#993C1D", RED_L:  "#FAECE7",
  AMB:   "#854F0B", AMB_L:  "#FAEEDA", AMB_4:  "#EF9F27",
  GRN:   "#3B6D11", GRN_L:  "#EAF3DE",
  BLU:   "#185FA5", BLU_L:  "#E6F1FB",
  K9:    "#1A1917", K8:     "#2C2C2A", K6:     "#5F5E5A",
  K4:    "#888780", K1:     "#D3D1C7", K0:     "#F1EFE8", K00:    "#F7F6F2",
  W:     "#FFFFFF",
};

// ═══════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════

function log_(msg) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SH.LOG);
  if (!sh) {
    sh = ss.insertSheet(SH.LOG);
    sh.getRange(1,1,1,3).setValues([["Timestamp","Action","Detail"]])
      .setFontWeight("bold").setBackground(C.K8).setFontColor(C.W);
    sh.hideSheet();
  }
  sh.appendRow([new Date().toLocaleString(), msg, ""]);
}

function gs_(name) { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name); }

function gc_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function cfg_(key, def) {
  const sh = gs_(SH.CONFIG);
  if (!sh) return def;
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) return data[i][1] || def;
  }
  return def;
}

function setcfg_(key, value) {
  const sh = gc_(SH.CONFIG);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) { sh.getRange(i+1, 2).setValue(value); return; }
  }
  sh.appendRow([key, value]);
}

function colFor_(sh, header, headerRow) {
  headerRow = headerRow || 3;
  const lr = sh.getLastColumn();
  if (lr < 1) return -1;
  const headers = sh.getRange(headerRow, 1, 1, lr).getValues()[0];
  const idx = headers.indexOf(header);
  return idx >= 0 ? idx + 1 : -1;
}

function applyStatus_(range, status) {
  const m = {
    "Not Started":    [C.K0,    C.K6],
    "In Progress":    [C.AMB_L, C.AMB],
    "Done ✓":         [C.GRN_L, C.GRN],
    "Blocked ✗":      [C.RED_L, C.RED],
    "Not Contacted":  [C.K0,    C.K6],
    "Contacted":      [C.BLU_L, C.BLU],
    "Replied":        [C.AMB_L, C.AMB],
    "Meeting Set":    [C.PUR_L, C.PUR_T],
    "Positive Quote": [C.GRN_L, C.GRN],
    "No Response":    [C.RED_L, C.RED],
  };
  const [bg, fg] = m[status] || [C.W, C.K8];
  range.setBackground(bg).setFontColor(fg).setFontWeight("bold")
       .setHorizontalAlignment("center").setFontSize(9);
}

function applyPriority_(range, prio) {
  const m = {
    "P0 — Critical": [C.RED_L, C.RED],
    "P1 — High":     [C.AMB_L, C.AMB],
    "P2 — Normal":   [C.GRN_L, C.GRN],
  };
  const [bg, fg] = m[prio] || [C.W, C.K8];
  range.setBackground(bg).setFontColor(fg).setFontWeight("bold")
       .setHorizontalAlignment("center").setFontSize(9);
}

// ═══════════════════════════════════════════════════════════════════
// MENU
// ═══════════════════════════════════════════════════════════════════

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🌡 Thermal OS")
    .addItem("🔄 Full refresh (run each morning)", "fullRefresh")
    .addItem("📋 Open command sidebar", "openSidebar")
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu("✅ Task Control")
      .addItem("✅ Mark selected Done", "markDone")
      .addItem("🔄 Mark In Progress", "markInProgress")
      .addItem("🚫 Mark Blocked", "markBlocked")
      .addItem("↩️ Mark Not Started", "markNotStarted")
      .addItem("➕ Quick-add task to Timeline", "quickAddTask")
      .addItem("🔝 Push selected task to Today Plan", "pushToToday"))
    .addSubMenu(SpreadsheetApp.getUi().createMenu("📬 Outreach")
      .addItem("✉️ Draft Gmail from selected row", "draftOutreachEmail")
      .addItem("📅 Mark contacted today", "markContacted")
      .addItem("🔁 Generate follow-up tasks", "generateFollowUps")
      .addItem("📊 Outreach summary", "showOutreachSummary"))
    .addSubMenu(SpreadsheetApp.getUi().createMenu("📡 Measurements")
      .addItem("➕ Log rig measurement", "logMeasurement")
      .addItem("📊 Compute Rθ stats", "computeRthetaStats")
      .addItem("⚡ Log GPU telemetry snapshot", "logGPUSnapshot"))
    .addSubMenu(SpreadsheetApp.getUi().createMenu("🏆 YC + Evidence")
      .addItem("🏆 Rebuild Evidence Board", "buildEvidenceBoard")
      .addItem("🚨 Generate YC blocker tasks", "generateYCBlockers")
      .addItem("📋 Rebuild Today Plan", "buildTodayPlan"))
    .addSubMenu(SpreadsheetApp.getUi().createMenu("📊 Reports")
      .addItem("📊 Rebuild Home dashboard", "buildHomeSheet")
      .addItem("📧 Send weekly digest", "sendWeeklyDigest")
      .addItem("🔍 Audit stale/blocked tasks", "auditStaleTasks")
      .addItem("🧠 Competitor flash-card quiz", "competitorQuiz"))
    .addSubMenu(SpreadsheetApp.getUi().createMenu("⚙️ Admin")
      .addItem("🗂 Organize tabs (run once after install)", "organizeSheets")
      .addItem("👁 Show all hidden sheets", "showAllSheets")
      .addItem("🔧 Apply all formatting + dropdowns", "applyAllFormatting")
      .addItem("⏰ Install daily trigger (9am)", "installDailyTrigger")
      .addItem("🗑 Remove all triggers", "removeAllTriggers")
      .addItem("🔧 Setup Config sheet", "setupConfig"))
    .addToUi();
}

// ═══════════════════════════════════════════════════════════════════
// FULL REFRESH
// ═══════════════════════════════════════════════════════════════════

function fullRefresh() {
  setupConfig();
  applyAllFormatting();
  buildTodayPlan();
  buildEvidenceBoard();
  buildHomeSheet();        // ← rebuilds the landing page last so KPIs are fresh
  generateYCBlockers();
  log_("Full refresh complete");
  SpreadsheetApp.getActiveSpreadsheet().toast(
    "All sheets refreshed. Open 🏠 Home to see today's focus.",
    "🌡 Thermal OS — Done", 5);
}

// ═══════════════════════════════════════════════════════════════════
// 🏠 HOME SHEET — landing page / command center
// ═══════════════════════════════════════════════════════════════════

function buildHomeSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SH.HOME);
  if (!sh) { sh = ss.insertSheet(SH.HOME, 0); }
  sh.clearContents(); sh.clearFormats(); sh.clearConditionalFormatRules();

  const kpis = getKPIs_();

  // Column widths: 6 equal columns
  [28,22,22,22,22,22].forEach((w,i) => sh.setColumnWidth(i+1, w*5));

  // ── Row 1: Main header ─────────────────────────────────────────
  sh.getRange(1,1,1,6).merge()
    .setValue("🌡  THERMALOS — COMMAND CENTER")
    .setBackground(C.TEAL).setFontColor(C.W)
    .setFontWeight("bold").setFontSize(17)
    .setHorizontalAlignment("center").setVerticalAlignment("middle");
  sh.setRowHeight(1, 44);

  // ── Row 2: Subtitle ───────────────────────────────────────────
  sh.getRange(2,1,1,6).merge()
    .setValue("Amogh (EE/Software)  ·  Sam (ME/Hardware)  ·  Cal Poly SLO  ·  YC W27  ·  " +
              new Date().toLocaleDateString("en-US", {weekday:"long",month:"long",day:"numeric"}))
    .setBackground(C.TEAL_T).setFontColor(C.TEAL_L)
    .setFontSize(10).setHorizontalAlignment("center").setVerticalAlignment("middle");
  sh.setRowHeight(2, 22);

  // ── Row 3: spacer ─────────────────────────────────────────────
  sh.setRowHeight(3, 8);

  // ── Rows 4–5: KPI bar ─────────────────────────────────────────
  const kpiLabels = ["P0 OPEN",       "P1 OPEN",      "DONE ✓",     "OPERATORS MET",  "ENG QUOTES",  "DAYS TO YC"];
  const kpiValues = [kpis.p0,         kpis.p1,        kpis.done,    kpis.operators,   kpis.quotes,   kpis.days];
  const kpiBg     = [C.RED_L,         C.AMB_L,        C.GRN_L,      C.TEAL_L,         C.GRN_L,       kpis.days < 30 ? C.RED_L : C.K0];
  const kpiFg     = [C.RED,           C.AMB,          C.GRN,        C.TEAL_T,         C.GRN,         kpis.days < 30 ? C.RED : C.K6];

  sh.setRowHeight(4, 14);
  kpiLabels.forEach((h,i) => {
    sh.getRange(4,i+1).setValue(h).setBackground(C.K8).setFontColor(C.K1)
      .setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center").setVerticalAlignment("middle");
  });
  sh.setRowHeight(5, 38);
  kpiValues.forEach((v,i) => {
    sh.getRange(5,i+1).setValue(v).setBackground(kpiBg[i]).setFontColor(kpiFg[i])
      .setFontWeight("bold").setFontSize(24).setHorizontalAlignment("center").setVerticalAlignment("middle");
  });

  // ── Row 6: spacer ─────────────────────────────────────────────
  sh.setRowHeight(6, 12);

  // ── Rows 7–15: HOW THIS SPREADSHEET WORKS ─────────────────────
  sh.getRange(7,1,1,6).merge()
    .setValue("HOW THIS SPREADSHEET WORKS  —  which tabs to use and when")
    .setBackground(C.K8).setFontColor(C.W)
    .setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center").setVerticalAlignment("middle");
  sh.setRowHeight(7, 22);

  // Table header
  sh.getRange(8,1,1,6).setValues([["Tab","What it is","Who edits","When to update","",""]]);
  sh.getRange(8,1,1,6).setBackground(C.K8).setFontColor(C.K1).setFontWeight("bold")
    .setFontSize(9).setHorizontalAlignment("center");
  sh.setRowHeight(8, 16);

  const rows = [
    {tab:"📋 Today Plan",      color:TAB.GREEN, what:"Today's P0 + P1 tasks, auto-built each morning",                  who:"🤖 Auto only",         when:"Run 'Rebuild Today Plan' each morning. Read-only — do not edit."},
    {tab:"🗓 Master Timeline", color:TAB.BLUE,  what:"Every project task with phase, owner, priority, status",           who:"✏️ Both founders",     when:"Update Status column as you work. Add new tasks with Quick-add."},
    {tab:"📬 Outreach",        color:TAB.BLUE,  what:"Every person you contact for customer discovery",                  who:"✏️ Add row per contact",when:"After every call, email, or LinkedIn message."},
    {tab:"🏆 Evidence Board",  color:TAB.AMBER, what:"YC application claims — each needs real proof",                    who:"✏️ Status column only", when:"Weekly — change to 'In progress' or 'Proof exists ✓' as evidence accumulates."},
    {tab:"📡 Measurements",    color:TAB.GRAY,  what:"Physical rig + GPU telemetry data, auto-logged by script",         who:"🤖 Auto only",          when:"Use 'Log rig measurement' or 'Log GPU snapshot' from menu."},
    {tab:"⚙️ Config",          color:TAB.LGRAY, what:"Emails, thresholds, URLs — settings for automation",              who:"✏️ Set once on install", when:"Only when changing an email address or threshold."},
  ];

  rows.forEach((r, i) => {
    const row = 9 + i;
    sh.setRowHeight(row, 28);
    sh.getRange(row,1).setValue(r.tab)
      .setBackground(r.color).setFontColor(C.W)
      .setFontWeight("bold").setFontSize(10)
      .setHorizontalAlignment("center").setVerticalAlignment("middle");
    sh.getRange(row,2,1,3).merge().setValue(r.what)
      .setBackground(i%2===0 ? C.W : C.K00).setFontColor(C.K8)
      .setFontSize(10).setWrap(true).setVerticalAlignment("middle");
    sh.getRange(row,4).setValue(r.who)
      .setBackground(i%2===0 ? C.W : C.K00).setFontColor(C.K6)
      .setFontSize(9).setHorizontalAlignment("center").setVerticalAlignment("middle");
    sh.getRange(row,5,1,2).merge().setValue(r.when)
      .setBackground(i%2===0 ? C.W : C.K00).setFontColor(C.K4)
      .setFontSize(9).setFontStyle("italic").setWrap(true).setVerticalAlignment("middle");
  });

  // ── Row 15: spacer ────────────────────────────────────────────
  sh.setRowHeight(15, 12);

  // ── Rows 16–22: Quick Actions reference ───────────────────────
  sh.getRange(16,1,1,6).merge()
    .setValue("QUICK ACTIONS  (access via  🌡 Thermal OS  menu above)")
    .setBackground(C.K8).setFontColor(C.W)
    .setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center").setVerticalAlignment("middle");
  sh.setRowHeight(16, 22);

  const actions = [
    {label:"📋 Rebuild Today Plan",     path:"Thermal OS → YC + Evidence → Rebuild Today Plan",         bg:C.GRN_L,  fg:C.GRN},
    {label:"🔄 Full Refresh",           path:"Thermal OS → Full refresh (run each morning)",             bg:C.TEAL_L, fg:C.TEAL_T},
    {label:"➕ Log Rig Measurement",    path:"Thermal OS → Measurements → Log rig measurement",          bg:C.BLU_L,  fg:C.BLU},
    {label:"⚡ Log GPU Snapshot",       path:"Thermal OS → Measurements → Log GPU telemetry snapshot",   bg:C.BLU_L,  fg:C.BLU},
    {label:"✉️ Draft Outreach Email",   path:"Select a row in Outreach tab → Thermal OS → Outreach → Draft Gmail", bg:C.PUR_L, fg:C.PUR_T},
    {label:"🏆 Rebuild Evidence Board", path:"Thermal OS → YC + Evidence → Rebuild Evidence Board",     bg:C.AMB_L,  fg:C.AMB},
    {label:"🔍 Stale Task Audit",       path:"Thermal OS → Reports → Audit stale/blocked tasks",        bg:C.K00,    fg:C.K6},
    {label:"📧 Weekly Digest Email",    path:"Thermal OS → Reports → Send weekly digest",               bg:C.K00,    fg:C.K6},
  ];

  actions.forEach((a, i) => {
    const row = 17 + i;
    sh.setRowHeight(row, 22);
    sh.getRange(row,1,1,2).merge().setValue(a.label)
      .setBackground(a.bg).setFontColor(a.fg)
      .setFontWeight("bold").setFontSize(10).setVerticalAlignment("middle");
    sh.getRange(row,3,1,4).merge().setValue(a.path)
      .setBackground(i%2===0 ? C.W : C.K00).setFontColor(C.K6)
      .setFontSize(10).setFontStyle("italic").setVerticalAlignment("middle");
  });

  // ── Row 25: spacer ────────────────────────────────────────────
  sh.setRowHeight(25, 12);

  // ── Rows 26+: Today's open P0 tasks ──────────────────────────
  sh.getRange(26,1,1,6).merge()
    .setValue("TODAY'S OPEN P0 TASKS  (from Master Timeline)")
    .setBackground(C.RED).setFontColor(C.W)
    .setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center").setVerticalAlignment("middle");
  sh.setRowHeight(26, 22);

  const tl = gs_(SH.TIMELINE);
  let dataRow = 27;
  if (tl && tl.getLastRow() > 3) {
    const data = tl.getRange(4,1,tl.getLastRow()-3,9).getValues();
    let lastPhase = "", count = 0;
    data.forEach(r => {
      if (r[0]) lastPhase = r[0];
      if (r[5] !== "Done ✓" && r[6] === "P0 — Critical" && count < 12) {
        const owner = r[4] || "";
        const obg = owner==="Amogh" ? C.TEAL_L : owner==="Sam" ? C.PUR_L : C.AMB_L;
        const ofg = owner==="Amogh" ? C.TEAL_T : owner==="Sam" ? C.PUR_T : C.AMB;
        sh.setRowHeight(dataRow, 24);
        sh.getRange(dataRow,1).setValue(owner)
          .setBackground(obg).setFontColor(ofg)
          .setFontWeight("bold").setFontSize(9)
          .setHorizontalAlignment("center").setVerticalAlignment("middle");
        sh.getRange(dataRow,2).setValue(lastPhase.replace(/^Phase /,"P").split(" — ")[0])
          .setBackground(count%2===0?C.K00:C.W).setFontColor(C.K4)
          .setFontSize(9).setHorizontalAlignment("center").setVerticalAlignment("middle");
        sh.getRange(dataRow,3,1,4).merge().setValue(r[3])
          .setBackground(count%2===0?C.K00:C.W).setFontColor(C.K8)
          .setFontSize(11).setWrap(true).setVerticalAlignment("middle");
        dataRow++; count++;
      }
    });
    if (count === 0) {
      sh.setRowHeight(dataRow, 28);
      sh.getRange(dataRow,1,1,6).merge()
        .setValue("✓  No open P0 tasks — great momentum! Check P1 tasks in Today Plan.")
        .setBackground(C.GRN_L).setFontColor(C.GRN)
        .setFontWeight("bold").setFontSize(11).setHorizontalAlignment("center").setVerticalAlignment("middle");
      dataRow++;
    }
  } else {
    sh.setRowHeight(dataRow, 28);
    sh.getRange(dataRow,1,1,6).merge()
      .setValue("No timeline data yet — add tasks to 🗓 Master Timeline to see them here.")
      .setBackground(C.K00).setFontColor(C.K4)
      .setFontSize(10).setHorizontalAlignment("center").setVerticalAlignment("middle");
    dataRow++;
  }

  // ── Footer ────────────────────────────────────────────────────
  sh.setRowHeight(dataRow+1, 20);
  sh.getRange(dataRow+1,1,1,6).merge()
    .setValue("Last refreshed: " + new Date().toLocaleString() +
              "  ·  Run Thermal OS → Full refresh each morning to update")
    .setBackground(C.K00).setFontColor(C.K4)
    .setFontSize(9).setFontStyle("italic").setHorizontalAlignment("center").setVerticalAlignment("middle");

  sh.setFrozenRows(2);
  log_("Home sheet rebuilt");
}

// ═══════════════════════════════════════════════════════════════════
// ORGANIZE SHEETS — tab colors, order, hide reference tabs
// Run once after install: Thermal OS → Admin → Organize tabs
// ═══════════════════════════════════════════════════════════════════

function organizeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Make sure Home exists
  if (!ss.getSheetByName(SH.HOME)) buildHomeSheet();

  // 2. Color visible tabs
  const visibleColors = {
    [SH.HOME]:      TAB.GREEN,
    [SH.TODAY]:     TAB.GREEN,
    [SH.TIMELINE]:  TAB.BLUE,
    [SH.OUTREACH]:  TAB.BLUE,
    [SH.EVIDENCE]:  TAB.AMBER,
    [SH.MEASURE]:   TAB.GRAY,
    [SH.CONFIG]:    TAB.LGRAY,
  };
  Object.entries(visibleColors).forEach(([name, color]) => {
    const sh = ss.getSheetByName(name);
    if (sh) { sh.setTabColor(color); sh.showSheet(); }
  });

  // 3. Hide reference/archive tabs (not deleted — Thermal OS → Admin → Show all to restore)
  const toHide = [
    SH.MISSION, SH.AMOGH, SH.SAM, SH.SECTOR,
    SH.YC_APP, SH.INTERVIEW, SH.COFOUNDER,
    SH.CHECKLIST, SH.BOM, SH.LOG,
  ];
  toHide.forEach(name => {
    const sh = ss.getSheetByName(name);
    if (sh) { sh.setTabColor(TAB.LGRAY); sh.hideSheet(); }
  });

  // 4. Reorder visible tabs: move each to position 1 in reverse order
  //    so the final order is HOME → TODAY → TIMELINE → OUTREACH → EVIDENCE → MEASURE → CONFIG
  const order = [SH.HOME, SH.TODAY, SH.TIMELINE, SH.OUTREACH, SH.EVIDENCE, SH.MEASURE, SH.CONFIG];
  for (let i = order.length - 1; i >= 0; i--) {
    const sh = ss.getSheetByName(order[i]);
    if (sh && !sh.isSheetHidden()) {
      ss.setActiveSheet(sh);
      ss.moveActiveSheet(1);
    }
  }

  // 5. Land on Home
  const home = ss.getSheetByName(SH.HOME);
  if (home) ss.setActiveSheet(home);

  log_("Sheets organized");
  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Done! 7 tabs visible, reference sheets hidden.\n" +
    "To restore hidden sheets: Thermal OS → Admin → Show all hidden sheets.",
    "🗂 Tabs Organized", 6);
}

function showAllSheets() {
  SpreadsheetApp.getActiveSpreadsheet().getSheets().forEach(sh => sh.showSheet());
  SpreadsheetApp.getActiveSpreadsheet().toast("All sheets are now visible.", "Done", 3);
  log_("All sheets shown");
}

// ═══════════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════════

function openSidebar() {
  const kpis = getKPIs_();
  const html = HtmlService.createHtmlOutput(buildSidebarHTML_(kpis))
    .setTitle("🌡 Thermal OS").setWidth(320);
  SpreadsheetApp.getUi().showSidebar(html);
}

function buildSidebarHTML_(k) {
  return `<!DOCTYPE html><html><head><style>
*{box-sizing:border-box;margin:0;padding:0;font-family:Arial,sans-serif}
body{background:#F7F6F2;color:#2C2C2A;font-size:13px}
.hdr{background:#04342C;color:#fff;padding:14px 16px 12px}
.hdr h2{font-size:16px;margin-bottom:3px}
.hdr p{font-size:11px;color:#9FE1CB}
.kpis{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:12px}
.kpi{background:#fff;border-radius:6px;padding:8px;text-align:center;border:1px solid #D3D1C7}
.kn{font-size:20px;font-weight:bold}.kl{font-size:10px;color:#888780;margin-top:2px}
.red .kn{color:#993C1D}.amb .kn{color:#854F0B}.grn .kn{color:#3B6D11}.teal .kn{color:#0A5441}
.sec{padding:0 12px 8px}.st{font-size:10px;font-weight:bold;color:#888780;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.btn{display:block;width:100%;padding:9px 12px;border:none;border-radius:5px;font-size:12px;font-weight:bold;cursor:pointer;margin-bottom:5px;text-align:left}
.bt{background:#E6F7F1;color:#0A5441}.bt:hover{background:#C8F0E3}
.br{background:#FAECE7;color:#993C1D}.br:hover{background:#F8CFC2}
.ba{background:#FAEEDA;color:#854F0B}.ba:hover{background:#FAD998}
.bb{background:#E6F1FB;color:#185FA5}.bb:hover{background:#BDDAF7}
.bp{background:#EEEDFE;color:#3C3489}.bp:hover{background:#C8C5F0}
.bd{background:#2C2C2A;color:#fff}.bd:hover{background:#1A1917}
.ir{display:flex;gap:6px;margin-bottom:6px}.ir input{flex:1;padding:7px 10px;border:1px solid #D3D1C7;border-radius:5px;font-size:12px}
.ir button{padding:7px 12px;border:none;border-radius:5px;background:#04342C;color:#fff;font-size:12px;cursor:pointer;font-weight:bold}
.div{height:1px;background:#D3D1C7;margin:8px 12px}
.ft{padding:10px 12px;font-size:10px;color:#888780;border-top:1px solid #D3D1C7;margin-top:6px}
</style></head><body>
<div class="hdr"><h2>🌡 Thermal OS</h2><p>Amogh (EE) + Sam (ME) · YC W27</p></div>
<div class="kpis">
<div class="kpi red"><div class="kn">${k.p0}</div><div class="kl">P0 Open</div></div>
<div class="kpi amb"><div class="kn">${k.p1}</div><div class="kl">P1 Open</div></div>
<div class="kpi grn"><div class="kn">${k.done}</div><div class="kl">Done ✓</div></div>
<div class="kpi teal"><div class="kn">${k.operators}</div><div class="kl">Operators Met</div></div>
<div class="kpi"><div class="kn">${k.quotes}</div><div class="kl">Eng Quotes</div></div>
<div class="kpi"><div class="kn">${k.days}</div><div class="kl">Days to YC</div></div>
</div>
<div class="div"></div>
<div class="sec"><div class="st">⚡ Quick Actions</div>
<button class="btn bd" onclick="run('fullRefresh')">🔄 Full refresh everything</button>
<button class="btn bt" onclick="run('buildTodayPlan')">📋 Rebuild Today Plan</button>
<button class="btn bt" onclick="run('buildHomeSheet')">🏠 Rebuild Home dashboard</button>
<button class="btn br" onclick="run('generateYCBlockers')">🚨 Show YC blockers</button>
<button class="btn bb" onclick="run('buildEvidenceBoard')">🏆 Rebuild Evidence Board</button>
<button class="btn ba" onclick="run('competitorQuiz')">🧠 Competitor quiz</button>
</div>
<div class="sec"><div class="st">✅ Tasks</div>
<button class="btn bt" onclick="run('markDone')">✅ Mark selected Done</button>
<button class="btn ba" onclick="run('markInProgress')">🔄 Mark In Progress</button>
<button class="btn br" onclick="run('markBlocked')">🚫 Mark Blocked</button>
<div class="ir"><input type="text" id="qt" placeholder="Quick-add task to Timeline..."/>
<button onclick="qa()">Add</button></div></div>
<div class="sec"><div class="st">📬 Outreach</div>
<button class="btn bp" onclick="run('draftOutreachEmail')">✉️ Draft email from selected row</button>
<button class="btn bp" onclick="run('markContacted')">📅 Mark contacted today</button>
<button class="btn ba" onclick="run('generateFollowUps')">🔁 Generate follow-ups</button>
<button class="btn bb" onclick="run('showOutreachSummary')">📊 Summary</button></div>
<div class="sec"><div class="st">📡 Measurements</div>
<button class="btn bt" onclick="run('logMeasurement')">➕ Log rig measurement</button>
<button class="btn bb" onclick="run('logGPUSnapshot')">⚡ Log GPU snapshot</button>
<button class="btn ba" onclick="run('computeRthetaStats')">📊 Rθ stats</button></div>
<div class="ft">Last refresh: ${new Date().toLocaleString()}<br>Never put API keys in cells.</div>
<script>
function run(fn){google.script.run.withFailureHandler(e=>alert('Error: '+e.message))[fn]();}
function qa(){const t=document.getElementById('qt').value.trim();if(!t)return;
google.script.run.withSuccessHandler(()=>{document.getElementById('qt').value='';alert('Added!');}).quickAddTaskFromSidebar(t);}
</script></body></html>`;
}

// ═══════════════════════════════════════════════════════════════════
// KPI ENGINE
// ═══════════════════════════════════════════════════════════════════

function refreshMissionControl() {
  // Legacy stub — now delegates to buildHomeSheet so existing calls still work
  buildHomeSheet();
}

function getKPIs_() {
  const tl   = gs_(SH.TIMELINE);
  const out  = gs_(SH.OUTREACH);
  const meas = gs_(SH.MEASURE);

  let p0=0, p1=0, done=0, gpuRuns=0, powerExps=0, computeWins=0;
  if (tl && tl.getLastRow() > 3) {
    const data = tl.getRange(4,1,tl.getLastRow()-3,9).getValues();
    data.forEach(r => {
      const stat=r[5]||"", prio=r[6]||"", track=r[7]||"";
      if (stat==="Done ✓") { done++; return; }
      if (prio==="P0 — Critical") p0++;
      else if (prio==="P1 — High") p1++;
      if (stat==="Done ✓" && track==="Software") powerExps++;
    });
  }

  let operators=0, quotes=0, designPartners=0;
  if (out && out.getLastRow() > 3) {
    const data = out.getRange(4,1,out.getLastRow()-3,9).getValues();
    data.forEach(r => {
      const stat=r[5]||"", typ=r[4]||"";
      const met = ["Replied","Meeting Set","Positive Quote"].includes(stat);
      if (met) {
        if (typ.includes("HPC")||typ.includes("GPU Cloud")||typ.includes("AI Inference")||typ.includes("Server")) operators++;
        if (stat==="Positive Quote") quotes++;
      }
      if (stat==="Meeting Set" && typ.includes("Server")) designPartners++;
    });
  }

  if (meas && meas.getLastRow() > 3) {
    const data = meas.getRange(4,1,meas.getLastRow()-3,3).getValues();
    gpuRuns = data.filter(r => r[2]==="GPU_TELEMETRY").length;
  }

  const deadline = new Date(cfg_("YC_DEADLINE","2026-10-01"));
  const days = Math.max(0, Math.ceil((deadline - new Date()) / 86400000));

  return {p0, p1, done, gpuRuns, operators, powerExps, quotes, designPartners, computeWins, days};
}

// ═══════════════════════════════════════════════════════════════════
// TODAY PLAN
// ═══════════════════════════════════════════════════════════════════

function buildTodayPlan() {
  const sh = gc_(SH.TODAY);
  sh.clearContents(); sh.clearFormats();
  sh.setFrozenRows(3);

  // Header banner
  sh.getRange(1,1,1,6).merge()
    .setValue("📋 TODAY PLAN — " + new Date().toDateString())
    .setBackground(C.TEAL).setFontColor(C.W).setFontWeight("bold").setFontSize(13).setVerticalAlignment("middle");
  sh.setRowHeight(1,36);

  // Auto-generated warning banner
  sh.getRange(2,1,1,6).merge()
    .setValue("🤖  AUTO-GENERATED — do not edit manually. Run \"Rebuild Today Plan\" each morning to refresh.")
    .setBackground(C.AMB_L).setFontColor(C.AMB).setFontStyle("italic").setFontSize(9)
    .setHorizontalAlignment("center").setVerticalAlignment("middle");
  sh.setRowHeight(2,18);

  // Column headers
  const colHdrs = ["Priority","Phase","Milestone / Task","Owner","Track","Notes"];
  sh.getRange(3,1,1,6).setValues([colHdrs]).setBackground(C.K8).setFontColor(C.W)
    .setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  sh.setRowHeight(3,18);
  [14,22,56,12,12,28].forEach((w,i) => sh.setColumnWidth(i+1,w*4.5));

  const tl = gs_(SH.TIMELINE);
  if (!tl || tl.getLastRow() < 4) {
    sh.getRange(4,1).setValue("No timeline data yet. Add tasks to 🗓 Master Timeline first.");
    return;
  }
  const data = tl.getRange(4,1,tl.getLastRow()-3,9).getValues();
  const p0Tasks=[], p1Tasks=[];
  let lastPhase="";
  data.forEach(r => {
    if (r[0]) lastPhase=r[0];
    if (r[5]==="Done ✓") return;
    const entry=[r[6], lastPhase, r[3], r[4], r[7], r[8]];
    if (r[6]==="P0 — Critical") p0Tasks.push(entry);
    else if (r[6]==="P1 — High") p1Tasks.push(entry);
  });

  let row=4;
  if (p0Tasks.length > 0) {
    sh.getRange(row,1,1,6).merge().setValue("🔴 P0 — CRITICAL (" + p0Tasks.length + " open)")
      .setBackground(C.RED_L).setFontColor(C.RED).setFontWeight("bold").setFontSize(10);
    sh.setRowHeight(row,20); row++;
    p0Tasks.slice(0,15).forEach(t => {
      sh.setRowHeight(row,24);
      sh.getRange(row,1,1,6).setValues([t]);
      sh.getRange(row,1).setBackground(C.RED_L).setFontColor(C.RED).setFontWeight("bold").setHorizontalAlignment("center").setFontSize(9);
      sh.getRange(row,2).setBackground(C.K00).setFontColor(C.K6).setFontSize(9).setWrap(true);
      sh.getRange(row,3).setBackground(C.W).setFontColor(C.K8).setFontSize(10).setWrap(true);
      const ow=t[3]; const obg=ow==="Amogh"?C.TEAL_L:(ow==="Sam"?C.PUR_L:C.AMB_L);
      const ofg=ow==="Amogh"?C.TEAL_T:(ow==="Sam"?C.PUR_T:C.AMB);
      sh.getRange(row,4).setBackground(obg).setFontColor(ofg).setFontWeight("bold").setHorizontalAlignment("center").setFontSize(9);
      sh.getRange(row,5).setBackground(C.K00).setFontColor(C.K4).setHorizontalAlignment("center").setFontSize(9);
      sh.getRange(row,6).setBackground(C.K00).setFontColor(C.K4).setFontStyle("italic").setFontSize(9).setWrap(true);
      row++;
    });
  }
  sh.setRowHeight(row,8); row++;

  if (p1Tasks.length > 0) {
    sh.getRange(row,1,1,6).merge().setValue("🟡 P1 — HIGH (" + p1Tasks.length + " open)")
      .setBackground(C.AMB_L).setFontColor(C.AMB).setFontWeight("bold").setFontSize(10);
    sh.setRowHeight(row,20); row++;
    p1Tasks.slice(0,10).forEach(t => {
      sh.setRowHeight(row,24);
      sh.getRange(row,1,1,6).setValues([t]);
      sh.getRange(row,1).setBackground(C.AMB_L).setFontColor(C.AMB).setFontWeight("bold").setHorizontalAlignment("center").setFontSize(9);
      sh.getRange(row,2).setBackground(C.K00).setFontColor(C.K6).setFontSize(9);
      sh.getRange(row,3).setBackground(C.W).setFontColor(C.K8).setFontSize(10).setWrap(true);
      const ow=t[3]; const obg=ow==="Amogh"?C.TEAL_L:(ow==="Sam"?C.PUR_L:C.AMB_L);
      const ofg=ow==="Amogh"?C.TEAL_T:(ow==="Sam"?C.PUR_T:C.AMB);
      sh.getRange(row,4).setBackground(obg).setFontColor(ofg).setFontWeight("bold").setHorizontalAlignment("center").setFontSize(9);
      row++;
    });
  }

  sh.getRange(row+1,1,1,6).merge()
    .setValue("Auto-generated from 🗓 Master Timeline. Run \"Rebuild Today Plan\" each morning. P0 = do today · P1 = do this week.")
    .setFontColor(C.K4).setFontStyle("italic").setFontSize(9).setBackground(C.K00).setHorizontalAlignment("center");

  log_("Today Plan rebuilt: " + p0Tasks.length + " P0s, " + p1Tasks.length + " P1s");
}

// ═══════════════════════════════════════════════════════════════════
// TASK CONTROL
// ═══════════════════════════════════════════════════════════════════

function markDone()       { setStatus_("Done ✓"); }
function markInProgress() { setStatus_("In Progress"); }
function markBlocked()    { setStatus_("Blocked ✗"); }
function markNotStarted() { setStatus_("Not Started"); }

function setStatus_(status) {
  const sh = SpreadsheetApp.getActiveSheet();
  const sel = SpreadsheetApp.getActiveRange();
  if (!sel || sel.getRow() < 4) { SpreadsheetApp.getUi().alert("Select a task row first (in the Master Timeline tab)."); return; }
  const statCol = colFor_(sh,"Status") > 0 ? colFor_(sh,"Status") : colFor_(sh,"Status",3);
  if (statCol < 0) { SpreadsheetApp.getUi().alert("Status column not found. Make sure you're in the Master Timeline tab."); return; }
  const start = sel.getRow(), rows = sel.getNumRows();
  for (let r = start; r < start+rows; r++) {
    if (r < 4) continue;
    const cell = sh.getRange(r, statCol);
    cell.setValue(status); applyStatus_(cell, status);
    const msCol = colFor_(sh,"Milestone / Deliverable");
    if (msCol > 0) {
      const ms = sh.getRange(r, msCol);
      if (status==="Done ✓") ms.setFontLine("line-through").setFontColor(C.K4);
      else ms.setFontLine("none").setFontColor(C.K8);
    }
  }
  try { buildHomeSheet(); } catch(e) {}
  log_("Marked " + rows + " row(s): " + status);
  SpreadsheetApp.getActiveSpreadsheet().toast(rows + " row(s) → " + status, "Done", 3);
}

function pushToToday() {
  const sh = SpreadsheetApp.getActiveSheet();
  const sel = SpreadsheetApp.getActiveRange();
  if (!sel || sel.getRow() < 4) return;
  const msCol = colFor_(sh,"Milestone / Deliverable");
  if (msCol < 0) return;
  const ms = sh.getRange(sel.getRow(), msCol).getValue();
  const todaySh = gc_(SH.TODAY);
  const lr = Math.max(todaySh.getLastRow(), 3);
  todaySh.getRange(lr+1,3).setValue("★ PUSHED: " + ms)
    .setBackground(C.PUR_L).setFontColor(C.PUR_T).setFontWeight("bold");
  todaySh.getRange(lr+1,1).setValue("P0 — Critical")
    .setBackground(C.RED_L).setFontColor(C.RED).setFontWeight("bold").setHorizontalAlignment("center");
  SpreadsheetApp.getActiveSpreadsheet().toast("Task pushed to Today Plan.", "Done", 3);
}

function quickAddTask() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt("Quick Add Task","Enter milestone description:",ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  quickAddTaskFromSidebar(r.getResponseText());
}

function quickAddTaskFromSidebar(text) {
  if (!text || !text.trim()) return;
  const sh = gs_(SH.TIMELINE);
  if (!sh) { SpreadsheetApp.getActiveSpreadsheet().toast("Master Timeline sheet not found.", "Error", 4); return; }
  const lr = Math.max(sh.getLastRow(), 3) + 1;
  sh.getRange(lr,1,1,9).setValues([[
    "", "", new Date().toLocaleDateString(), text.trim(), "Amogh",
    "Not Started", "P0 — Critical", "Software", "Quick-added via Thermal OS"
  ]]);
  sh.getRange(lr,6).setBackground(C.K0).setFontColor(C.K6).setFontWeight("bold").setHorizontalAlignment("center");
  sh.getRange(lr,7).setBackground(C.RED_L).setFontColor(C.RED).setFontWeight("bold").setHorizontalAlignment("center");
  sh.setRowHeight(lr,22);
  log_("Quick-added: " + text);
  SpreadsheetApp.getActiveSpreadsheet().toast("Task added to Master Timeline.", "Done", 3);
}

// ═══════════════════════════════════════════════════════════════════
// FORMATTING + DROPDOWNS
// ═══════════════════════════════════════════════════════════════════

function applyAllFormatting() {
  applyTimelineFormatting_();
  applyOutreachFormatting_();
  applyMeasurementsHeader_();
  log_("All formatting applied");
  SpreadsheetApp.getActiveSpreadsheet().toast("Formatting + dropdowns refreshed.", "Done", 3);
}

function applyTimelineFormatting_() {
  const sh = gs_(SH.TIMELINE);
  if (!sh) return;

  // Ensure header rows exist (rows 1–3)
  if (sh.getLastRow() < 1 || sh.getRange(1,1).getValue() === "") {
    sh.getRange(1,1,1,9).merge()
      .setValue("🗓 MASTER TIMELINE — All project tasks")
      .setBackground(C.TEAL).setFontColor(C.W).setFontWeight("bold").setFontSize(13)
      .setVerticalAlignment("middle");
    sh.setRowHeight(1,36);
    sh.getRange(2,1,1,9).merge()
      .setValue("✏️  EDIT THIS SHEET — Update Status as you work. Add new tasks with Thermal OS → Task Control → Quick-add task.")
      .setBackground(C.BLU_L).setFontColor(C.BLU).setFontStyle("italic").setFontSize(9)
      .setHorizontalAlignment("center").setVerticalAlignment("middle");
    sh.setRowHeight(2,18);
    const hdrs = ["Phase","Week","Dates","Milestone / Deliverable","Owner","Status","Priority","Track","Notes"];
    sh.getRange(3,1,1,9).setValues([hdrs]).setBackground(C.K8).setFontColor(C.W)
      .setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
    sh.setFrozenRows(3);
    [22,10,18,60,12,16,18,14,24].forEach((w,i) => sh.setColumnWidth(i+1,w*4.5));
  } else {
    // Just refresh the edit banner
    sh.getRange(2,1,1,9).merge()
      .setValue("✏️  EDIT THIS SHEET — Update Status as you work. Add new tasks with Thermal OS → Task Control → Quick-add task.")
      .setBackground(C.BLU_L).setFontColor(C.BLU).setFontStyle("italic").setFontSize(9)
      .setHorizontalAlignment("center").setVerticalAlignment("middle");
  }

  if (sh.getLastRow() < 4) return;
  const lr = sh.getLastRow();
  const statCol = colFor_(sh,"Status"), prioCol = colFor_(sh,"Priority");
  const ownerCol = colFor_(sh,"Owner"), trackCol = colFor_(sh,"Track");
  const msCol = colFor_(sh,"Milestone / Deliverable");

  if (statCol > 0) {
    const sv = SpreadsheetApp.newDataValidation()
      .requireValueInList(["Not Started","In Progress","Done ✓","Blocked ✗"],true).build();
    sh.getRange(4, statCol, lr-3, 1).setDataValidation(sv);
  }
  if (prioCol > 0) {
    const pv = SpreadsheetApp.newDataValidation()
      .requireValueInList(["P0 — Critical","P1 — High","P2 — Normal"],true).build();
    sh.getRange(4, prioCol, lr-3, 1).setDataValidation(pv);
  }
  if (ownerCol > 0) {
    const ov = SpreadsheetApp.newDataValidation()
      .requireValueInList(["Amogh","Sam","Both"],true).build();
    sh.getRange(4, ownerCol, lr-3, 1).setDataValidation(ov);
  }

  const data = sh.getRange(4,1,lr-3,sh.getLastColumn()).getValues();
  data.forEach((row, i) => {
    const r = i + 4;
    const stat  = statCol  > 0 ? row[statCol-1]||""  : "";
    const prio  = prioCol  > 0 ? row[prioCol-1]||""  : "";
    const owner = ownerCol > 0 ? row[ownerCol-1]||"" : "";
    const track = trackCol > 0 ? row[trackCol-1]||"" : "";

    if (statCol > 0) applyStatus_(sh.getRange(r,statCol), stat);
    if (prioCol > 0) applyPriority_(sh.getRange(r,prioCol), prio);
    if (msCol > 0) {
      const ms = sh.getRange(r,msCol);
      if (stat==="Done ✓") ms.setFontLine("line-through").setFontColor(C.K4);
      else ms.setFontLine("none").setFontColor(C.K8);
    }
    if (ownerCol > 0) {
      const obg=owner==="Amogh"?C.TEAL_L:(owner==="Sam"?C.PUR_L:C.AMB_L);
      const ofg=owner==="Amogh"?C.TEAL_T:(owner==="Sam"?C.PUR_T:C.AMB);
      sh.getRange(r,ownerCol).setBackground(obg).setFontColor(ofg).setFontWeight("bold").setHorizontalAlignment("center");
    }
    if (trackCol > 0) {
      const tbg=track.includes("Software")?C.TEAL_L:(track==="Hardware"?C.PUR_L:(track.includes("Both")?C.AMB_L:C.BLU_L));
      const tfg=track.includes("Software")?C.TEAL_T:(track==="Hardware"?C.PUR_T:(track.includes("Both")?C.AMB:C.BLU));
      sh.getRange(r,trackCol).setBackground(tbg).setFontColor(tfg).setFontWeight("bold").setHorizontalAlignment("center");
    }
  });
}

function applyOutreachFormatting_() {
  const sh = gs_(SH.OUTREACH);
  if (!sh) return;

  // Ensure header rows exist
  if (sh.getLastRow() < 1 || sh.getRange(1,1).getValue() === "") {
    sh.getRange(1,1,1,9).merge()
      .setValue("📬 OUTREACH — Customer discovery contacts")
      .setBackground(C.TEAL).setFontColor(C.W).setFontWeight("bold").setFontSize(13).setVerticalAlignment("middle");
    sh.setRowHeight(1,36);
    sh.getRange(2,1,1,9).merge()
      .setValue("✏️  EDIT THIS SHEET — Add one row per person you contact. Update Status after each interaction.")
      .setBackground(C.BLU_L).setFontColor(C.BLU).setFontStyle("italic").setFontSize(9)
      .setHorizontalAlignment("center").setVerticalAlignment("middle");
    sh.setRowHeight(2,18);
    const hdrs = ["Name","Organization","Role","Email","Type","Status","Date","Priority","Notes / Quote"];
    sh.getRange(3,1,1,9).setValues([hdrs]).setBackground(C.K8).setFontColor(C.W)
      .setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
    sh.setFrozenRows(3);
  } else {
    sh.getRange(2,1,1,9).merge()
      .setValue("✏️  EDIT THIS SHEET — Add one row per person you contact. Update Status after each interaction.")
      .setBackground(C.BLU_L).setFontColor(C.BLU).setFontStyle("italic").setFontSize(9)
      .setHorizontalAlignment("center").setVerticalAlignment("middle");
  }

  if (sh.getLastRow() < 4) return;
  const lr = sh.getLastRow();
  const statCol = colFor_(sh,"Status"), prioCol = colFor_(sh,"Priority");
  if (statCol > 0) {
    const sv = SpreadsheetApp.newDataValidation()
      .requireValueInList(["Not Contacted","Contacted","Replied","Meeting Set","Positive Quote","No Response"],true).build();
    sh.getRange(4,statCol,lr-3,1).setDataValidation(sv);
    const data = sh.getRange(4,1,lr-3,sh.getLastColumn()).getValues();
    data.forEach((row,i) => {
      const r=i+4, stat=row[statCol-1]||"";
      if (stat) applyStatus_(sh.getRange(r,statCol), stat);
      if (prioCol>0) applyPriority_(sh.getRange(r,prioCol), row[prioCol-1]||"");
      if (stat==="Positive Quote") sh.getRange(r,1,1,sh.getLastColumn()).setBackground("#E8F8F0");
    });
  }
}

function applyMeasurementsHeader_() {
  const sh = gs_(SH.MEASURE);
  if (!sh) return;

  // Only set header rows if they're empty (don't overwrite data)
  if (sh.getRange(1,1).getValue() === "") {
    sh.getRange(1,1,1,20).merge()
      .setValue("📡 MEASUREMENTS — Physical rig + GPU telemetry data")
      .setBackground(C.TEAL).setFontColor(C.W).setFontWeight("bold").setFontSize(13).setVerticalAlignment("middle");
    sh.setRowHeight(1,36);
    sh.getRange(2,1,1,20).merge()
      .setValue("🤖  AUTO-GENERATED — do not edit manually. Use Thermal OS → Measurements → Log rig measurement / Log GPU snapshot.")
      .setBackground(C.K8).setFontColor(C.K4).setFontStyle("italic").setFontSize(9)
      .setHorizontalAlignment("center").setVerticalAlignment("middle");
    sh.setRowHeight(2,18);
    const hdrs = ["Run ID","Timestamp","Type","Material","Pressure (N)","Fault Condition",
                  "V","I","P (W)","T_hot (°C)","T_cold (°C)","T_amb (°C)","T_coolant (°C)",
                  "Throttle Reason","ΔT (°C)","Rθ (°C/W)","vs Baseline","Headroom (°C)","Alert","Notes"];
    sh.getRange(3,1,1,20).setValues([hdrs]).setBackground(C.K8).setFontColor(C.W)
      .setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
    sh.setFrozenRows(3);
  }
}

// ═══════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════

function setupConfig() {
  const sh = gc_(SH.CONFIG);
  sh.setTabColor(TAB.LGRAY);
  if (sh.getLastRow() < 2) {
    sh.getRange(1,1,1,3).setValues([["Key","Value","Description"]])
      .setFontWeight("bold").setBackground(C.TEAL).setFontColor(C.W);
    const cfgRows = [
      ["FOUNDER_EMAIL","","Your email for digest reports"],
      ["SAM_EMAIL","","Sam's email"],
      ["THERMAL_LIMIT_C","85","GPU throttle temp (H100=83°C, A100=85°C)"],
      ["HIGH_RTHETA_THRESH","0.5","Rθ alert threshold °C/W for rig"],
      ["GPU_RTHETA_ANOMALY_PCT","15","% above baseline = GPU anomaly flag"],
      ["FOLLOW_UP_DAYS","7","Days before follow-up auto-task"],
      ["YC_DEADLINE","2026-10-01","YC W27 deadline"],
      ["GITHUB_URL","https://github.com/","ThermalOS repo URL"],
      ["DASHBOARD_URL","https://amogh.site/thermalos","Live dashboard URL"],
      ["OUTREACH_GOAL","50","Target contacts"],
      ["CUSTOMER_GOAL","20","Target operator conversations"],
      ["DAILY_TRIGGER_HOUR","9","Daily refresh hour (24h)"],
      ["GPU_MODEL","","GPU being tested"],
      ["THROTTLE_TEMP_C","83","GPU-specific throttle temp"],
      ["COMPUTE_WATT_BASELINE","","Baseline compute/watt at full TDP"],
      ["DESIGN_PARTNER_1","","First design partner"],
    ];
    sh.getRange(2,1,cfgRows.length,3).setValues(cfgRows).setBackground(C.K00).setFontColor(C.K8);
    sh.getRange(2,1,cfgRows.length,1).setFontColor(C.TEAL_T).setFontWeight("bold");
    sh.setFrozenRows(1);
    sh.setColumnWidth(1,200); sh.setColumnWidth(2,200); sh.setColumnWidth(3,320);

    sh.getRange(1,1,1,3).offset(-1+1,0,1,3);  // no-op to avoid merge issue
    sh.getRange(1,4,1,1).merge().setValue("✏️ Set FOUNDER_EMAIL and SAM_EMAIL first, then run Full Refresh.")
      .setBackground(C.AMB_L).setFontColor(C.AMB).setFontWeight("bold").setFontSize(9)
      .setHorizontalAlignment("left").setVerticalAlignment("middle");
  }
  log_("Config initialized");
}

// ═══════════════════════════════════════════════════════════════════
// OUTREACH
// ═══════════════════════════════════════════════════════════════════

function draftOutreachEmail() {
  const sh = SpreadsheetApp.getActiveSheet();
  const sel = SpreadsheetApp.getActiveRange();
  if (!sel || sel.getRow() < 4) {
    SpreadsheetApp.getUi().alert("Select a row in the 📬 Outreach tab first.");
    return;
  }
  const r = sel.getRow();
  const nameCol = colFor_(sh,"Name"), compCol = colFor_(sh,"Organization"), typeCol = colFor_(sh,"Type");
  const name    = nameCol > 0 ? sh.getRange(r,nameCol).getValue() : "there";
  const company = compCol > 0 ? sh.getRange(r,compCol).getValue() : "";
  const type    = typeCol > 0 ? sh.getRange(r,typeCol).getValue() : "";
  const fname   = name.split(" ")[0].replace(/Dr\.|Prof\./g,"").trim();
  const github  = cfg_("GITHUB_URL","https://github.com/[your-repo]");
  const dashboard = cfg_("DASHBOARD_URL","https://amogh.site/thermalos");
  const isProf  = type.includes("Professor");
  const isHPC   = type.includes("HPC Lab") || type.includes("GPU Cloud") || type.includes("AI Inference");

  let subject, body;
  if (isProf) {
    subject = "Summer research interest — GPU thermal-power efficiency characterization (ENGR 400)";
    body = `Hi ${fname},

My name is Amogh Somisetty, and I'm an Electrical Engineering student at Cal Poly SLO. I'll be on campus this summer and I'm building a GPU thermal-power forensics tool for small and mid-size GPU clusters.

The project involves two tracks: my EE side builds a GPU telemetry collector and power-cap profiler that computes effective thermal resistance in real time from NVIDIA DCGM data. My ME co-founder builds a physical thermal validation rig that generates controlled cooling fault signatures. Together, these form a system that can diagnose whether GPU throttling is workload-driven or cooling-path-driven — something existing tools like DCGM cannot do.

I'd like to structure this as an ENGR 400 Independent Study. I handle the full build, data collection, and analysis independently — I'm looking for methodology guidance and ideally lab/sensor access.

Would you be open to a 15–20 minute meeting this week?

Best,
Amogh Somisetty
EE, Cal Poly SLO | President, Poly Engineering Consulting
GitHub: ${github} | Dashboard: ${dashboard}`;
  } else if (isHPC) {
    subject = "GPU thermal efficiency tool — looking for feedback from operators";
    body = `Hi ${fname},

My name is Amogh, and I'm building a read-only GPU thermal-power forensics tool for clusters like yours. It plugs into NVIDIA DCGM telemetry and turns raw data into specific recommendations: which GPUs are throttling, what power cap maximizes compute/watt, and whether thermal anomalies are workload-driven or cooling-path-driven.

I'm not selling anything — I'm in the customer discovery phase and looking to talk to people who manage GPU clusters. The install is 30 minutes, completely read-only, no control permissions needed.

Would you have 15 minutes for a call?

Best,
Amogh Somisetty
EE, Cal Poly SLO | ThermalOS
Dashboard: ${dashboard} | GitHub: ${github}`;
  } else {
    subject = "GPU thermal-power audit tool — feedback request";
    body = `Hi ${fname},

My name is Amogh, and I'm building ThermalOS Audit — a read-only GPU thermal-power forensics tool for small and mid-size GPU clusters. It takes NVIDIA DCGM telemetry and produces specific compute-per-watt recommendations and cooling anomaly diagnoses. 30-minute install, no CDU required, no control permissions needed.

I'd value your technical feedback, especially on whether this matches real operator pain at companies like ${company}.

Dashboard: ${dashboard}
GitHub: ${github}

Best,
Amogh Somisetty`;
  }

  GmailApp.createDraft("", subject, body);
  log_("Draft created for: " + name + " at " + company);
  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Draft created for " + fname + ". Open Gmail → Drafts to review.", "✉️ Draft Created", 6);
}

function markContacted() {
  const sh = SpreadsheetApp.getActiveSheet();
  const sel = SpreadsheetApp.getActiveRange();
  if (!sel || sel.getRow() < 4) return;
  const r = sel.getRow();
  const statCol = colFor_(sh,"Status"), dateCol = colFor_(sh,"Date");
  if (statCol < 0) return;
  sh.getRange(r,statCol).setValue("Contacted");
  applyStatus_(sh.getRange(r,statCol), "Contacted");
  if (dateCol > 0) sh.getRange(r,dateCol).setValue(new Date().toLocaleDateString());
  const fu = parseInt(cfg_("FOLLOW_UP_DAYS","7"));
  const fud = new Date(); fud.setDate(fud.getDate() + fu);
  const notesCol = colFor_(sh,"Notes / Quote");
  if (notesCol > 0) {
    const ex = sh.getRange(r,notesCol).getValue();
    sh.getRange(r,notesCol).setValue((ex ? ex+"\n" : "") + "Follow up by: " + fud.toLocaleDateString());
  }
  try { buildHomeSheet(); } catch(e) {}
  log_("Marked contacted: row " + r);
  SpreadsheetApp.getActiveSpreadsheet().toast("Marked contacted. Follow-up set for " + fud.toLocaleDateString(), "Done", 4);
}

function generateFollowUps() {
  const sh = gs_(SH.OUTREACH);
  if (!sh || sh.getLastRow() < 4) return;
  const fuDays = parseInt(cfg_("FOLLOW_UP_DAYS","7"));
  const today = new Date();
  const data = sh.getRange(4,1,sh.getLastRow()-3,sh.getLastColumn()).getValues();
  const statCol = colFor_(sh,"Status")-1, nameCol = colFor_(sh,"Name")-1, dateCol = colFor_(sh,"Date")-1;
  let count = 0;
  data.forEach((row) => {
    if (row[statCol] !== "Contacted") return;
    const sd = row[dateCol];
    if (!sd) return;
    const days = Math.ceil((today - new Date(sd)) / 86400000);
    if (days >= fuDays) {
      const tl = gs_(SH.TIMELINE);
      if (tl) {
        const lr = tl.getLastRow() + 1;
        tl.getRange(lr,1,1,9).setValues([[
          "","",new Date().toLocaleDateString(),
          "FOLLOW UP: " + row[nameCol] + " (contacted " + days + " days ago)",
          "Amogh","Not Started","P0 — Critical","Business","Auto follow-up"
        ]]);
        tl.getRange(lr,7).setBackground(C.RED_L).setFontColor(C.RED).setFontWeight("bold").setHorizontalAlignment("center");
        count++;
      }
    }
  });
  log_("Generated " + count + " follow-up tasks");
  SpreadsheetApp.getActiveSpreadsheet().toast(count + " follow-up task(s) added to Timeline.", "Done", 4);
}

function showOutreachSummary() {
  const sh = gs_(SH.OUTREACH);
  if (!sh || sh.getLastRow() < 4) { SpreadsheetApp.getUi().alert("No outreach data yet."); return; }
  const data = sh.getRange(4,1,sh.getLastRow()-3,sh.getLastColumn()).getValues();
  const statCol = colFor_(sh,"Status")-1, typeCol = colFor_(sh,"Type")-1;
  const counts={}, typeCounts={};
  data.forEach(r => {
    const s=r[statCol]||"Not Contacted", t=r[typeCol]||"Other";
    counts[s]=(counts[s]||0)+1; typeCounts[t]=(typeCounts[t]||0)+1;
  });
  const contacted = (counts["Contacted"]||0)+(counts["Replied"]||0)+(counts["Meeting Set"]||0)+(counts["Positive Quote"]||0);
  const goal = parseInt(cfg_("OUTREACH_GOAL","50"));
  let msg = `OUTREACH SUMMARY\n${"─".repeat(35)}\n`;
  msg += `Total: ${data.length} / ${goal} goal\nContacted: ${contacted}\nReplied: ${counts["Replied"]||0}\n`;
  msg += `Meetings: ${counts["Meeting Set"]||0}\nPositive Quotes: ${counts["Positive Quote"]||0}\n\nBY TYPE:\n`;
  Object.entries(typeCounts).forEach(([t,c]) => { msg += `  ${t}: ${c}\n`; });
  SpreadsheetApp.getUi().alert(msg);
}

// ═══════════════════════════════════════════════════════════════════
// MEASUREMENTS  (column layout A–T, 20 cols — matches amogh.site dashboard)
// A:Run ID  B:Timestamp  C:Type  D:Material  E:Pressure(N)  F:FaultCondition
// G:V  H:I  I:P_W  J:T_hot  K:T_cold  L:T_amb  M:T_coolant  N:ThrottleReason
// O:DeltaT  P:Rtheta  Q:vsBaseline  R:Headroom  S:Alert  T:Notes
// ═══════════════════════════════════════════════════════════════════

function logMeasurement() {
  const ui = SpreadsheetApp.getUi();
  const sh = gc_(SH.MEASURE);

  // Ensure headers exist
  applyMeasurementsHeader_();

  const nr = Math.max(sh.getLastRow(), 3) + 1;

  const r1 = ui.prompt("Log Rig Measurement (1/3)",
    "Run ID | Material | Pressure (N) | Fault Condition\nExample: R001 | Arctic MX-4 | 32 | BASELINE",
    ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return;
  const p1 = r1.getResponseText().split("|").map(s=>s.trim());

  const r2 = ui.prompt("Log Rig Measurement (2/3)",
    "V (volts) | I (amps) | T_hot (°C) | T_cold (°C) | T_amb (°C) | T_coolant (°C)\nExample: 12.1 | 4.8 | 72.3 | 24.1 | 22.0 | 26.5",
    ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton() !== ui.Button.OK) return;
  const p2 = r2.getResponseText().split("|").map(s=>s.trim());

  const r3 = ui.prompt("Log Rig Measurement (3/3)", "Notes (optional):", ui.ButtonSet.OK_CANCEL);
  if (r3.getSelectedButton() !== ui.Button.OK) return;

  const limit = parseFloat(cfg_("THERMAL_LIMIT_C","85"));
  const rth   = cfg_("HIGH_RTHETA_THRESH","0.5");

  sh.getRange(nr,1).setValue(p1[0]||"R001");
  sh.getRange(nr,2).setValue(new Date().toLocaleString());
  sh.getRange(nr,3).setValue("PHYSICAL_RIG");
  sh.getRange(nr,4).setValue(p1[1]||"");
  sh.getRange(nr,5).setValue(parseFloat(p1[2])||"");
  sh.getRange(nr,6).setValue(p1[3]||"BASELINE");
  sh.getRange(nr,7).setValue(parseFloat(p2[0])||"");
  sh.getRange(nr,8).setValue(parseFloat(p2[1])||"");
  sh.getRange(nr,9).setFormula(`=IF(AND(G${nr}<>"",H${nr}<>""),G${nr}*H${nr},"")`);
  sh.getRange(nr,10).setValue(parseFloat(p2[2])||"");
  sh.getRange(nr,11).setValue(parseFloat(p2[3])||"");
  sh.getRange(nr,12).setValue(parseFloat(p2[4])||"");
  sh.getRange(nr,13).setValue(parseFloat(p2[5])||"");
  sh.getRange(nr,14).setValue("");
  sh.getRange(nr,15).setFormula(`=IF(AND(J${nr}<>"",K${nr}<>""),J${nr}-K${nr},"")`);
  sh.getRange(nr,16).setFormula(`=IF(AND(O${nr}<>"",I${nr}<>"",I${nr}>0),O${nr}/I${nr},"")`);
  sh.getRange(nr,17).setValue("");
  sh.getRange(nr,18).setFormula(`=IF(J${nr}<>"",${limit}-J${nr},"")`);
  sh.getRange(nr,19).setFormula(
    `=IF(J${nr}="","",IF(J${nr}>=${limit},"🔴 HOT",IF(P${nr}>=${rth},"🟠 HIGH Rθ",IF(R${nr}<10,"🟡 LOW HRM","🟢 OK"))))`);
  sh.getRange(nr,20).setValue(r3.getResponseText());
  sh.setRowHeight(nr,20);

  log_("Rig measurement logged: row " + nr);
  SpreadsheetApp.getActiveSpreadsheet().toast("Row logged. Rθ, headroom, and alert auto-computed.", "Done", 4);
}

function logGPUSnapshot() {
  const ui = SpreadsheetApp.getUi();
  const sh = gc_(SH.MEASURE);
  applyMeasurementsHeader_();
  const nr = Math.max(sh.getLastRow(), 3) + 1;

  const r1 = ui.prompt("Log GPU Telemetry Snapshot",
    "GPU ID | GPU Model | Temp (°C) | Power Draw (W) | Power Limit (W) | Util % | Throttle Reason | Notes\n" +
    "Example: GPU0 | H100 | 72 | 285 | 350 | 95 | NONE | running matmul",
    ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return;
  const p = r1.getResponseText().split("|").map(s=>s.trim());

  const limit = parseFloat(cfg_("THROTTLE_TEMP_C","83"));

  sh.getRange(nr,1).setValue(p[0]||"GPU0");
  sh.getRange(nr,2).setValue(new Date().toLocaleString());
  sh.getRange(nr,3).setValue("GPU_TELEMETRY");
  sh.getRange(nr,4).setValue(p[1]||"");
  sh.getRange(nr,5).setValue(parseFloat(p[4])||"");
  sh.getRange(nr,6).setValue("WORKLOAD");
  sh.getRange(nr,9).setValue(parseFloat(p[3])||"");
  sh.getRange(nr,10).setValue(parseFloat(p[2])||"");
  sh.getRange(nr,14).setValue(p[6]||"NONE");
  sh.getRange(nr,18).setFormula(`=IF(J${nr}<>"",${limit}-J${nr},"")`);
  sh.getRange(nr,19).setFormula(
    `=IF(J${nr}="","",IF(J${nr}>=${limit},"🔴 THROTTLE RISK",IF(R${nr}<5,"🟡 LOW HRM","🟢 OK")))`);
  sh.getRange(nr,20).setValue(p[7]||"");
  sh.setRowHeight(nr,20);

  log_("GPU snapshot logged: row " + nr);
  SpreadsheetApp.getActiveSpreadsheet().toast("GPU snapshot logged.", "Done", 4);
}

function computeRthetaStats() {
  const sh = gs_(SH.MEASURE);
  if (!sh || sh.getLastRow() < 4) { SpreadsheetApp.getUi().alert("No measurement data yet."); return; }
  const data = sh.getRange(4,1,sh.getLastRow()-3,20).getValues();
  const byMat = {};
  data.forEach(r => {
    if ((r[2]||"") !== "PHYSICAL_RIG") return;
    const mat = r[3]||"Unknown", rth = parseFloat(r[15]);
    if (isNaN(rth)) return;
    if (!byMat[mat]) byMat[mat]=[];
    byMat[mat].push(rth);
  });
  let msg = `Rθ STATS BY MATERIAL\n${"─".repeat(40)}\n`;
  Object.entries(byMat).forEach(([m,vals]) => {
    const avg=vals.reduce((a,b)=>a+b,0)/vals.length;
    const min=Math.min(...vals), max=Math.max(...vals);
    msg += `${m}:\n  n=${vals.length}  avg=${avg.toFixed(3)}  min=${min.toFixed(3)}  max=${max.toFixed(3)} °C/W\n`;
  });
  const hot = data.filter(r=>(r[18]||"").includes("HOT")||(r[18]||"").includes("THROTTLE")).length;
  msg += `\nALERT COUNTS — HOT / THROTTLE RISK: ${hot}`;
  SpreadsheetApp.getUi().alert(msg);
}

// ═══════════════════════════════════════════════════════════════════
// EVIDENCE BOARD
// ═══════════════════════════════════════════════════════════════════

function buildEvidenceBoard() {
  const sh = gc_(SH.EVIDENCE);
  sh.clearContents(); sh.clearFormats();
  sh.setFrozenRows(3);
  sh.setColumnWidth(1,34*5.5); sh.setColumnWidth(2,50*5.5);
  sh.setColumnWidth(3,38*5.5); sh.setColumnWidth(4,16*5.5);

  sh.getRange(1,1,1,4).merge()
    .setValue("🏆 EVIDENCE BOARD — Every YC claim needs real proof before you write it")
    .setBackground(C.TEAL).setFontColor(C.W).setFontWeight("bold").setFontSize(13).setVerticalAlignment("middle");
  sh.setRowHeight(1,36);

  sh.getRange(2,1,1,4).merge()
    .setValue("✏️  EDIT THE STATUS COLUMN ONLY — change to \"In progress\" or \"Proof exists ✓\" as evidence accumulates. No proof = cut the claim.")
    .setBackground(C.AMB_L).setFontColor(C.AMB).setFontStyle("italic").setFontSize(9)
    .setHorizontalAlignment("center").setVerticalAlignment("middle");
  sh.setRowHeight(2,18);

  ["YC Application Claim","Required Proof","Where to find it / how to get it","Status"].forEach((h,i) => {
    sh.getRange(3,i+1).setValue(h).setBackground(C.K8).setFontColor(C.W)
      .setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  });
  sh.setRowHeight(3,18);

  const evdv = SpreadsheetApp.newDataValidation()
    .requireValueInList(["No proof yet","In progress","Proof exists ✓"],true).build();

  const claims = [
    ["GPU telemetry collector logging [N] fields per second","collector_v2.py + sample CSV with all fields","GitHub — /src/collector.py + /data/sample_run.csv"],
    ["Power-cap sweep: [X]% compute/watt improvement at [Y]% below TDP","power_cap_results.csv with throughput+watts+temp at 6+ power levels","GitHub — /experiments/power_cap/ + chart"],
    ["Optimal power cap: [Y]% below TDP with <3% throughput loss","Specific data row with power, throughput, efficiency values","power_cap_results.csv — optimal row highlighted"],
    ["Physical rig with [M] cooling fault signatures characterized","fault_library.json: each fault × Rθ deviation × threshold","GitHub — /hardware/fault_library.json"],
    ["Rθ varies [B]% with mounting pressure alone at same heat load","pressure_sweep.csv: Rθ at 8N/16N/24N/32N/50N for Arctic MX-4","GitHub — /hardware/pressure_sweep.csv + chart"],
    ["Anomaly detector flags cooling path degradation from GPU telemetry","validation_results.csv: each fault × detected(y/n) × accuracy × latency","GitHub — /model/validation_results.csv"],
    ["Throttle prediction [T] seconds before thermal event","Timestamped log showing prediction then actual throttle","GitHub — /model/throttle_prediction_demo.csv"],
    ["[N] GPU cluster operators interviewed, [X] confirmed the problem","Discovery call notes with org, role, exact quotes","Private notes doc — share with Sam"],
    ["'[exact operator quote confirming problem is real]'","Written/recorded quote from real person at real organization","Email/message screenshot"],
    ["1 design partner running pilot audit","Email/Slack confirmation from partner","Email thread — keep it"],
    ["Both founders have GitHub commits","Amogh: collector+model+experiments. Sam: CAD+fault CSVs+docs.","GitHub commit history — both usernames visible"],
    ["Co-founder agreement signed 50/50","Signed document","Private doc — reference in application"],
    ["ENGR 400 supervisor confirmed (Amogh)","Email reply from professor","Email thread"],
    ["UCI professor engagement (Sam)","Email reply from Prof. Won or Prof. Lee","Email thread"],
  ];

  let r = 4;
  claims.forEach((claim, i) => {
    sh.setRowHeight(r, 50);
    sh.getRange(r,1).setValue(claim[0]).setBackground(i%2===0?C.TEAL_L:C.W).setFontColor(C.TEAL_T)
      .setFontWeight("bold").setWrap(true).setFontSize(10).setBorder(true,true,true,true,false,false);
    sh.getRange(r,2).setValue(claim[1]).setBackground(C.W).setFontColor(C.K8)
      .setWrap(true).setFontSize(10).setBorder(true,true,true,true,false,false);
    sh.getRange(r,3).setValue(claim[2]).setBackground(C.K00).setFontColor(C.K4)
      .setWrap(true).setFontSize(9).setFontStyle("italic").setBorder(true,true,true,true,false,false);
    sh.getRange(r,4).setValue("No proof yet").setBackground(C.RED_L).setFontColor(C.RED)
      .setFontWeight("bold").setHorizontalAlignment("center").setFontSize(9)
      .setDataValidation(evdv).setBorder(true,true,true,true,false,false);
    r++;
  });

  log_("Evidence Board rebuilt: " + claims.length + " claims");
  SpreadsheetApp.getActiveSpreadsheet().toast("Evidence Board rebuilt.", "Done", 4);
}

// ═══════════════════════════════════════════════════════════════════
// YC BLOCKERS
// ═══════════════════════════════════════════════════════════════════

function generateYCBlockers() {
  const sh = gs_(SH.CHECKLIST);
  if (!sh || sh.getLastRow() < 4) return;  // Checklist is hidden but still readable
  const data = sh.getRange(4,1,sh.getLastRow()-3,4).getValues();
  const blockers = data.filter(r => (r[2]||"").includes("P0") && (r[1]||"").toString().startsWith("☐"));
  if (blockers.length === 0) return;
  const tl = gs_(SH.TIMELINE);
  if (tl) {
    const lr = tl.getLastRow() + 1;
    blockers.slice(0,10).forEach((b,i) => {
      const r = lr+i;
      tl.getRange(r,1,1,9).setValues([[
        "","","","YC BLOCKER: " + b[1].toString().replace("☐  ",""),
        "Both","Not Started","P0 — Critical","YC",b[3]
      ]]);
      tl.getRange(r,7).setBackground(C.RED_L).setFontColor(C.RED).setFontWeight("bold").setHorizontalAlignment("center");
      tl.getRange(r,4).setBackground(C.RED_L).setFontColor(C.RED).setWrap(true);
    });
  }
  log_("Generated " + blockers.length + " YC blockers");
  SpreadsheetApp.getActiveSpreadsheet().toast(blockers.length + " YC blocker tasks added to Timeline.", "Done", 5);
}

// ═══════════════════════════════════════════════════════════════════
// COMPETITOR QUIZ
// ═══════════════════════════════════════════════════════════════════

function competitorQuiz() {
  const ui = SpreadsheetApp.getUi();
  const questions = [
    { q:"What does Phaidra do?",
      a:"AI-driven CDU setpoint control for large AI factories (CoreWeave, Applied Digital). 75-80% thermal overshoot reduction vs PID. Requires CDU infrastructure, enterprise deployment." },
    { q:"Why is Phaidra NOT our direct competitor?",
      a:"Their customer is CoreWeave-scale with CDU infrastructure. Our customer is a 16-200 GPU operator with NO CDU. Different customer, different stack, different sales motion." },
    { q:"What does ProphetStor Federator.ai do?",
      a:"Blends DCGM data + rack delta-T + flow + Kubernetes to recommend pump/valve setpoints. Claims 22-28% CDU energy savings. Enterprise, CDU + Kubernetes required." },
    { q:"What gap does DCGM leave that we fill?",
      a:"DCGM shows raw telemetry. It does NOT: compute effective Rθ, compare GPUs to detect outliers, profile compute/watt across power caps, recommend specific actions. We add the intelligence layer on top." },
    { q:"How do we answer 'NVIDIA will build this'?",
      a:"DCGM + Mission Control serve hyperscale AI factories. We integrate with DCGM as our data source. Our customer doesn't have NVIDIA reference architecture. We're the intelligence layer, not a competitor." },
    { q:"What are the 4 GPU throttle reasons?",
      a:"1. HW_SLOWDOWN — hardware thermal protection (83-87°C). 2. SW_THERMAL_SLOWDOWN — SW limit, 5°C below HW. 3. POWER_BRAKE_SLOWDOWN — system power budget. 4. DISPLAY_CLOCKS_SLOWDOWN — display connected." },
    { q:"ThermalOS one-liner (say it in 8 seconds)?",
      a:"ThermalOS Audit takes NVIDIA DCGM telemetry and turns it into specific compute-per-watt recommendations and cooling anomaly diagnoses. 30-minute install, no CDU required, no control permissions needed." },
    { q:"IEA data center power projection?",
      a:"~945 TWh by 2030 — roughly doubles current. ~15% annual growth from AI. Data centers are ~4% of US electricity today." },
  ];
  const q = questions[Math.floor(Math.random() * questions.length)];
  const result = ui.alert("🧠 Competitor Quiz", q.q + "\n\n(Think of your answer, then click OK)", ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) ui.alert("Answer:", q.a, ui.ButtonSet.OK);
}

// ═══════════════════════════════════════════════════════════════════
// WEEKLY DIGEST
// ═══════════════════════════════════════════════════════════════════

function sendWeeklyDigest() {
  const email = cfg_("FOUNDER_EMAIL","");
  const samEmail = cfg_("SAM_EMAIL","");
  if (!email) { SpreadsheetApp.getUi().alert("Set FOUNDER_EMAIL in ⚙️ Config sheet first."); return; }
  const kpis = getKPIs_();
  const subject = "🌡 Thermal OS Weekly Digest — " + new Date().toDateString();
  const body = `THERMAL OS WEEKLY DIGEST
${"═".repeat(50)}
Generated: ${new Date().toLocaleString()}

KPIs
────────────────────────────
P0 Tasks Open:        ${kpis.p0}
P1 Tasks Open:        ${kpis.p1}
Done Total:           ${kpis.done}
Operators Spoken To:  ${kpis.operators}
Engineer Quotes:      ${kpis.quotes}
Days to YC W27 App:   ${kpis.days}

FOCUS THIS WEEK
────────────────────────────
${kpis.p0 > 15 ? "P0 overload — clear blockers before adding tasks." :
  kpis.operators < 5 ? "PRIORITY: Get to 5 operator conversations." :
  kpis.quotes < 1 ? "PRIORITY: Get 1 operator quote for the YC application." :
  "Good momentum. Keep pushing on power-cap experiments and outreach."}

GitHub: ${cfg_("GITHUB_URL","[not set]")}
Dashboard: ${cfg_("DASHBOARD_URL","[not live yet]")}

─────────────────────────────
Thermal OS · Auto-generated`;
  GmailApp.sendEmail(email, subject, body);
  if (samEmail) GmailApp.sendEmail(samEmail, subject, body);
  log_("Weekly digest sent");
  SpreadsheetApp.getActiveSpreadsheet().toast("Weekly digest sent to " + email + (samEmail ? " + " + samEmail : ""), "Done", 4);
}

// ═══════════════════════════════════════════════════════════════════
// STALE TASK AUDIT
// ═══════════════════════════════════════════════════════════════════

function auditStaleTasks() {
  const sh = gs_(SH.TIMELINE);
  if (!sh || sh.getLastRow() < 4) { SpreadsheetApp.getUi().alert("No timeline data."); return; }
  const data = sh.getRange(4,1,sh.getLastRow()-3,sh.getLastColumn()).getValues();
  const statCol = colFor_(sh,"Status")-1, msCol = colFor_(sh,"Milestone / Deliverable")-1, prioCol = colFor_(sh,"Priority")-1;
  const stale = [];
  data.forEach((row,i) => {
    const stat=row[statCol]||"", prio=row[prioCol]||"", ms=row[msCol]||"";
    if (stat==="In Progress" && prio==="P0 — Critical") stale.push({row:i+4,ms,stat:"IN PROGRESS P0"});
    if (stat==="Blocked ✗") stale.push({row:i+4,ms,stat:"BLOCKED"});
  });
  if (stale.length===0) { SpreadsheetApp.getActiveSpreadsheet().toast("No stale or blocked P0 tasks — clean ✓", "Done", 4); return; }
  let msg = `STALE / BLOCKED TASKS (${stale.length})\n${"─".repeat(40)}\n`;
  stale.forEach(t => { msg += `Row ${t.row}: [${t.stat}] ${t.ms}\n`; });
  SpreadsheetApp.getUi().alert(msg);
}

// ═══════════════════════════════════════════════════════════════════
// TRIGGERS
// ═══════════════════════════════════════════════════════════════════

function installDailyTrigger() {
  removeAllTriggers();
  const hour = parseInt(cfg_("DAILY_TRIGGER_HOUR","9"));
  ScriptApp.newTrigger("dailyAutoRefresh").timeBased().everyDays(1).atHour(hour).create();
  log_("Daily trigger installed at hour " + hour);
  SpreadsheetApp.getActiveSpreadsheet().toast("Daily trigger set for " + hour + ":00 — Home + Today Plan rebuild automatically.", "Done", 4);
}

function removeAllTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  log_("All triggers removed");
}

function dailyAutoRefresh() {
  refreshMissionControl();  // now calls buildHomeSheet()
  buildTodayPlan();
  generateFollowUps();
  applyAllFormatting();
  if (new Date().getDay() === 1) {
    const email = cfg_("FOUNDER_EMAIL","");
    if (email) sendWeeklyDigest();
  }
  log_("Daily auto-refresh: " + new Date().toLocaleString());
}

// ═══════════════════════════════════════════════════════════════════
// ON EDIT TRIGGER
// ═══════════════════════════════════════════════════════════════════

function onEdit(e) {
  if (!e) return;
  const sh = e.source.getActiveSheet();
  const shName = sh.getName();
  const range = e.range;
  const row = range.getRow(), col = range.getColumn();
  if (row < 4) return;

  if (shName === SH.TIMELINE) {
    const statCol = colFor_(sh,"Status"), prioCol = colFor_(sh,"Priority");
    const msCol = colFor_(sh,"Milestone / Deliverable"), ownerCol = colFor_(sh,"Owner");
    if (col === statCol) {
      const val = range.getValue();
      applyStatus_(range, val);
      if (msCol > 0) {
        const ms = sh.getRange(row, msCol);
        if (val==="Done ✓") ms.setFontLine("line-through").setFontColor(C.K4);
        else ms.setFontLine("none").setFontColor(C.K8);
      }
      try { buildHomeSheet(); } catch(ex) {}
    }
    if (col === prioCol) applyPriority_(range, range.getValue());
    if (col === ownerCol) {
      const ow = range.getValue();
      const obg=ow==="Amogh"?C.TEAL_L:(ow==="Sam"?C.PUR_L:C.AMB_L);
      const ofg=ow==="Amogh"?C.TEAL_T:(ow==="Sam"?C.PUR_T:C.AMB);
      range.setBackground(obg).setFontColor(ofg).setFontWeight("bold").setHorizontalAlignment("center");
    }
  }

  if (shName === SH.OUTREACH) {
    const statCol = colFor_(sh,"Status");
    if (col === statCol) {
      applyStatus_(range, range.getValue());
      try { buildHomeSheet(); } catch(ex) {}
    }
  }

  if (shName === SH.CHECKLIST) {
    if (col === 2) {
      const val = range.getValue().toString();
      if (val.startsWith("☐")) {
        range.setValue(val.replace("☐","☑")).setBackground(C.GRN_L).setFontColor(C.GRN).setFontLine("line-through");
      } else if (val.startsWith("☑")) {
        range.setValue(val.replace("☑","☐")).setBackground(C.W).setFontColor(C.K8).setFontLine("none");
      }
    }
  }
}
