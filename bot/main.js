(function () {
    // URL de destino guardada en el script
    const TARGET_URL = "http://cualsea223.falixsrv.me:23756/";
    const REDIRECT_URL = "https://www.google.com";

    // 1. Carga dinámica del iframe
    document.addEventListener("DOMContentLoaded", function () {
        const container = document.getElementById("app-container");
        if (container) {
            const iframe = document.createElement("iframe");
            iframe.src = TARGET_URL;
            iframe.allow = "fullscreen; autoplay; clipboard-read; clipboard-write";
            container.appendChild(iframe);
        }
    });

    // 2. Bloquear clic derecho (Menú contextual)
    document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        return false;
    });

    // 3. Bloquear teclas F1 a F12 y combinaciones Ctrl / Cmd
    document.addEventListener("keydown", function (e) {
        // Bloquear todas las teclas de función (F1 - F12)
        if (e.keyCode >= 112 && e.keyCode <= 123) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        const isCtrlOrCmd = e.ctrlKey || e.metaKey;

        // Bloquear cualquier combinación que use Ctrl o Cmd (Ctrl+U, Ctrl+S, Ctrl+Shift+I/J/C, etc.)
        if (isCtrlOrCmd) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);

    // 4. Detección de la consola de desarrollador (DevTools)
    
    // Método A: Basado en diferencia de tamaño de la ventana
    function checkWindowSize() {
        const threshold = 160;
        const widthDiff = window.outerWidth - window.innerWidth > threshold;
        const heightDiff = window.outerHeight - window.innerHeight > threshold;

        if (widthDiff || heightDiff) {
            window.location.href = REDIRECT_URL;
        }
    }
    setInterval(checkWindowSize, 500);

    // Método B: Detección mediante pausa de ejecución (debugger)
    setInterval(function () {
        const startTime = performance.now();
        debugger;
        const endTime = performance.now();
        // Si las herramientas de desarrollo están abiertas, la instrucción 'debugger' pausa el código
        if (endTime - startTime > 100) {
            window.location.href = REDIRECT_URL;
        }
    }, 1000);
})();
