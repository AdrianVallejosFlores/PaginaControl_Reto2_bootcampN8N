const WEBHOOK_URL     = "https://training.intersim.cloud/webhook/gestionar_tickets";
const METRICS_WEBHOOK = "https://training.intersim.cloud/webhook/metricasv2";
const HEADERS = {
    "Content-Type": "application/json",
    "x-api-key": "15252363avf$X"
};

const SENTIMENTS = { positivo: "😊", neutro: "😐", negativo: "😞" };

// Variable para guardar el ticket activo en el modal
let ticketActivo = null;

document.getElementById("refreshBtn")?.addEventListener("click", loadTickets);
document.getElementById("updateMetricsBtn").addEventListener("click", updateMetrics);

// 🔵 FORMATEAR FECHA
function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleString("es-BO", { timeZone: "America/La_Paz" });
}

function shortDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("es-BO", {
        timeZone: "America/La_Paz",
        day: "2-digit",
        month: "short"
    });
}

// 🔵 CARGAR TICKETS
async function loadTickets() {

    const container = document.getElementById("ticketsContainer");
    container.innerHTML = `
        <div class="loading-row">
            <div class="skel" style="width:70px"></div>
            <div class="skel" style="flex:1"></div>
            <div class="skel" style="width:60px"></div>
            <div class="skel" style="width:80px"></div>
        </div>
        <div class="loading-row">
            <div class="skel" style="width:70px"></div>
            <div class="skel" style="flex:1"></div>
            <div class="skel" style="width:60px"></div>
            <div class="skel" style="width:80px"></div>
        </div>
        <div class="loading-row">
            <div class="skel" style="width:70px"></div>
            <div class="skel" style="flex:1"></div>
            <div class="skel" style="width:60px"></div>
            <div class="skel" style="width:80px"></div>
        </div>`;

    try {
        const res = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: HEADERS,
            body: JSON.stringify({ PETICION: "SOLICITAR TICKETS" })
        });

        let tickets = await res.json();
        if (!Array.isArray(tickets)) tickets = [tickets];

        if (!tickets || tickets.length === 0) {
            container.innerHTML = `<div class="empty">No hay tickets registrados</div>`;
            return;
        }

        updateStats(tickets);
        updateDonut(tickets);
        renderTickets(tickets);
        renderFeed(tickets);

    } catch (error) {
        container.innerHTML = `<div class="empty">Error cargando tickets</div>`;
        console.error(error);
    }
}

// 🟢 ACTUALIZAR ESTADÍSTICAS
function updateStats(tickets) {
    const esc = tickets.filter(t => t.estado === "ESCALADO").length;
    const ab  = tickets.filter(t => t.estado === "ABIERTO").length;
    const cer = tickets.filter(t => t.estado === "CERRADO").length;
    const tot = tickets.length;

    document.getElementById("statEscalado").textContent = esc;
    document.getElementById("statAbierto").textContent  = ab;
    document.getElementById("statCerrado").textContent  = cer;
    document.getElementById("statTotal").textContent    = tot;
    document.getElementById("openCount").textContent    = esc + ab;
    document.getElementById("lastUpdated").textContent  = "Actualizado: " + new Date().toLocaleTimeString("es-BO");

    document.getElementById("legEsc").textContent = esc;
    document.getElementById("legAb").textContent  = ab;
    document.getElementById("legCer").textContent = cer;
}

// 🟢 ACTUALIZAR DONUT
function updateDonut(tickets) {
    const esc = tickets.filter(t => t.estado === "ESCALADO").length;
    const ab  = tickets.filter(t => t.estado === "ABIERTO").length;
    const cer = tickets.filter(t => t.estado === "CERRADO").length;
    const tot = tickets.length;

    const circ = 2 * Math.PI * 14;
    const gap  = 1;
    const pEsc = (esc / tot) * circ;
    const pAb  = (ab  / tot) * circ;
    const pCer = (cer / tot) * circ;

    document.getElementById("arcEscalado").setAttribute("stroke-dasharray", `${pEsc - gap} ${circ - (pEsc - gap)}`);
    document.getElementById("arcAbierto").setAttribute("stroke-dasharray",  `${pAb  - gap} ${circ - (pAb  - gap)}`);
    document.getElementById("arcAbierto").setAttribute("stroke-dashoffset", -(pEsc));
    document.getElementById("arcCerrado").setAttribute("stroke-dasharray",  `${pCer - gap} ${circ - (pCer - gap)}`);
    document.getElementById("arcCerrado").setAttribute("stroke-dashoffset", -(pEsc + pAb));
}

