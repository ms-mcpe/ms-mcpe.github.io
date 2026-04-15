const NOMBRE_HOJA = "publicado"; 
const HOJA_PENDIENTES = "publicado"; 
const HOJA_SESION = "sesion"; 
const ID_CARPETA_IMAGENES = "1d2hpG4nR9COEkZGcPKIJfS1ij0aTNVkX"; 

// ═══════════════════════════════════════════════════════════
//  INICIALIZAR HOJAS NECESARIAS
// ═══════════════════════════════════════════════════════════
function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Hoja sesion — añadir columna "Estado" si no existe
  let sheetSesion = ss.getSheetByName(HOJA_SESION);
  if (sheetSesion) {
    const headers = sheetSesion.getRange(1, 1, 1, sheetSesion.getLastColumn()).getValues()[0];
    if (!headers.includes("Estado")) {
      // Si hay datos de usuarios sin Estado, poner Activo por defecto
      const lastRow = sheetSesion.getLastRow();
      if (lastRow > 0) {
        const col = sheetSesion.getLastColumn() + 1;
        sheetSesion.getRange(1, col).setValue("Estado");
        for (let i = 2; i <= lastRow; i++) {
          sheetSesion.getRange(i, col).setValue("Activo");
        }
      }
    }
  }

  // Hoja Proibido — crear si no existe
  let sheetProib = ss.getSheetByName("Proibido");
  if (!sheetProib) {
    sheetProib = ss.insertSheet("Proibido");
    sheetProib.appendRow(["Fecha", "Usuario", "Nombre", "Descripcion", "Link", "Palabra Detectada"]);
    sheetProib.getRange("A1:F1").setFontWeight("bold").setBackground("#efefef");
  }

  // Hoja info — crear si no existe
  let sheetInfo = ss.getSheetByName("info");
  if (!sheetInfo) {
    sheetInfo = ss.insertSheet("info");
    sheetInfo.appendRow(["Métrica", "Valor"]);
    sheetInfo.appendRow(["Addons", 0]);
    sheetInfo.appendRow(["Vistas", 0]);
    sheetInfo.appendRow(["Usuarios", 0]);
    sheetInfo.getRange("A1:B1").setFontWeight("bold").setBackground("#efefef");
  }
}

