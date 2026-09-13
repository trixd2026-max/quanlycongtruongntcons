/**
 * QL Công trường — Apps Script Web App
 * Deploy > Web app > Anyone > copy URL /exec
 */
var SHEET_NAMES = [
  'Project', 'Teams', 'Workers', 'ScoreRules', 'Transactions',
  'TeamBonuses', 'Locks', 'Shifts', 'Progress', 'Audit', 'Users'
];

function doGet(e) {
  return jsonOut({ ok: true, message: 'QL Công trường Sheets API. Dùng POST.' });
}

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    var action = body.action || '';
    if (action === 'loadAll') return jsonOut({ ok: true, data: loadAll() });
    if (action === 'saveAll') {
      saveAll(body.payload || {});
      return jsonOut({ ok: true, message: 'Đã lưu' });
    }
    if (action === 'upsert') {
      upsertRow(body.sheetName, body.row || {});
      return jsonOut({ ok: true, message: 'OK' });
    }
    if (action === 'delete') {
      deleteById(body.sheetName, body.id);
      return jsonOut({ ok: true, message: 'Đã xóa' });
    }
    if (action === 'login') {
      return jsonOut(loginUser(body.email, body.password));
    }
    return jsonOut({ ok: false, message: 'action không hợp lệ: ' + action });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }

function ensureSheets() {
  var book = ss();
  SHEET_NAMES.forEach(function (name) {
    if (!book.getSheetByName(name)) {
      var sh = book.insertSheet(name);
      sh.appendRow(['id', 'json']);
    }
  });
  var users = book.getSheetByName('Users');
  if (users.getLastRow() < 2) {
    users.appendRow(['user-admin', JSON.stringify({ id: 'user-admin', email: 'lehuutri@congtruong.vn', password: 'admin123', displayName: 'Lê Hữu Trí', role: 'admin', isActive: true })]);
    users.appendRow(['user-editor', JSON.stringify({ id: 'user-editor', email: 'dotruong@congtruong.vn', password: 'editor123', displayName: 'Đội trưởng', role: 'editor', teamIds: ['team-1'], isActive: true })]);
  }
}

function mapName(name) {
  var m = { project: 'Project', teams: 'Teams', workers: 'Workers', scoreRules: 'ScoreRules', transactions: 'Transactions', teamBonuses: 'TeamBonuses', locks: 'Locks', shifts: 'Shifts', progress: 'Progress', audit: 'Audit', users: 'Users' };
  return m[name] || name;
}

function readSheet(name) {
  ensureSheets();
  var sh = ss().getSheetByName(mapName(name));
  if (!sh) return [];
  var values = sh.getDataRange().getValues();
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var raw = values[i][1];
    if (!raw) continue;
    try { rows.push(typeof raw === 'string' ? JSON.parse(raw) : raw); } catch (e) {}
  }
  return rows;
}

function loadAll() {
  ensureSheets();
  var projects = readSheet('Project');
  return {
    project: projects[0] || null,
    teams: readSheet('Teams'),
    workers: readSheet('Workers'),
    scoreRules: readSheet('ScoreRules'),
    transactions: readSheet('Transactions'),
    teamBonuses: readSheet('TeamBonuses'),
    locks: readSheet('Locks'),
    shiftAssignments: readSheet('Shifts'),
    progressItems: readSheet('Progress'),
    auditLogs: readSheet('Audit'),
    users: readSheet('Users')
  };
}

function writeSheet(sheetKey, rows) {
  ensureSheets();
  var sh = ss().getSheetByName(mapName(sheetKey));
  sh.clearContents();
  sh.appendRow(['id', 'json']);
  (rows || []).forEach(function (row) {
    var id = row.id || Utilities.getUuid();
    row.id = id;
    sh.appendRow([id, JSON.stringify(row)]);
  });
}

function saveAll(payload) {
  if (payload.project) writeSheet('Project', [payload.project]);
  if (payload.teams) writeSheet('Teams', payload.teams);
  if (payload.workers) writeSheet('Workers', payload.workers);
  if (payload.scoreRules) writeSheet('ScoreRules', payload.scoreRules);
  if (payload.transactions) writeSheet('Transactions', payload.transactions);
  if (payload.teamBonuses) writeSheet('TeamBonuses', payload.teamBonuses);
  if (payload.locks) writeSheet('Locks', payload.locks);
  if (payload.shiftAssignments) writeSheet('Shifts', payload.shiftAssignments);
  if (payload.progressItems) writeSheet('Progress', payload.progressItems);
  if (payload.auditLogs) writeSheet('Audit', payload.auditLogs);
}

function upsertRow(sheetName, row) {
  ensureSheets();
  var sh = ss().getSheetByName(mapName(sheetName));
  var id = row.id || Utilities.getUuid();
  row.id = id;
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sh.getRange(i + 1, 1, 1, 2).setValues([[id, JSON.stringify(row)]]);
      return;
    }
  }
  sh.appendRow([id, JSON.stringify(row)]);
}

function deleteById(sheetName, id) {
  ensureSheets();
  var sh = ss().getSheetByName(mapName(sheetName));
  var values = sh.getDataRange().getValues();
  for (var i = values.length - 1; i >= 1; i--) {
    if (String(values[i][0]) === String(id)) sh.deleteRow(i + 1);
  }
}

function loginUser(email, password) {
  ensureSheets();
  var users = readSheet('Users');
  email = String(email || '').toLowerCase();
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if (String(u.email || '').toLowerCase() === email && String(u.password || '') === String(password || '')) {
      var safe = {};
      for (var k in u) { if (k !== 'password') safe[k] = u[k]; }
      return { ok: true, data: { user: safe }, message: 'OK' };
    }
  }
  return { ok: false, message: 'Email hoặc mật khẩu không đúng (Google Sheet)' };
}
