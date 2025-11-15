const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// Variables para el bot
const NOMBRE_BOT = '🤖 MC Addons BOT';
const SUB_NOMBRE_BOT = '*By JR-TechStudios*';

// Almacena el estado actual de los archivos para detectar cambios
let lastAddons = readData('addons.json');
let lastMcVersions = readData('mc-version.json');

// --- FUNCIONES Y LÓGICA DEL SERVIDOR WEB ---
const app = express();
const PORT = 7000;

app.use(express.static(path.join(__dirname, '.')));
app.use(bodyParser.json());

function readData(file) {
    try {
        const data = fs.readFileSync(path.join(__dirname, file), 'utf8');
        // Asegura que los archivos vacíos devuelvan un array o un objeto
        return JSON.parse(data) || (file.includes('respuestas') ? {} : []);
    } catch (error) {
        return (file.includes('respuestas')) ? {} : [];
    }
}

function writeData(file, data) {
    fs.writeFileSync(path.join(__dirname, file), JSON.stringify(data, null, 2), 'utf8');
}

// Corregido: La API ahora sabe qué archivo leer para 'mc-versions'
app.get('/api/:type', (req, res) => {
    const { type } = req.params;
    let file;
    if (type === 'addons') file = 'addons.json';
    else if (type === 'mc-versions' || type === 'mc-version') file = 'mc-version.json';
    else if (type === 'responses') file = 'auto-respuestas.json';
    else return res.status(400).send('Tipo de datos no válido.');

    const data = readData(file);
    res.json(data);
});

// Corregido: Asegura que descripcion se guarda como string vacío si no viene del formulario.
app.post('/api/create', (req, res) => {
    const { type, ...newData } = req.body;
    let file;
    let currentData;
    if (type === 'addons') {
        file = 'addons.json';
        currentData = readData(file);
        // Asegurar que descripcion exista como string vacío
        currentData.unshift({...newData, descripcion: newData.descripcion || ''}); 
    } else if (type === 'mc-version' || type === 'mc-versions') { // Acepta ambas keys del frontend
        file = 'mc-version.json';
        currentData = readData(file);
        // Asegurar que descripcion exista como string vacío
        currentData.unshift({...newData, descripcion: newData.descripcion || ''});
    } else if (type === 'respuestas') {
        file = 'auto-respuestas.json';
        currentData = readData(file);
        const key = newData.pregunta.toLowerCase();
        currentData[key] = { ...newData, pregunta: key };
    } else {
        return res.status(400).send('Tipo de datos no válido.');
    }
    writeData(file, currentData);
    res.status(200).json({ message: 'Contenido creado con éxito.' });
});

// Corregido: Asegura que descripcion se mantiene si no se envía en la edición.
app.put('/api/edit', (req, res) => {
    const { type, originalName, ...data } = req.body;
    let file;
    if (type === 'addons') {
        file = 'addons.json';
        const currentData = readData(file);
        const index = currentData.findIndex(item => item.nombre.toLowerCase() === originalName.toLowerCase());
        if (index !== -1) {
            const existingData = currentData[index];
            currentData[index] = {
                ...existingData, 
                ...data,
                descripcion: data.descripcion || existingData.descripcion || '' // Usar la data enviada o la existente
            };
            writeData(file, currentData);
        }
    } else if (type === 'mc-version' || type === 'mc-versions') {
        file = 'mc-version.json';
        const currentData = readData(file);
        const index = currentData.findIndex(item => item.nombre.toLowerCase() === originalName.toLowerCase());
        if (index !== -1) {
             const existingData = currentData[index];
             currentData[index] = {
                ...existingData,
                ...data,
                descripcion: data.descripcion || existingData.descripcion || '' // Usar la data enviada o la existente
            };
            writeData(file, currentData);
        }
    } else if (type === 'respuestas') {
        file = 'auto-respuestas.json';
        const currentData = readData(file);
        delete currentData[originalName.toLowerCase()];
        const key = data.pregunta.toLowerCase();
        currentData[key] = { pregunta: key, respuesta: data.respuesta, imagenUrl: data.imagenUrl || '' };
        writeData(file, currentData);
    } else {
        return res.status(400).send('Tipo de datos no válido.');
    }
    res.status(200).json({ message: 'Contenido editado con éxito.' });
});

