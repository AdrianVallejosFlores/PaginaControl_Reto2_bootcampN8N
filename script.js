const WEBHOOK_URL = "https://training.intersim.cloud/webhook/b3b3d576-d3b3-4171-92de-adf0ecafba93";

const HEADERS = {
    "Content-Type": "application/json",
    "x-api-key": "15252363avf$X"
};

document.getElementById("refreshBtn").addEventListener("click", loadTickets);

// 🔵 FORMATEAR FECHA
function formatDate(dateString){

    if(!dateString) return "—";

    const date = new Date(dateString);

    return date.toLocaleString("es-BO", {
        timeZone: "America/La_Paz"
    });
}


// 🔵 SOLICITAR TICKETS
async function loadTickets(){

    const container = document.getElementById("ticketsContainer");
    container.innerHTML = "Cargando tickets...";

    try{

        const response = await fetch(WEBHOOK_URL,{
            method:"POST",
            headers:HEADERS,
            body:JSON.stringify({
                PETICION:"SOLICITAR TICKETS"
            })
        });

        let tickets = await response.json();

        // Si el webhook devuelve un solo objeto lo convertimos en array
        if (!Array.isArray(tickets)) {
            tickets = [tickets];
        }

        if(!tickets || tickets.length === 0){
            container.innerHTML = "<p>No hay tickets registrados</p>";
            return;
        }

        renderTickets(tickets);

    }catch(error){

        container.innerHTML = "<p>Error cargando tickets</p>";
        console.error(error);

    }
}


// 🟢 RENDERIZAR
function renderTickets(tickets){

    const container = document.getElementById("ticketsContainer");
    container.innerHTML = "";

    const orden = {
        ESCALADO:1,
        ABIERTO:2,
        CERRADO:3
    };

    tickets.sort((a,b)=>orden[a.estado] - orden[b.estado]);

    tickets.forEach(ticket=>{

        const estadoClass = ticket.estado.toLowerCase();

        const div = document.createElement("div");
        div.classList.add("ticket",estadoClass);

        div.innerHTML = `
            <h3>${ticket.ticket_id || "Sin ID"}</h3>

            <p><strong>Cliente:</strong> ${ticket.cliente_id || "—"}</p>

            <p><strong>Mensaje:</strong> ${ticket.mensaje || "Sin mensaje"}</p>

            <p><strong>Urgencia:</strong> ${ticket.urgencia || "—"}</p>

            <p><strong>Estado:</strong> ${ticket.estado}</p>

            <p><strong>Creado:</strong> ${formatDate(ticket.fecha_creacion)}</p>

            <p><strong>Cierre:</strong> ${formatDate(ticket.fecha_cierre)}</p>

            ${
                ticket.estado !== "CERRADO"
                ?
                `<button class="close-btn" onclick="deleteTicket('${ticket.ticket_id}')">
                    ❌ Eliminar Ticket
                </button>`
                :
                ""
            }
        `;

        container.appendChild(div);

    });
}



// 🔴 ELIMINAR TICKET
async function deleteTicket(ticketId){

    try{

        await fetch(WEBHOOK_URL,{
            method:"POST",
            headers:HEADERS,
            body:JSON.stringify({
                PETICION:"eliminar ticket",
                ticket_id:ticketId
            })
        });

        loadTickets();

    }catch(error){

        console.error("Error eliminando ticket:",error);

    }

}


// Auto cargar
loadTickets();