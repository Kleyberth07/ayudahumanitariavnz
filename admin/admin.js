// 1. INICIALIZACIÓN
const supabaseUrl = 'https://gguybbqqeixjqtdsmljp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXliYnFxZWl4anF0ZHNtbGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDIxNzIsImV4cCI6MjA5ODMxODE3Mn0.d9WBBnYC9LgvoKhHzA4dl4nTiE_a06EKo48kAiujIdo';
const clienteSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    fetchSolicitudes();
    
    const btnRefrescar = document.getElementById('btn-refrescar');
    if (btnRefrescar) btnRefrescar.addEventListener('click', fetchSolicitudes);
    
    const formNoticia = document.getElementById('form-publicar-noticia');
    if (formNoticia) {
        formNoticia.addEventListener('submit', publicarNoticia);
    }
});

// 2. BUSCAR GENTE REGISTRADA EN SUPABASE
async function fetchSolicitudes() {
    try {
        const { data: solicitudes, error } = await clienteSupabase
            .from('solicitudes_ayuda')
            .select('*')
            .order('creado_el', { ascending: false });
        
        if (error) throw error;
        renderTabla(solicitudes);
    } catch (err) {
        console.error("Error cargando solicitudes:", err.message);
    }
}

// 3. PINTAR LA TABLA CON LA GENTE
function renderTabla(data) {
    const tbody = document.getElementById('lista-solicitudes');
    if (!tbody) return;

    tbody.innerHTML = '';

    const numPendientes = document.getElementById('num-pendientes');
    const numAprobados = document.getElementById('num-aprobados');
    
    if (numPendientes) numPendientes.innerText = data.filter(s => s.estatus === 'pendiente').length;
    if (numAprobados) numAprobados.innerText = data.filter(s => s.estatus === 'aprobado' || s.estatus === 'finalizado').length;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay solicitudes registradas</td></tr>`;
        return;
    }

    data.forEach(solicitud => {
        const tr = document.createElement('tr');
        
        const datosPago = solicitud.banco 
            ? `<strong>${solicitud.banco}</strong><br>${solicitud.pago_movil_cedula}<br>${solicitud.pago_movil_telefono}`
            : `<span style="color:#64748B; font-style:italic;">Esperando datos</span>`;

        // LÓGICA DE BOTONES: Aprobar, Rechazar o Mostrar Estado
        let botonAccion = '';
        if (solicitud.estatus === 'pendiente') {
            botonAccion = `
                <div style="display: flex; gap: 5px; flex-direction: column;">
                    <button onclick="aprobarSolicitud('${solicitud.id}')" style="background-color: #10B981; color: white; padding: 6px; border: none; border-radius: 4px; cursor: pointer;">✓ Aprobar</button>
                    <button onclick="rechazarSolicitud('${solicitud.id}')" style="background-color: #EF4444; color: white; padding: 6px; border: none; border-radius: 4px; cursor: pointer;">✗ Rechazar</button>
                </div>
            `;
        } else if (solicitud.estatus === 'aprobado') {
            botonAccion = `
                <span style="color:#10B981; font-weight:bold;">✓ Aprobado</span>
                <br><span style="color:#64748B; font-size: 0.8rem;">El usuario ya puede mandar su pago móvil.</span>
            `;
        } else if (solicitud.estatus === 'finalizado') {
            botonAccion = `<span style="color:#38BDF8; font-weight:bold;">🟢 Listo para Transferir</span>`;
        }

        tr.innerHTML = `
            <td><strong>${solicitud.nombre_completo}</strong></td>
            <td>
                <a href="#" onclick="verDocumento('${solicitud.url_cedula}'); return false;" class="doc-link">👁 Cédula</a>
                <a href="#" onclick="verDocumento('${solicitud.url_direccion}'); return false;" class="doc-link">👁 RIF</a>
            </td>
            <td><span class="status-label status-${solicitud.estatus}">${solicitud.estatus.toUpperCase()}</span></td>
            <td>${datosPago}</td>
            <td>${botonAccion}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 4. PREVENIR EL ERROR 404 AL VER DOCUMENTOS SIMULADOS
window.verDocumento = function(url) {
    if (url.includes('pendiente') || url.includes('simulada')) {
        alert("Este es un documento de prueba. Más adelante configuraremos la subida de fotos reales.");
    } else {
        window.open(url, '_blank');
    }
}

// 5. BOTÓN DE APROBAR USUARIO
window.aprobarSolicitud = async function(id) {
    if(!confirm("¿Deseas aprobar la identidad de este usuario afectado?")) return;

    try {
        const { error } = await clienteSupabase
            .from('solicitudes_ayuda')
            .update({ estatus: 'aprobado' })
            .eq('id', id);
            
        if (error) throw error;
        fetchSolicitudes(); 
    } catch (err) {
        alert("Error al aprobar: " + err.message);
    }
}

// 6. BOTÓN DE RECHAZAR (BORRAR DE LA BASE DE DATOS)
window.rechazarSolicitud = async function(id) {
    if(!confirm("⚠️ ¿Estás seguro de que quieres RECHAZAR y BORRAR esta solicitud permanentemente?")) return;

    try {
        const { error } = await clienteSupabase
            .from('solicitudes_ayuda')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        fetchSolicitudes(); 
        alert("Solicitud rechazada y eliminada del sistema.");
    } catch (err) {
        alert("Error al eliminar: " + err.message);
    }
}

// 7. ENVIAR NOTICIAS A LA BASE DE DATOS
async function publicarNoticia(e) {
    e.preventDefault();
    
    const btnSubmit = e.target.querySelector('button');
    if(btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerText = "Publicando...";
    }

    const titulo = document.getElementById('noticia-titulo').value;
    const contenido = document.getElementById('noticia-contenido').value;
    const url_imagen = document.getElementById('noticia-url-img').value;

    try {
        const { error } = await clienteSupabase
            .from('noticias')
            .insert([{ titulo, contenido, url_imagen }]);
        
        if (error) throw error;

        alert("¡Reporte oficial publicado con éxito!");
        document.getElementById('form-publicar-noticia').reset();
    } catch (err) {
        alert("Error al publicar noticia: " + err.message);
    } finally {
        if(btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerText = "Publicar Reporte";
        }
    }
}
