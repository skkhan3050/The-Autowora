/**
 * The Auto Aura landing-page lead receiver.
 *
 * Deploy this as a Web App from the Google account that owns the spreadsheet.
 * Keep the spreadsheet itself restricted to authorised staff.
 */
const CONFIG = {
  spreadsheetId: '1hBqCe0itj9I2LrMHbf70Pu8KnoaAz9OoyJtVh0_rZAk',
  sheetName: 'Sheet1',
  headers: [
    'Received at',
    'Full name',
    'Phone',
    'Email',
    'Service',
    'Preferred date',
    'Message',
    'Source',
    'Status',
  ],
};

function doGet() {
  return jsonResponse({ ok: true, service: 'The Auto Aura lead receiver' });
}

function doPost(event) {
  const lock = LockService.getScriptLock();

  try {
    if (!lock.tryLock(5000)) {
      return jsonResponse({ ok: false, error: 'Please retry shortly.' });
    }

    const lead = validateLead(parseRequest(event));
    const sheet = getLeadSheet();

    ensureHeaders(sheet);
    sheet.appendRow([
      new Date(),
      lead.fullName,
      lead.phone,
      lead.email,
      lead.service,
      lead.preferredDate,
      lead.message,
      lead.source,
      'New',
    ]);

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse({
      ok: false,
      error: error && error.message ? error.message : 'Unable to save lead.',
    });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function getLeadSheet() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const sheet = spreadsheet.getSheetByName(CONFIG.sheetName);

  if (!sheet) {
    throw new Error(`Sheet tab "${CONFIG.sheetName}" was not found.`);
  }

  return sheet;
}

function ensureHeaders(sheet) {
  const existingHeaders = sheet
    .getRange(1, 1, 1, CONFIG.headers.length)
    .getDisplayValues()[0];

  if (existingHeaders.every((value) => value === '')) {
    sheet.getRange(1, 1, 1, CONFIG.headers.length).setValues([CONFIG.headers]);
    sheet.setFrozenRows(1);
  }
}

function parseRequest(event) {
  if (!event) return {};

  const content = event.postData && event.postData.contents;
  if (content) {
    try {
      return JSON.parse(content);
    } catch (error) {
      // Standard form posts use event.parameter instead of a JSON body.
    }
  }

  return event.parameter || {};
}

function validateLead(input) {
  const fullName = text(input.full_name || input.name, 120);
  const phone = text(input.phone, 20);
  const email = text(input.email, 254);
  const service = text(input.service, 120);
  const preferredDate = text(input.appointment_date || input.date, 10);
  const message = text(input.message, 1000);
  const source = text(input.source, 40) || 'landing_page';

  if (!fullName) throw new Error('Full name is required.');
  if (!/^[0-9+()\s-]{8,20}$/.test(phone)) {
    throw new Error('A valid phone number is required.');
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Email address is invalid.');
  }
  if (!service) throw new Error('Service is required.');
  if (preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
    throw new Error('Preferred date must use YYYY-MM-DD.');
  }

  return {
    fullName: safeCell(fullName),
    phone: safeCell(phone),
    email: safeCell(email),
    service: safeCell(service),
    preferredDate: safeCell(preferredDate),
    message: safeCell(message),
    source: safeCell(source),
  };
}

function text(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

// Prevent spreadsheet formulas from being executed when lead text starts with =, +, - or @.
function safeCell(value) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
