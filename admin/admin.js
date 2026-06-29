// Configuración de Supabase (Reemplazar por las tuyas)
const supabaseUrl = 'TU_SUPABASE_URL';
const supabaseKey = 'TU_SUPABASE_ANON_KEY';
// const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Simulación de datos locales para flujos de prueba sin conexión
let solicitudesDummy = [
    { id: "1", creado_el: new Date(), nombre_completo: "Carlos Mendoza", estatus: "pendiente", url_cedula: "#", url_direccion: "#", banco: null, pago_movil_cedula: null, pago_movil_telefono: null },
    { id: "2", creado_el: new Date(), nombre_completo: "María Rodríguez", estatus: "aprobado", url_cedula: "#", url_direccion: "#", banco: null, pago_movil_cedula: null, pago_movil_telefono: null },
    { id: "3", creado_el: new Date(), nombre_completo: "Pedro López", estatus: "finalizado", url_cedula: "#", url_direccion: "#", banco: "0102 - Banco de Venezuela", pago_movil_cedula: "V-14555666", pago_movil_telefono: "04147778899" }
];

document.addEventListener('DOMContentLoaded', () => {
    fetchSolicitudes();
    document.getElementById('btn-refrescar').addEventListener('click', fetchSolicitudes);
});

async function fetchSolicitudes() {
    /* Lógica de Producción con Supabase:
    const { data: solicitudes, error } = await supabase
        .from('solicitudes_ayuda')
        .select('*')
        .order('creado_el', { ascending: false });
    
    if (error) { console.error(error); return; }
    renderTabla(solicitudes);
    */
    
    // Renderizado simulado de prueba:
    renderTabla(solicitudesDummy);
}

function renderTabla(data) {
    const tbody = document.getElementById('lista-solicitudes');
    tbody.innerHTML = '';

    // Actualizar Contadores de métricas
    document.getElementById('num-pendientes').innerText = data.filter(s => s.estatus === 'pendiente').length;
    document.getElementById('num-aprobados').innerText = data.filter(s => s.estatus === 'aprobado').length;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay solicitudes registradas</td></tr>`;
        return;
    }

    data.forEach(solicitud => {
        const tr = document.createElement('tr');
        
        // Formatear la columna de datos de pago bancarios
        const datosPago = solicitud.banco 
            ? `<strong>${solicitud.banco}</strong><br>${solicitud.pago_movil_cedula}<br>${solicitud.pago_movil_telefono}`
            : `<span style="color:#64748B; font-style:italic;">Esperando aprobación / datos</span>`;

        // Condición para el botón de acción
        let botonAccion = '';
        if (solicitud.estatus === 'pendiente') {
            botonAccion = `<button class="btn-aprobar" onclick="aprobarSolicitud('${solicitud.id}')">✓ Aprobar</button>`;
        } else if (solicitud.estatus === 'finalizado') {
            botonAccion = `<span style="color:#10B981; font-weight:bold;">Listo para enviar</span>`;
        } else {
            botonAccion = `<span style="color:#94A3B8;">Esperando transferencia del usuario</span>`;
        }

        tr.innerHTML = `
            <td><strong>${solicitud.nombre_completo}</strong><br><span style="font-size:0.75rem; color:#64748B;">ID: ${solicitud.id}</span></td>
            <td>
                <a href="${solicitud.url_cedula}" target="_blank" class="doc-link">👁 Cédula</a>
                <a href="${solicitud.url_direccion}" target="_blank" class="doc-link">👁 Dirección</a>
            </td>
            <td><span class="status-label status-${solicitud.estatus}">${solicitud.estatus.toUpperCase()}</span></td>
            <td>${datosPago}</td>
            <td>${botonAccion}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function aprobarSolicitud(id) {
    if(!confirm("¿Estás seguro de que deseas aprobar la identidad de este usuario?")) return;

    /* Lógica Real de Producción con Supabase:
    const { data, error } = await supabase
        .from('solicitudes_ayuda')
        .update({ estatus: 'aprobado' })
        .eq('id', id);
        
    if(!error) { fetchSolicitudes(); }
    */

    // Simulación Local de cambio de estado:
    const idx = solicitudesDummy.findIndex(s => s.id === id);
    if (idx !== -1) {
        solicitudesDummy[idx].estatus = 'aprobado';
        fetchSolicitudes();
    }
}