// ═══════════════════════════════════════════════════════════
//  doPost
// ═══════════════════════════════════════════════════════════
function doPost(e) {
  initSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetMain = ss.getSheetByName(NOMBRE_HOJA);
  const sheetRev = ss.getSheetByName(HOJA_PENDIENTES);
  const sheetSesion = ss.getSheetByName(HOJA_SESION);

  try {
    const res = JSON.parse(e.postData.contents);
    const action = res.action;

    // ─── REGISTRO ───────────────────────────────────────────
    if (action === "register") {
      const dataUsers = sheetSesion.getDataRange().getValues();
      for (let i = 0; i < dataUsers.length; i++) {
        if (dataUsers[i][1] === res.user) return ContentService.createTextOutput("USER_EXISTS");
      }
      // Columna D = Estado "Activo" automáticamente
      sheetSesion.appendRow([new Date().toLocaleString(), res.user, res.pass, "Activo"]);
      return ContentService.createTextOutput("REGISTER_OK");
    }

    // ─── LOGIN ──────────────────────────────────────────────
    if (action === "login") {
      const dataUsers = sheetSesion.getDataRange().getValues();
      for (let i = 0; i < dataUsers.length; i++) {
        if (dataUsers[i][1] === res.user && dataUsers[i][2] === res.pass) {
          return ContentService.createTextOutput("LOGIN_OK");
        }
      }
      return ContentService.createTextOutput("LOGIN_ERROR");
    }

    // ─── SET USER STATUS (baneado/activo) ───────────────────
    if (action === "setUserStatus") {
      const dataUsers = sheetSesion.getDataRange().getValues();
      for (let i = 0; i < dataUsers.length; i++) {
        if (dataUsers[i][1] === res.nombre) {
          // Estado va en columna D (índice 3), pero debemos encontrar su posición real
          // Buscamos el índice de la columna Estado en la fila de encabezado
          let estadoCol = 4; // default columna D (1-indexed)
          const headers = dataUsers[0];
          for (let j = 0; j < headers.length; j++) {
            if (String(headers[j]).toLowerCase() === 'estado') { estadoCol = j + 1; break; }
          }
          sheetSesion.getRange(i + 1, estadoCol).setValue(res.estado);
          return ContentService.createTextOutput("STATUS_OK");
        }
      }
      return ContentService.createTextOutput("USER_NOT_FOUND");
    }

    // ─── LOG BANNED ATTEMPT ─────────────────────────────────
    if (action === "logBanned") {
      const sheetProib = ss.getSheetByName("Proibido");
      if (sheetProib) {
        sheetProib.appendRow([
          res.fecha || new Date().toLocaleString(),
          res.usuario || "",
          res.nombre || "",
          res.descripcion || "",
          res.link || "",
          res.palabra || ""
        ]);
      }
      return ContentService.createTextOutput("LOGGED");
    }

    // ─── ELIMINAR ───────────────────────────────────────────
    if (action === "delete") {
      const data = sheetMain.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] === res.nombre && data[i][8] === res.usuario) {
          enviarAPapelera(data[i][3]);
          sheetMain.deleteRow(i + 1);
          return ContentService.createTextOutput("DELETE_OK");
        }
      }
      return ContentService.createTextOutput("DELETE_ERROR");
    }

    // ─── EDITAR ─────────────────────────────────────────────
    if (action === "edit") {
      const data = sheetMain.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] === res.nombreOriginal && data[i][8] === res.usuario) {
          if (res.nuevaImg && res.nuevaImg.includes("base64")) {
            enviarAPapelera(data[i][3]);
            const nuevaUrlImg = guardarImagenEnDrive(res.nuevaImg, res.nuevoNombre);
            sheetMain.getRange(i + 1, 4).setValue(nuevaUrlImg);
          }
          sheetMain.getRange(i + 1, 2).setValue(res.nuevoNombre);
          sheetMain.getRange(i + 1, 3).setValue(res.nuevaUrl); 
          if (res.nuevaCategoria) sheetMain.getRange(i + 1, 5).setValue(res.nuevaCategoria);
          if (res.nuevaSeed) sheetMain.getRange(i + 1, 8).setValue(res.nuevaSeed);
          if (res.nuevaVersion) sheetMain.getRange(i + 1, 10).setValue(res.nuevaVersion);
          if (res.nuevaDescripcion) sheetMain.getRange(i + 1, 11).setValue(res.nuevaDescripcion);
          return ContentService.createTextOutput("EDIT_OK");
        }
      }
    }

    // ─── ADD ────────────────────────────────────────────────
    let urlImagenFinal = res.imgUrl || "";
    if (res.img && res.img.includes("base64")) {
      urlImagenFinal = guardarImagenEnDrive(res.img, res.nombre);
    }

    let urlDescargaFinal = res.link; 

    if (action === "add") {
      sheetRev.appendRow([
        new Date().toLocaleString(), 
        res.nombre, 
        urlDescargaFinal, 
        urlImagenFinal, 
        res.category, 
        0, 
        0, 
        res.seed, 
        res.subidoPor,
        res.version || "",
        res.descripcion || ""
      ]);
      return ContentService.createTextOutput("OK_EN_REVISION");
    }

    // ─── APROBAR ────────────────────────────────────────────
    if (action === "approve") {
      const dataRev = sheetRev.getDataRange().getValues();
      for (let i = 1; i < dataRev.length; i++) {
        if (dataRev[i][1] === res.nombre) {
          sheetMain.appendRow(dataRev[i]);
          sheetRev.deleteRow(i + 1);
          return ContentService.createTextOutput("APROBADO");
        }
      }
    }

  } catch (err) {
    return ContentService.createTextOutput("ERROR: " + err.toString());
  }
}

// ═══════════════════════════════════════════════════════════
//  GUARDAR IMAGEN EN DRIVE
// ═══════════════════════════════════════════════════════════
function guardarImagenEnDrive(base64Data, nombreAddon) {
  const folder = DriveApp.getFolderById(ID_CARPETA_IMAGENES);
  const tipoMime = base64Data.split(";")[0].split(":")[1]; 
  const datosLimpio = base64Data.split(",")[1];
  
  const nombreFinal = nombreAddon + "-" + new Date().getTime() + ".png";
  const blob = Utilities.newBlob(Utilities.base64Decode(datosLimpio), tipoMime, nombreFinal);
  const archivo = folder.createFile(blob);
  archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  const id = archivo.getId();
  return "https://lh3.googleusercontent.com/u/0/d/" + id + "=s1000";
}

