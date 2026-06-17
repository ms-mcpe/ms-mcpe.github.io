function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheets(ss);

  if (e && e.parameter && e.parameter.action === 'getData') {
    const data = {
      actualizations: getSheetData(ss, 'actualizations'),
      reparations: getSheetData(ss, 'reparations')
    };
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return HtmlService.createHtmlOutput('<h2>Apps Script desplegado correctamente</h2>');
}

function ensureSheets(ss) {
  ['actualizations', 'reparations'].forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(['ID', 'Timestamp', 'Texto']);
      sheet.setFrozenRows(1);
    }
  });
}

function getSheetData(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0];
  return rows.slice(1).map((row, i) => ({
    id: row[0],
    timestamp: row[1],
    text: row[2],
    sheet: name
  }));
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheets(ss);

  try {
    const data = JSON.parse(e.postData.contents);
    const { action, sheet, text, id } = data;

    if (action === 'delete') {
      const targetSheet = ss.getSheetByName(sheet);
      const rows = targetSheet.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 1; i--) {
        if (rows[i][0] === id) {
          targetSheet.deleteRow(i + 1);
          return ContentService.createTextOutput(JSON.stringify({
            success: true, message: 'Eliminado correctamente'
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: false, error: 'No se encontró el registro'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (!sheet || !text) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false, error: 'Faltan datos requeridos'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const targetSheet = ss.getSheetByName(sheet);
    const newId = Utilities.getUuid();
    const timestamp = new Date().toLocaleString('es-ES', {
      timeZone: 'America/Mexico_City',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    targetSheet.appendRow([newId, timestamp, text]);

    return ContentService.createTextOutput(JSON.stringify({
      success: true, id: newId, message: 'Solicitud guardada correctamente'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false, error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