// 🟢 RENDERIZAR TABLA
// ⚠️ Solo los tickets ESCALADOS son clickeables — ABIERTOS y CERRADOS quedan bloqueados
function renderTickets(tickets) {
    const container = document.getElementById("ticketsContainer");
    const orden = { ESCALADO: 1, ABIERTO: 2, CERRADO: 3 };
    tickets.sort((a, b) => orden[a.estado] - orden[b.estado]);

    container.innerHTML = tickets.map(t => {
        const esEscalado = t.estado === "ESCALADO";

        const clickAttr = esEscalado
            ? `onclick="openModal(${JSON.stringify(t).replace(/"/g, '&quot;')})"` 
            : `onclick="ticketBloqueado()"`;

        const lockedClass = esEscalado ? "" : "ticket-locked";

        return `
        <div class="ticket-row ${lockedClass}" ${clickAttr}>
            <span class="tid">${t.ticket_id || "—"}</span>
            <span class="tmsg">${t.mensaje || "Sin mensaje"}</span>
            <span class="turg ${(t.urgencia || "").toLowerCase()}">${t.urgencia || "—"}</span>
            <span><span class="badge ${(t.estado || "").toLowerCase()}">${t.estado || "—"}</span></span>
            <span class="tsentiment">${SENTIMENTS[t.sentimiento] || "—"}</span>
        </div>`;
    }).join("");
}