// ═══════════════════════════════════════════════════════════
//  BORRAR IMAGEN
// ═══════════════════════════════════════════════════════════
function enviarAPapelera(url) {
  if (!url || url === "") return;
  try {
    let id = "";
    if (url.includes("id=")) {
      id = url.split("id=")[1].split("&")[0];
    } else if (url.includes("picture/0")) {
      id = url.split("picture/0")[1].split("=")[0];
    }
    if (id !== "") DriveApp.getFileById(id).setTrashed(true);
  } catch (e) {
    console.log("No se pudo eliminar el archivo: " + e.toString());
  }
}

// ═══════════════════════════════════════════════════════════
//  doGet
// ═══════════════════════════════════════════════════════════
function doGet(e) {
  initSheets();
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ─── PAGEVIEW ───────────────────────────────────────────
  if (action === "pageview") {
    let sheetInfo = ss.getSheetByName("info");
    let vistasRange = sheetInfo.getRange("B3");
    let currentVistas = parseInt(vistasRange.getValue()) || 0;
    vistasRange.setValue(currentVistas + 1);
    return ContentService.createTextOutput("OK");
  }

  // ─── GET STATS ──────────────────────────────────────────
  if (action === "getStats") {
    const sheetInfo = ss.getSheetByName("info");
    const sheetMain = ss.getSheetByName(NOMBRE_HOJA);
    const sheetSesion = ss.getSheetByName(HOJA_SESION);

    let totalAddons = 0;
    if (sheetMain) {
      const dataMain = sheetMain.getDataRange().getValues();
      totalAddons = Math.max(0, dataMain.length - 1);
    }

    let totalUsuarios = 0;
    if (sheetSesion) {
      const dataSesion = sheetSesion.getDataRange().getValues();
      totalUsuarios = dataSesion.filter(row =>
        row[1] && row[1].toString().trim() !== "" && row[1].toString().toLowerCase() !== "nombre"
      ).length;
    }

    let totalVistas = parseInt(sheetInfo.getRange("B3").getValue()) || 0;
    sheetInfo.getRange("B2").setValue(totalAddons);
    sheetInfo.getRange("B4").setValue(totalUsuarios);

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      total_addons: totalAddons,
      total_vistas: totalVistas,
      total_usuarios: totalUsuarios
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // ─── CHECK STATUS ────────────────────────────────────────
  if (action === "checkStatus") {
    const user = e.parameter.user;
    const sheetSesion = ss.getSheetByName(HOJA_SESION);
    if (!sheetSesion || !user) {
      return ContentService.createTextOutput(JSON.stringify({ estado: "Activo" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const data = sheetSesion.getDataRange().getValues();
    // Encontrar la columna Estado
    let estadoColIdx = 3; // default column D
    if (data.length > 0) {
      for (let j = 0; j < data[0].length; j++) {
        if (String(data[0][j]).toLowerCase() === 'estado') { estadoColIdx = j; break; }
      }
    }
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === user) {
        const estado = data[i][estadoColIdx] || "Activo";
        return ContentService.createTextOutput(JSON.stringify({ estado }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    // Usuario no encontrado → Activo por defecto
    return ContentService.createTextOutput(JSON.stringify({ estado: "Activo" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ─── GET USERS (solo para admin) ─────────────────────────
  if (action === "getUsers") {
    const sheetSesion = ss.getSheetByName(HOJA_SESION);
    if (!sheetSesion) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
    const data = sheetSesion.getDataRange().getValues();
    // Asegurarse que la columna Estado existe (añadirla si faltan para algunos)
    const headers = data[0] || [];
    let estadoColIdx = headers.findIndex(h => String(h).toLowerCase() === 'estado');
    if (estadoColIdx === -1) estadoColIdx = 3;
    // Normalizar: devolver [fecha, nombre, pass, estado]
    const result = data.map((row, i) => {
      return [row[0] || '', row[1] || '', row[2] || '', row[estadoColIdx] || (i === 0 ? 'Estado' : 'Activo')];
    });
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  // ─── READ ADDONS ─────────────────────────────────────────
  const nombre = e.parameter.nombre;
  const sheet = ss.getSheetByName(NOMBRE_HOJA);
  const data = sheet.getDataRange().getValues();

  if (action === "read") {
    const rows = data.slice(1);
    return ContentService.createTextOutput(JSON.stringify(rows)).setMimeType(ContentService.MimeType.JSON);
  }

  // ─── LIKE / DOWNLOAD ─────────────────────────────────────
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] == nombre) {
      let col = (action === "like") ? 6 : 7;
      let currentVal = parseInt(data[i][col - 1]) || 0;
      sheet.getRange(i + 1, col).setValue(currentVal + 1);
      return ContentService.createTextOutput("OK");
    }
  }

  return ContentService.createTextOutput("NOT_FOUND");
}