app.post('/api/send-news', async (req, res) => {
    const { title, description, imageUrl } = req.body;
    if (!title || !description) {
        return res.status(400).json({ message: 'El título y la descripción son obligatorios.' });
    }
    // Asegurarse de que el bot esté listo antes de intentar enviar
    if (client.info) {
        try {
            // CORRECCIÓN APLICADA: Acceder directamente a la propiedad client.sendNews
            if (client.sendNews) {
                 await client.sendNews(title, description, imageUrl);
                 return res.status(200).json({ message: '✅ Noticia enviada a todos los grupos de notificación.' });
            } else {
                 return res.status(500).json({ message: '❌ Error interno: Función de enviar noticias no encontrada. El bot no ha inicializado la función.' });
            }
            
        } catch (error) {
            console.error('Error al enviar noticia desde el panel:', error);
            return res.status(500).json({ message: '❌ Error interno al enviar la noticia. Asegúrate de que el bot esté conectado y tenga permisos.' });
        }
    } else {
        return res.status(503).json({ message: '❌ El bot de WhatsApp no está conectado. Inténtalo de nuevo cuando el QR haya sido escaneado.' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor web escuchando en el puerto ${PORT}`);
});

// --- FUNCIONES PARA EL BOT DE WHATSAPP ---

// Función para calcular la distancia de Levenshtein (para similitud)
function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const cost = (a[j - 1] === b[i - 1]) ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[b.length][a.length];
}

// ↓↓↓ FUNCIÓN FALTANTE AÑADIDA PARA CORREGIR EL "ReferenceError: shuffleArray is not defined" ↓↓↓

// Algoritmo Fisher-Yates para barajar un array
function shuffleArray(array) {
    const a = [...array]; // Clave: Creamos una copia para no modificar el array original
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ↑↑↑ FUNCIÓN AÑADIDA ↑↑↑

// CORRECCIONES PARA ESTABILIDAD DE CONEXIÓN (TIMEOUT)
const client = new Client({
    authStrategy: new LocalAuth(),
    qrMaxRetries: 5,     // Aumenta los reintentos de generar el QR
    qrTimeout: 60000,    // Aumenta el tiempo de espera a 60 segundos
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    }
});
// FIN DE CORRECCIONES PARA ESTABILIDAD DE CONEXIÓN (TIMEOUT)

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Cliente de WhatsApp listo y conectado.');
    
    // Función para enviar notificaciones de cambios
    const sendNotification = async (type, data) => {
        const groupIds = readData('notification.json');
        
        for (const groupId of groupIds) {
            const chat = await client.getChatById(groupId).catch(e => console.error(`Error al obtener chat ${groupId}:`, e));
            if (!chat) continue;

            let mensaje = '';
            let media = null;
            let command = '';

            if (type === 'addon') {
                mensaje = `> *Nuevo Addon Agregado:*\n> *Nombre:* ${data.nombre}\n> *Formato:* ${data.formato}`;
                command = `/addon-${data.nombre}`;
            } else if (type === 'mc-version') {
                mensaje = `> *Nueva Versión de Minecraft Agregada:*\n> *Versión:* ${data.nombre}`;
                command = `/mc-${data.nombre}`;
            }

            const mensajeFinal = `${mensaje}\n\n*Para obtenerlo, usa el comando:* \`\`\`${command}\`\`\``;

            if (data.urlImg) {
                try {
                    media = await MessageMedia.fromUrl(data.urlImg);
                } catch (mediaError) {
                    console.error('Error al cargar imagen de notificación (se enviará sin imagen):', mediaError);
                }
            }
            
            if (media) {
                await chat.sendMessage(media, { caption: mensajeFinal }).catch(e => console.error(`Error al enviar notificación con imagen a ${chat.name}:`, e));
            } else {
                await chat.sendMessage(mensajeFinal).catch(e => console.error(`Error al enviar notificación a ${chat.name}:`, e));
            }
        }
    };
    
    // Función para enviar noticias desde el panel (Exportada para uso en la API)
    const sendNews = async (title, description, imageUrl) => {
        const groupIds = readData('notification.json');
        const newsMessage = `
📰 *¡Nueva Noticia de JR-TechStudios!* 📰

*${title.toUpperCase()}*

${description}
`;

        for (const groupId of groupIds) {
            const chat = await client.getChatById(groupId).catch(e => console.error(`Error al obtener chat ${groupId}:`, e));
            if (!chat) continue;

            if (imageUrl) {
                try {
                    const media = await MessageMedia.fromUrl(imageUrl);
                    await chat.sendMessage(media, { caption: newsMessage }).catch(e => console.error(`Error al enviar la noticia a ${chat.name}:`, e));
                } catch (mediaError) {
                    console.error(`Error al cargar imagen de noticia para el chat ${chat.name}:`, mediaError);
                    await chat.sendMessage(newsMessage + '\n\n_No se pudo cargar la imagen de la noticia._').catch(e => console.error(`Error al enviar la noticia a ${chat.name}:`, e));
                }
            } else {
                await chat.sendMessage(newsMessage).catch(e => console.error(`Error al enviar la noticia a ${chat.name}:`, e));
            }
        }
    };
    // Adjuntar sendNews a client para poder acceder desde la API
    client.sendNews = sendNews; // Asignación clave para el acceso por la API

    fs.watchFile(path.join(__dirname, 'addons.json'), (curr, prev) => {
        if (curr.mtime.getTime() !== prev.mtime.getTime()) {
            const newAddons = readData('addons.json');
            if (newAddons.length > lastAddons.length) {
                const newAddon = newAddons[0];
                sendNotification('addon', newAddon);
            }
            lastAddons = newAddons; 
        }
    });

    fs.watchFile(path.join(__dirname, 'mc-version.json'), (curr, prev) => {
        if (curr.mtime.getTime() !== prev.mtime.getTime()) {
            const newVersions = readData('mc-version.json');
            if (newVersions.length > lastMcVersions.length) {
                const newVersion = newVersions[0];
                sendNotification('mc-version', newVersion);
            }
            lastMcVersions = newVersions; 
        }
    });
});

client.on('message', async msg => {
    const contenido = msg.body;
    const contenidoNormalizado = contenido.toLowerCase().trim();
    const chat = await msg.getChat();

    const formatResponse = (text) => {
        return `*${NOMBRE_BOT}*\n\n${text}\n\n_${SUB_NOMBRE_BOT}_`;
    };

    // --- LÓGICA DE MODERACIÓN DE GRUPOS (sin cambios) ---
    if (chat.isGroup) {
        const groupId = chat.id._serialized;
        const groupAdmins = readData('group.json');
        
        if (groupAdmins.includes(groupId)) {
            const admins = readData('admins.json');
            const permitido = readData('permitido.json');
            const senderId = msg.author;
            
            if (!admins.includes(senderId)) {
                let isHarmful = false;
                let reason = '';
                
                const linkRegex = /(https?:\/\/\S+|www\.\S+)/gi;
                if (linkRegex.test(contenido) && !permitido.includes(contenido)) {
                    isHarmful = true;
                    reason = 'enlace no permitido';
                }

                if (msg.type === 'document') {
                    if (!permitido.includes(msg.filename)) {
                        isHarmful = true;
                        reason = 'archivo no permitido';
                    }
                }
                
                if (isHarmful) {
                    try {
                        await msg.delete(true);
                        console.log(`Mensaje eliminado en el grupo ${chat.name} por ${reason}.`);
                        const notificacion = await chat.sendMessage(formatResponse(`🚫 Mensaje eliminado automáticamente por contener un ${reason}.`));
                        setTimeout(() => {
                           notificacion.delete(true).catch(e => console.error('Error al eliminar la notificación:', e));
                        }, 5000);
                    } catch (error) {
                        console.error('Error al intentar eliminar el mensaje:', error);
                        if (error.message.includes('not a group admin')) {
                            chat.sendMessage(formatResponse('⚠️ No tengo permisos de administrador para eliminar mensajes. Por favor, hazme administrador para activar esta función.'));
                        }
                    }
                    return;
                }
            }
        }
    }

    // --- LÓGICA DE COMANDOS DEL BOT ---

// Dentro de la lógica de cualquier comando (ejemplo: /ID
        if (contenidoNormalizado === '/id') {
            const chat = await msg.getChat();
            
            // AÑADE ESTA LÍNEA para ver quién usó el comando
            console.log(`Comando /ID usado por: ${msg.author}`);
            
            // Requisito 1: Imprimir ID en la terminal (si es un grupo)
            if (chat.isGroup) {
                console.log(`\n========================================`);
                console.log(`ID del grupo [${chat.name}]: ${chat.id._serialized}`);
                console.log(`========================================\n`);
                
                // Requisito 2: Responder en el chat
                msg.reply(formatResponse('✅ *ID* del grupo enviada a *JR-TechStudios*.'));
            } 
            return; // Detiene el procesamiento para que no siga con otros comandos.
        }

// ↓↓↓ COMIENZA EL CÓDIGO NUEVO PARA /RANDOM-ADDON ↓↓↓

        // 0.1. Comando para obtener un Addon Aleatorio
        if (contenidoNormalizado === '/rms-addon') {
            const addons = readData('addons.json');
            
            if (addons.length === 0) {
                msg.reply(formatResponse('❌ No hay addons registrados para elegir al azar.'));
                return;
            }

            // 1. Seleccionar un índice aleatorio
            const randomIndex = Math.floor(Math.random() * addons.length);
            const addonEncontrado = addons[randomIndex];

            // 2. Construir el mensaje
            const mensaje = `> *🎉 Addon Aleatorio: ${addonEncontrado.nombre}*\n` +
                                     `> *Formato:* ${addonEncontrado.formato}\n` +
                                     `*Descarga:* ${addonEncontrado.urlDws}`;

            // 3. Enviar el mensaje, manejando la imagen si existe
            if (addonEncontrado.urlImg) {
                try {
                    const media = await MessageMedia.fromUrl(addonEncontrado.urlImg);
                    await msg.reply(media, undefined, { caption: formatResponse(mensaje) });
                } catch (mediaError) {
                    console.error('Error al enviar imagen de addon aleatorio:', mediaError);
                    msg.reply(formatResponse(mensaje + "\n\n_No se pudo cargar la imagen del addon._"));
                }
            } else {
                msg.reply(formatResponse(mensaje));
            }
            return; // Detiene el procesamiento después de ejecutar el comando
        }

// ↑↑↑ FIN DEL CÓDIGO NUEVO PARA /rms-ADDON ↑↑↑


// ↓↓↓ COMANDO /TLM-VIEW (SOLUCIÓN AL ERROR DE shuffleArray) ↓↓↓

        // 0.3. Comando para enviar todos los addons uno por uno con un retraso (Time Lapse Mass View)
        if (contenidoNormalizado === '/tlm-view') {
            const addonsOriginal = readData('addons.json');
            
            if (addonsOriginal.length === 0) {
                msg.reply(formatResponse('❌ No hay addons registrados para enviar.'));
                return;
            }

            // CLAVE: 1. Barajamos (shuffle) la lista de addons. Ya que la función está definida arriba, esto funciona.
            const addons = shuffleArray([...addonsOriginal]);
            
            const chat = await msg.getChat();
            const cantidadAddons = addons.length;
            const nombreGrupo = chat.isGroup ? chat.name : 'privado';
            
            // 2. Mensaje de inicio
            await msg.reply(formatResponse(
                `📢 Se mandarán *${cantidadAddons} addons* al grupo *${nombreGrupo}* en orden aleatorio.\n` +
                `El envío comenzará en 6 segundos y se enviará 1 addon cada 6 segundos para evitar spam.`
            ));

            console.log(`Comando /tlm-view iniciado en ${nombreGrupo}. Enviando ${cantidadAddons} addons de forma aleatoria.`);

            // 3. Iteración con retraso (Delay Loop)
            for (let i = 0; i < cantidadAddons; i++) {
                const addon = addons[i];
                
                // Usamos setTimeout para introducir el retraso de 6000ms (6 segundos)
                setTimeout(async () => {
                    const command = `/addon-${addon.nombre}`;
                    
                    const mensaje = `> *Addon Actual:* ${addon.nombre}\n` +
                                    `> *Formato:* ${addon.formato}\n` +
                                    `\n*Para obtenerlo, usa el comando:* \`\`\`${command}\`\`\``;
                    
                    let media = null;
                    
                    // Intenta cargar la imagen si existe
                    if (addon.urlImg) {
                        try {
                            media = await MessageMedia.fromUrl(addon.urlImg);
                        } catch (mediaError) {
                            console.error(`Error al cargar imagen para addon ${addon.nombre} (se enviará sin imagen):`, mediaError);
                        }
                    }
                    
                    try {
                        // Envía el mensaje y la imagen si se cargó correctamente
                        if (media) {
                            await chat.sendMessage(media, { caption: formatResponse(mensaje) });
                        } else {
                            await chat.sendMessage(formatResponse(mensaje));
                        }
                    } catch (sendError) {
                        console.error(`Error al enviar addon ${addon.nombre} al chat ${chat.name}:`, sendError);
                    }
                    
                    // 4. Mensaje de finalización
                    if (i === cantidadAddons - 1) {
                        await chat.sendMessage(formatResponse('✅ *Lista de addons completa.*'));
                    }

                }, i * 6000 + 6000); 
            }
            
            return; 
        }

// ↑↑↑ FIN DEL COMANDO /TLM-VIEW ↑↑↑

// ↓↓↓ COMIENZA EL CÓDIGO CORREGIDO PARA /NOTICE-VIEW ↓↓↓

        // 0.2. Comando para ver contenido del archivo local 'view-archive/'
        if (contenidoNormalizado === '/notice-view') {
            const ARCHIVE_PATH = path.join(__dirname, 'view-archive');
            
            // 1. Verificar si el directorio existe
            if (!fs.existsSync(ARCHIVE_PATH)) {
                msg.reply(formatResponse('❌ Error: La carpeta `view-archive/` no existe en el servidor.'));
                return;
            }

            // 2. Leer archivos en el directorio
            const files = fs.readdirSync(ARCHIVE_PATH)
                            .filter(file => !file.startsWith('.')) // Excluir archivos ocultos como .DS_Store
                            .sort(); 

            // 3. Verificar si el directorio está vacío
            if (files.length === 0) {
                msg.reply(formatResponse('⚠️ La carpeta `Notice` está vacía. ¡No hay noticias para mostrar!'));
                return;
            }

            // 4. Seleccionar el primer archivo
            const selectedFile = files[0];
            const filePath = path.join(ARCHIVE_PATH, selectedFile);
            
            // 5. Obtener los nombres para mostrar y la extensión
            const fileExtension = path.extname(selectedFile); 
            const baseName = path.basename(selectedFile, fileExtension);
            const nameForDisplay = baseName;
            
            // ⚠️ CORRECCIÓN CLAVE: Definimos 'fileName' como el nombre COMPLETO (selectedFile) 
            const fileName = selectedFile; // Usado para logging y mensajes de error
            
            // 6. Determinar el tipo de contenido y generar la descripción
            const isMedia = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov', '.webm'].includes(fileExtension.toLowerCase());
            
            const mensaje = `> *Archivo Destacado del Archivo:*\n` +
                                `> *Nombre:* ${nameForDisplay}\n` + 
                                `> *Tipo:* ${isMedia ? 'Multimedia' : 'Documento'}\n` +
                                `\n_Noticia mas reciente..._`;
            
            // 7. Enviar el archivo
            try {
                const media = MessageMedia.fromFilePath(filePath);
                
                await msg.reply(media, undefined, { caption: formatResponse(mensaje) });
                console.log(`Comando /notice-view usado. Enviado archivo: ${fileName}.`);

            } catch (mediaError) {
                // CORRECCIÓN CLAVE 2: Usamos la variable fileName correctamente definida.
                console.error(`Error al enviar el archivo local ${fileName}:`, mediaError.message); 
                
                // Opción de reserva: si falla el envío de medios, se envía un mensaje simple
                msg.reply(formatResponse(`❌ Error al enviar el archivo ${fileName}. Verifique que el archivo no esté corrupto.`));
            }
            
            return; // Detiene el procesamiento
        }

// ↑↑↑ FIN DEL CÓDIGO CORREGIDO PARA /NOTICE-VIEW ↑↑↑
    
        if (contenido.startsWith('/')) {
          // 1. Comando para enviar noticias (solo para admins)
        if (contenido.startsWith('/nts-')) {
            const admins = readData('admins.json');
            const senderId = msg.author;
            
            if (!admins.includes(senderId)) {
                msg.reply(formatResponse('❌ No tienes permisos para usar este comando.'));
                return;
            }

            const parts = contenido.substring('/nts-'.length).split('-[>');
            if (parts.length < 2) {
                msg.reply(formatResponse('❌ Formato de comando incorrecto. El formato correcto es:\n\n/nts-[*título*]-[> *descripción*]-[url de imagen opcional]'));
                return;
            }

            const title = parts[0].trim();
            const rest = parts[1].split(']-[url');
            const description = rest[0].trim().replace(/\]/g, ''); 
            const imageUrl = rest[1] ? rest[1].trim().replace(/\]/g, '') : '';

            if (!title || !description) {
                msg.reply(formatResponse('❌ El título y la descripción no pueden estar vacíos.'));
                return;
            }

            if (client.sendNews) {
                 await client.sendNews(title, description, imageUrl);
                 msg.reply(formatResponse('✅ Noticia enviada a todos los grupos de notificación.'));
            } else {
                 msg.reply(formatResponse('❌ Error: La función de enviar noticias no está disponible.'));
            }
            return;
        }

        // 2. Comando para listar todos los Addons
        else if (contenidoNormalizado === '/list-addons') {
            const addons = readData('addons.json');
            if (addons.length === 0) {
                msg.reply(formatResponse('❌ No hay addons registrados actualmente.'));
                return;
            }

            let listado = '*Lista de Addons Disponibles* 📚\n\n';
            addons.forEach((addon) => {
                listado += `> *Nombre:* ${addon.nombre}\n`;
                listado += `> *Formato:* ${addon.formato}\n`;
                listado += `> *Comando:* \`\`\`/addon-${addon.nombre}\`\`\`\n`;
                listado += '---------------------------------\n';
            });

            listado += `\nUsa el comando correspondiente para la descarga.`;
            msg.reply(formatResponse(listado));
            return;
        }

        // 3. Comando para listar todas las Versiones de Minecraft
        else if (contenidoNormalizado === '/list-mc') {
            const mcVersions = readData('mc-version.json');
            if (mcVersions.length === 0) {
                msg.reply(formatResponse('❌ No hay versiones de Minecraft registradas actualmente.'));
                return;
            }

            let listado = '*Lista de Versiones de Minecraft* 📱\n\n';
            mcVersions.forEach((version) => {
                listado += `> *Versión:* ${version.nombre}\n`;
                listado += `> *Comando:* \`\`\`/mc-${version.nombre}\`\`\`\n`;
                listado += '---------------------------------\n';
            });

            listado += `\nUsa el comando correspondiente para la descarga.`;
            msg.reply(formatResponse(listado));
            return;
        }

        // 4. Lógica de búsqueda individual: MC VERSION
        else if (contenidoNormalizado.startsWith('/mc-')) {
            const mcName = contenido.substring('/mc-'.length).trim().toLowerCase();
            let mcVersions = readData('mc-version.json');
            
            let versionEncontrada = mcVersions.find(v => v.nombre.toLowerCase() === mcName);

            if (!versionEncontrada) {
                let sugerencia = null;
                let menorDistancia = Infinity;

                mcVersions.forEach(v => {
                    const distancia = levenshteinDistance(mcName, v.nombre.toLowerCase());
                    if (distancia < menorDistancia) {
                        menorDistancia = distancia;
                        sugerencia = v.nombre;
                    }
                });
                
                if (sugerencia && menorDistancia <= 3) {
                    msg.reply(formatResponse(
                        `❌ Versión '${mcName}' no encontrada.\n` +
                        `¿Quizás quisiste decir: */mc-${sugerencia}*?`
                    ));
                } else {
                    msg.reply(formatResponse(`❌ Versión '${mcName}' no encontrada.`));
                }
                return;
            }
            
            const mensaje = `> *Versión de Minecraft: ${versionEncontrada.nombre}*\n` +
                                     `*Descarga:* ${versionEncontrada.urlDws}`;
            
            if (versionEncontrada.urlImg) {
                try {
                    const media = await MessageMedia.fromUrl(versionEncontrada.urlImg);
                    await msg.reply(media, undefined, { caption: formatResponse(mensaje) });
                } catch (mediaError) {
                    console.error('Error al enviar imagen de versión de MC:', mediaError);
                    msg.reply(formatResponse(mensaje + "\n\n_No se pudo cargar la imagen._"));
                }
            } else {
                msg.reply(formatResponse(mensaje));
            }
            return;
        } 
        
        // 5. Lógica de búsqueda individual: ADDON
        else if (contenidoNormalizado.startsWith('/addon-')) {
            const addonName = contenido.substring('/addon-'.length).trim().toLowerCase();
            let addons = readData('addons.json');
            
            let addonEncontrado = addons.find(a => a.nombre.toLowerCase() === addonName);
            
            if (!addonEncontrado) {
                let sugerencia = null;
                let menorDistancia = Infinity;

                addons.forEach(a => {
                    const distancia = levenshteinDistance(addonName, a.nombre.toLowerCase());
                    if (distancia < menorDistancia) {
                        menorDistancia = distancia;
                        sugerencia = a.nombre;
                    }
                });

                if (sugerencia && menorDistancia <= 3) {
                    msg.reply(formatResponse(
                        `❌ Addon '${addonName}' no encontrado.\n` +
                        `¿Quizás quisiste decir: */addon-${sugerencia}*`
                    ));
                } else {
                    msg.reply(formatResponse(`❌ Addon '${addonName}' no encontrado.`));
                }
                return;
            }

            const mensaje = `> *Addon: ${addonEncontrado.nombre}*\n` +
                                     `> *Formato:* ${addonEncontrado.formato}\n` +
                                     `*Descarga:* ${addonEncontrado.urlDws}`;
            
            if (addonEncontrado.urlImg) {
                try {
                    const media = await MessageMedia.fromUrl(addonEncontrado.urlImg);
                    await msg.reply(media, undefined, { caption: formatResponse(mensaje) });
                } catch (mediaError) {
                    console.error('Error al enviar imagen de addon:', mediaError);
                    msg.reply(formatResponse(mensaje + "\n\n_No se pudo cargar la imagen._"));
                }
            } else {
                msg.reply(formatResponse(mensaje));
            }
            return;
        } 
        
        // 6. Respuestas automáticas generales
        else {
            let autoRespuestas = {};
            try {
                autoRespuestas = JSON.parse(fs.readFileSync('auto-respuestas.json', 'utf8'));
            } catch (error) {}
            const respuesta = autoRespuestas[contenidoNormalizado];
            if (respuesta) {
                const mensajeFinal = formatResponse(respuesta.respuesta);
                
                if (respuesta.imagenUrl) {
                    try {
                        const media = await MessageMedia.fromUrl(respuesta.imagenUrl);
                        await msg.reply(media, undefined, { caption: mensajeFinal });
                    } catch (mediaError) {
                        console.error('Error al enviar la imagen para la respuesta:', mediaError);
                        msg.reply(mensajeFinal + "\n\n_No se pudo cargar la imagen._");
                    }
                } else {
                    msg.reply(mensajeFinal);
                }
            }
        }
    }
});

client.initialize();