// 🔒 FEEDBACK cuando se intenta click en ticket no escalado
function ticketBloqueado() {
    // Evita duplicar el toast si ya hay uno visible
    if (document.getElementById("lockedToast")) return;

    const toast = document.createElement("div");
    toast.id = "lockedToast";
    toast.textContent = "⚠️  Solo se pueden gestionar tickets ESCALADOS";
    toast.style.cssText = `
        position: fixed;
        bottom: 28px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--surface);
        color: var(--sub);
        font-family: 'DM Sans', sans-serif;
        font-size: 13px;
        font-weight: 500;
        padding: 11px 22px;
        border-radius: 8px;
        border: 1px solid var(--border);
        z-index: 9999;
        pointer-events: none;
        opacity: 0;
        transition: opacity .2s ease;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(toast);

    // Fade in
    requestAnimationFrame(() => { toast.style.opacity = "1"; });

    // Fade out y eliminar
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 250);
    }, 2200);
}

// 🟢 RENDERIZAR FEED
function renderFeed(tickets) {
    const feed = document.getElementById("feedList");
    
    // ← AGREGA ESTO: ordena por fecha más reciente primero
    const sorted = [...tickets].sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
    // const feed = document.getElementById("feedList");
    feed.innerHTML = sorted.slice(0, 6).map(t => `
        <div class="feed-item">
            <div class="feed-time">${shortDate(t.fecha_creacion)} · ${t.tipo_cliente || "Cliente"}</div>
            <div class="feed-msg">
                <strong>${t.ticket_id}</strong> — ${(t.mensaje || "").substring(0, 60)}…
            </div>
        </div>`).join("");
}

// ═══════════════════════════════════════
// 🟣 MODAL
// ═══════════════════════════════════════

function openModal(ticket) {
    // Guardia extra: solo ESCALADOS pueden abrir el modal
    if (ticket.estado !== "ESCALADO") return;

    ticketActivo = ticket;

    // Breadcrumb
    document.getElementById("bcCurrent").textContent = ticket.ticket_id;

    // Contenido del modal
    document.getElementById("modalTicketId").textContent = ticket.ticket_id || "—";
    document.getElementById("modalTicketMsg").textContent = ticket.mensaje || "Sin mensaje";
    document.getElementById("modalRespuesta").value = "";

    // Reset borde por si quedó en rojo de intento anterior
    document.getElementById("modalRespuesta").style.borderColor = "";

    // Meta badges
    document.getElementById("modalMeta").innerHTML = `
        <span class="badge ${(ticket.estado || "").toLowerCase()}">${ticket.estado || "—"}</span>
        <span class="turg ${(ticket.urgencia || "").toLowerCase()}" style="font-size:12px;font-weight:600">
            ${ticket.urgencia || "—"}
        </span>
        <span style="font-size:16px">${SENTIMENTS[ticket.sentimiento] || "—"}</span>
        <span style="font-size:12px;color:var(--sub)">${ticket.tipo_cliente || ""}</span>
    `;

    // Mostrar modal
    document.getElementById("modalOverlay").classList.add("open");
    setTimeout(() => document.getElementById("modalRespuesta").focus(), 100);
}

function closeModal(e) {
    if (e.target === document.getElementById("modalOverlay")) {
        closeModalDirect();
    }
}

function closeModalDirect() {
    document.getElementById("modalOverlay").classList.remove("open");
    document.getElementById("bcCurrent").textContent = "Tickets";

    // Reset botón por si quedó en estado "Enviando…"
    const btn = document.getElementById("modalSendBtn");
    btn.textContent = "Enviar respuesta →";
    btn.disabled = false;

    ticketActivo = null;
}

// Cerrar con ESC
document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModalDirect();
});

// ═══════════════════════════════════════
// 🟣 RESOLVER TICKET (flujo completo)
// ═══════════════════════════════════════

async function resolverTicket() {
    if (!ticketActivo) return;

    // Guardia extra por si acaso
    if (ticketActivo.estado !== "ESCALADO") {
        ticketBloqueado();
        return;
    }

    const respuesta = document.getElementById("modalRespuesta").value.trim();
    if (!respuesta) {
        document.getElementById("modalRespuesta").focus();
        document.getElementById("modalRespuesta").style.borderColor = "var(--red)";
        return;
    }

    // Reset borde
    document.getElementById("modalRespuesta").style.borderColor = "";

    const btn = document.getElementById("modalSendBtn");
    btn.textContent = "Enviando…";
    btn.disabled = true;

    try {
        // PASO 1 — Resolver ticket escalado
        await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: HEADERS,
            body: JSON.stringify({
                PETICION: "RESOLVER TICKET ESCALADO",
                ticket_id: ticketActivo.ticket_id,
                respuesta: respuesta
            })
        });

        // PASO 2 — Eliminar ticket
        await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: HEADERS,
            body: JSON.stringify({
                PETICION: "eliminar ticket",
                ticket_id: ticketActivo.ticket_id
            })
        });

        // Cerrar modal y recargar
        closeModalDirect();
        loadTickets();

    } catch (error) {
        console.error("Error resolviendo ticket:", error);
        btn.textContent = "Error — reintentar";
        btn.disabled = false;
    }
}

// 🔴 ELIMINAR TICKET
async function deleteTicket(ticketId) {
    try {
        await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: HEADERS,
            body: JSON.stringify({ PETICION: "eliminar ticket", ticket_id: ticketId })
        });
        loadTickets();
    } catch (error) {
        console.error("Error eliminando ticket:", error);
    }
}

// 📊 ACTUALIZAR MÉTRICAS
async function updateMetrics() {
    try {
        await fetch(METRICS_WEBHOOK, {
            method: "POST",
            headers: HEADERS,
            body: JSON.stringify({ PETICION: "ACTUALIZAR METRICAS" })
        });
        alert("Métricas actualizadas correctamente");
    } catch (error) {
        console.error("Error actualizando métricas:", error);
        alert("Error al actualizar métricas");
    }
}

// Auto cargar
loadTickets();