(function () {
    // URL de destino guardada en el script
    const TARGET_URL = "http://cualsea223.falixsrv.me:23756/";
    const REDIRECT_URL = "https://www.google.com";

    // 1. Carga dinámica del iframe evitando bloqueos de caché
    document.addEventListener("DOMContentLoaded", function () {
        const container = document.getElementById("app-container");
        if (container) {
            const iframe = document.createElement("iframe");
            iframe.src = TARGET_URL;
            iframe.allow = "fullscreen; autoplay; clipboard-read; clipboard-write";
            iframe.style.width = "100%";
            iframe.style.height = "100%";
            iframe.style.border = "none";
            
            // Intenta capturar eventos directamente dentro del iframe si es del mismo origen
            iframe.onload = function() {
                try {
                    attachProtection(iframe.contentWindow.document);
                } catch (e) {
                    // Si el servidor bloquea el acceso entre dominios (CORS), 
                    // la protección de ventana global seguirá funcionando.
                }
            };

            container.appendChild(iframe);
        }
    });

    // Función unificada para aplicar bloqueos
    function attachProtection(doc) {
        // Bloquear clic derecho (Menú contextual)
        doc.addEventListener("contextmenu", function (e) {
            e.preventDefault();
            return false;
        });

        // Bloquear teclas F1 a F12 y combinaciones Ctrl / Cmd
        doc.addEventListener("keydown", function (e) {
            // Bloquear F1 - F12
            if (e.keyCode >= 112 && e.keyCode <= 123) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            const isCtrlOrCmd = e.ctrlKey || e.metaKey;

            // Bloquear cualquier combinación con Ctrl o Cmd (Ctrl+U, Ctrl+S, Ctrl+Shift+I, etc.)
            if (isCtrlOrCmd) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }, true);
    }

    // Aplicar protección a la página principal
    attachProtection(document);

    // 2. Detección de DevTools por tamaño de ventana
    function checkWindowSize() {
        const threshold = 160;
        const widthDiff = window.outerWidth - window.innerWidth > threshold;
        const heightDiff = window.outerHeight - window.innerHeight > threshold;

        if (widthDiff || heightDiff) {
            window.location.href = REDIRECT_URL;
        }
    }
    setInterval(checkWindowSize, 500);

    // 3. Detección mediante pausa de ejecución (debugger)
    setInterval(function () {
        const startTime = performance.now();
        debugger;
        const endTime = performance.now();
        if (endTime - startTime > 100) {
            window.location.href = REDIRECT_URL;
        }
    }, 1000);
})();
