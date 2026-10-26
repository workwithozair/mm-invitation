/**
 * Masoom & Miza wedding RSVP collector
 * 1. Create a Google Sheet and open Extensions > Apps Script.
 * 2. Paste this file into Code.gs and save.
 * 3. Deploy > New deployment > Web app.
 *    Execute as: Me | Who has access: Anyone
 * 4. Copy the deployed /exec URL into data.json at rsvp.appsScriptUrl.
 * The script writes one row per submission to the RSVP Responses sheet.
 */
const SHEET_NAME = 'RSVP Responses';
const HEADERS = [
  'Submitted At', 'Guest Name', 'Contact Number', 'Akad Nikah',
  'Wedding Reception / Walimatulurus', 'Guest Count', 'Wishes / Du’a', 'Couple'
];

function doPost(e) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const data = (e && e.parameter) || {};
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      if (!spreadsheet) throw new Error('No spreadsheet bound to this Apps Script project.');
      let sheet = spreadsheet.getSheetByName(SHEET_NAME);
      if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(HEADERS);
        sheet.setFrozenRows(1);
      }
      const row = [
        data.submittedAt || new Date().toISOString(),
        clean_(data.name),
        clean_(data.contactNumber),
        clean_(data['event_akad-nikah']),
        clean_(data['event_wedding-reception']),
        clean_(data.guests),
        clean_(data.notes),
        clean_(data.couple || 'Masoom & Miza')
      ];
      sheet.appendRow(row);
    } finally {
      lock.releaseLock();
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function clean_(value) {
  // Prevent spreadsheet formula injection and keep values plain text.
  const text = String(value == null ? '' : value).trim().slice(0, 2000);
  return /^[=+@\-]/.test(text) ? "'" + text : text;
}

function doGet() {
  return ContentService.createTextOutput('RSVP endpoint is ready. Submit the RSVP form from the wedding website.')
    .setMimeType(ContentService.MimeType.TEXT);
}
