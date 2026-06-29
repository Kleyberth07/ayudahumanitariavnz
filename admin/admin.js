const supabaseUrl = 'https://gguybbqqeixjqtdsmljp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXliYnFxZWl4anF0ZHNtbGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDIxNzIsImV4cCI6MjA5ODMxODE3Mn0.d9WBBnYC9LgvoKhHzA4dl4nTiE_a06EKo48kAiujIdo';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    fetchSolicitudes();
    document.getElementById('btn-refrescar').addEventListener('click', fetchSolicitudes);
    
    // Escuchar el envío del formulario de noticias
    const formNoticia = document.getElementById('form-publicar-noticia');
    if(formNoticia) {
        formNoticia.addEventListener('submit', publicarNoticia);
    }
});

async function fetchSolicitudes() {
    try {
        const { data: solicitudes, error } = await supabase
            .from('solicitudes_ayuda')
            .select('*')
            .order('creado_el', { ascending: false });
        
        if (error) throw error;
        renderTabla(solicitudes);
    } catch (err) {
        console.error("Error cargando solicitudes:", err.message);
    }
}

function renderTabla(data) {
    const tbody = document.getElementById('lista-solicitudes');
    tbody.innerHTML = '';

    document.getElementById('num-pendientes').innerText = data.filter(s => s.estatus === 'pendiente').length;
    document.getElementById('num-aprobados').innerText = data.filter(s => s.estatus === 'aprobado').length;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay solicitudes registradas</td></tr>`;
        return;
    }

    data.forEach(solicitud => {
        const tr = document.createElement('tr');
        
        const datosPago = solicitud.banco 
            ? `<strong>${solicitud.banco}</strong><br>${solicitud.pago_movil_cedula}<br>${solicitud.pago_movil_telefono}`
            : `<span style="color:#64748B; font-style:italic;">Esperando datos</span>`;

        let botonAccion = '';
        if (solicitud.estatus === 'pendiente') {
            botonAccion = `<button class="btn-aprobar" onclick="aprobarSolicitud('${solicitud.id}')">✓ Aprobar</button>`;
        } else if (solicitud.estatus === 'finalizado') {
            botonAccion = `<span style="color:#38BDF8; font-weight:bold;">Listo para Transferir</span>`;
        } else {
            botonAccion = `<span style="color:#94A3B8;">Aprobado (Esperando Usuario)</span>`;
        }

        tr.innerHTML = `
            <td><strong>${solicitud.nombre_completo}</strong></td>
            <td>
                <a href="${solicitud.url_cedula}" target="_blank" class="doc-link">👁 Cédula</a>
                <a href="${solicitud.url_direccion}" target="_blank" class="doc-link">👁 RIF</a>
            </td>
            <td><span class="status-label status-${solicitud.estatus}">${solicitud.estatus.toUpperCase()}</span></td>
            <td>${datosPago}</td>
            <td>${botonAccion}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function aprobarSolicitud(id) {
    if(!confirm("¿Deseas aprobar la identidad de este usuario afectado?")) return;

    try {
        const { error } = await supabase
            .from('solicitudes_ayuda')
            .update({ estatus: 'aprobado' })
            .eq('id', id);
            
        if (error) throw error;
        fetchSolicitudes();
    } catch (err) {
        alert("Error al aprobar: " + err.message);
    }
}

async function publicarNoticia(e) {
    e.preventDefault();
    const titulo = document.getElementById('noticia-titulo').value;
    const contenido = document.getElementById('noticia-contenido').value;
    const url_imagen = document.getElementById('noticia-url-img').value;

    try {
        const { error } = await supabase
            .from('noticias')
            .insert([{ titulo, contenido, url_imagen }]);
        
        if (error) throw error;

        alert("¡Reporte oficial publicado con éxito!");
        document.getElementById('form-publicar-noticia').reset();
    } catch (err) {
        alert("Error al publicar noticia: " + err.message);
    }
}
