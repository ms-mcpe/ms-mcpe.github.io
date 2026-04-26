const NOMBRE_HOJA = "publicado"; 
const HOJA_PENDIENTES = "publicado"; 
const HOJA_SESION = "sesion"; 
const ID_CARPETA_IMAGENES = "1d2hpG4nR9COEkZGcPKIJfS1ij0aTNVkX"; 

// ═══════════════════════════════════════════════════════════
//  INICIALIZAR HOJAS NECESARIAS
// ═══════════════════════════════════════════════════════════
function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Hoja sesion — añadir columnas "Estado" y "Rol" si no existen
  let sheetSesion = ss.getSheetByName(HOJA_SESION);
  if (sheetSesion) {
    const headers = sheetSesion.getRange(1, 1, 1, sheetSesion.getLastColumn()).getValues()[0];
    if (!headers.includes("Estado")) {
      const col = sheetSesion.getLastColumn() + 1;
      sheetSesion.getRange(1, col).setValue("Estado");
      const lastRow = sheetSesion.getLastRow();
      if (lastRow > 1) {
        for (let i = 2; i <= lastRow; i++) sheetSesion.getRange(i, col).setValue("Activo");
      }
    }
    const headers2 = sheetSesion.getRange(1, 1, 1, sheetSesion.getLastColumn()).getValues()[0];
    if (!headers2.includes("Rol")) {
      const col = sheetSesion.getLastColumn() + 1;
      sheetSesion.getRange(1, col).setValue("Rol");
      const lastRow = sheetSesion.getLastRow();
      if (lastRow > 1) {
        for (let i = 2; i <= lastRow; i++) sheetSesion.getRange(i, col).setValue("User");
      }
    }
    const headers3 = sheetSesion.getRange(1, 1, 1, sheetSesion.getLastColumn()).getValues()[0];
    if (!headers3.includes("Verificacion")) {
      const col = sheetSesion.getLastColumn() + 1;
      sheetSesion.getRange(1, col).setValue("Verificacion");
      const lastRow = sheetSesion.getLastRow();
      if (lastRow > 1) {
        for (let i = 2; i <= lastRow; i++) sheetSesion.getRange(i, col).setValue("No Verificado");
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
    sheetInfo.appendRow(["Mantenimiento", "Falso"]);
    sheetInfo.getRange("A1:B1").setFontWeight("bold").setBackground("#efefef");
  } else {
    // Añadir fila Mantenimiento si no existe
    const dataInfo = sheetInfo.getDataRange().getValues();
    let hasMaint = false;
    for(let i=0; i<dataInfo.length; i++) {
      if(dataInfo[i][0] === "Mantenimiento") hasMaint = true;
    }
    if(!hasMaint) sheetInfo.appendRow(["Mantenimiento", "Falso"]);
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
      // Guardar nuevo usuario con Estado "Activo" y Rol "User"
      sheetSesion.appendRow([new Date().toLocaleString(), res.user, res.pass, "Activo", "User"]);
      return ContentService.createTextOutput("REGISTER_OK");
    }

    // ─── LOGIN ──────────────────────────────────────────────
    if (action === "login") {
      const dataUsers = sheetSesion.getDataRange().getValues();
      const headers = dataUsers[0] || [];
      const rolCol = headers.findIndex(h => String(h).toLowerCase() === 'rol');
      
      for (let i = 0; i < dataUsers.length; i++) {
        if (dataUsers[i][1] === res.user && dataUsers[i][2] === res.pass) {
          const userRole = (rolCol !== -1 && dataUsers[i][rolCol]) ? dataUsers[i][rolCol] : "User";
          return ContentService.createTextOutput(JSON.stringify({ status: "LOGIN_OK", rol: userRole }));
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "LOGIN_ERROR" }));
    }

    // ─── SET USER STATUS (baneado/activo) ───────────────────
    if (action === "setUserStatus") {
      const dataUsers = sheetSesion.getDataRange().getValues();
      for (let i = 0; i < dataUsers.length; i++) {
        if (dataUsers[i][1] === res.nombre) {
          let estadoCol = 4; 
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

    // ─── SET USER VERIFICATION ──────────────────────────────
    if (action === "setUserVerification") {
      const dataUsers = sheetSesion.getDataRange().getValues();
      const nombre = res.nombre;
      const verificacion = res.verificacion;
      
      for (let i = 1; i < dataUsers.length; i++) {
        if (dataUsers[i][1] === nombre) {
          let veriCol = 6; 
          const headers = dataUsers[0];
          for (let j = 0; j < headers.length; j++) {
            if (String(headers[j]).toLowerCase() === 'verificacion') { veriCol = j + 1; break; }
          }
          sheetSesion.getRange(i + 1, veriCol).setValue(verificacion);
          return ContentService.createTextOutput("VERIFICATION_OK");
        }
      }
      return ContentService.createTextOutput("USER_NOT_FOUND");
    }

    // ─── DELETE USER ACCOUNT (Cascada) ──────────────────────
    if (action === "deleteUserAccount") {
      if (res.rol !== "Admin") return ContentService.createTextOutput("UNAUTHORIZED");
      const dataUsers = sheetSesion.getDataRange().getValues();
      const userName = res.nombre;
      
      // 1. Eliminar de Sesion
      for (let i = 1; i < dataUsers.length; i++) {
        if (dataUsers[i][1] === userName) {
          sheetSesion.deleteRow(i + 1);
          break;
        }
      }
      
      // 2. Eliminar Addons e Imágenes
      const dataAddons = sheetMain.getDataRange().getValues();
      // Recorremos de abajo hacia arriba para no alterar índices al borrar
      for (let i = dataAddons.length - 1; i >= 1; i--) {
        if (dataAddons[i][8] === userName) {
          const imgUrl = dataAddons[i][3];
          if (imgUrl) enviarAPapelera(imgUrl);
          sheetMain.deleteRow(i + 1);
        }
      }
      
      return ContentService.createTextOutput("USER_DELETED_FULL");
    }

    // ─── RENAME USER ─────────────────────────────────────────
    if (action === "renameUser") {
      const user = res.user;           // nombre actual
      const newName = res.newName;     // nuevo nombre deseado
      const pass = res.pass;           // contraseña para verificar identidad

      if (!user || !newName || !pass) {
        return ContentService.createTextOutput("MISSING_FIELDS");
      }
      if (user === ADMIN_USER || newName === ADMIN_USER) {
        return ContentService.createTextOutput("FORBIDDEN");
      }

      const dataUsers = sheetSesion.getDataRange().getValues();

      // Verificar que el nuevo nombre no exista
      for (let i = 1; i < dataUsers.length; i++) {
        if (dataUsers[i][1] === newName) {
          return ContentService.createTextOutput("NAME_TAKEN");
        }
      }

      // Encontrar columna Estado
      let estadoCol = 4;
      const headers = dataUsers[0];
      for (let j = 0; j < headers.length; j++) {
        if (String(headers[j]).toLowerCase() === 'estado') { estadoCol = j + 1; break; }
      }

      // Validar credenciales y renombrar
      let userRow = -1;
      for (let i = 1; i < dataUsers.length; i++) {
        if (dataUsers[i][1] === user && dataUsers[i][2] === pass) {
          userRow = i + 1; // 1-indexed
          break;
        }
      }
      if (userRow === -1) {
        return ContentService.createTextOutput("AUTH_ERROR");
      }

      // Actualizar nombre en hoja sesion (columna B = 2)
      sheetSesion.getRange(userRow, 2).setValue(newName);

      // Actualizar nombre en todos los addons publicados por este usuario (columna I = 9)
      const dataAddons = sheetMain.getDataRange().getValues();
      for (let i = 1; i < dataAddons.length; i++) {
        if (dataAddons[i][8] === user) {
          sheetMain.getRange(i + 1, 9).setValue(newName);
        }
      }

      return ContentService.createTextOutput("RENAME_OK");
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
      const isAdmin = res.rol === "Admin";
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] === res.nombre && (isAdmin || data[i][8] === res.usuario)) {
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
      const isAdmin = res.rol === "Admin";
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] === res.nombreOriginal && (isAdmin || data[i][8] === res.usuario)) {
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
    
    // ─── SET MANTENIMIENTO ──────────────────────────────────
    if (action === "setMaintenance") {
      if (res.rol !== "Admin") return ContentService.createTextOutput("UNAUTHORIZED");
      const sheetInfo = ss.getSheetByName("info");
      const dataInfo = sheetInfo.getDataRange().getValues();
      for(let i=0; i<dataInfo.length; i++) {
        if(dataInfo[i][0] === "Mantenimiento") {
          sheetInfo.getRange(i+1, 2).setValue(res.estado ? "Verdadero" : "Falso");
          return ContentService.createTextOutput("MAINTENANCE_UPDATED");
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
    
    // Leer mantenimiento
    let enMantenimiento = false;
    const dataInfo = sheetInfo.getDataRange().getValues();
    for(let i=0; i<dataInfo.length; i++) {
      if(dataInfo[i][0] === "Mantenimiento" && dataInfo[i][1] === "Verdadero") {
        enMantenimiento = true;
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      total_addons: totalAddons,
      total_vistas: totalVistas,
      total_usuarios: totalUsuarios,
      mantenimiento: enMantenimiento
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
    let rolColIdx = headers.findIndex(h => String(h).toLowerCase() === 'rol');
    if (rolColIdx === -1) rolColIdx = 4;
    let veriColIdx = headers.findIndex(h => String(h).toLowerCase() === 'verificacion');
    if (veriColIdx === -1) veriColIdx = 5;

    // Normalizar: devolver [fecha, nombre, pass, estado, rol, verificacion]
    const result = data.map((row, i) => {
      return [
        row[0] || '', 
        row[1] || '', 
        row[2] || '', 
        row[estadoColIdx] || (i === 0 ? 'Estado' : 'Activo'),
        row[rolColIdx] || (i === 0 ? 'Rol' : 'User'),
        row[veriColIdx] || (i === 0 ? 'Verificacion' : 'No Verificado')
      ];
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