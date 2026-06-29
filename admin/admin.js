// 1. INICIALIZACIÓN (Con el nombre correcto para que no choque y muera el script)
const supabaseUrl = 'https://gguybbqqeixjqtdsmljp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXliYnFxZWl4anF0ZHNtbGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDIxNzIsImV4cCI6MjA5ODMxODE3Mn0.d9WBBnYC9LgvoKhHzA4dl4nTiE_a06EKo48kAiujIdo';
const clienteSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    // Apenas cargue la página, traemos a los usuarios
    fetchSolicitudes();
    
    // Botón manual de refrescar tabla
    const btnRefrescar = document.getElementById('btn-refrescar');
    if (btnRefrescar) btnRefrescar.addEventListener('click', fetchSolicitudes);
    
    // Activar el formulario de publicar noticias
    const formNoticia = document.getElementById('form-publicar-noticia');
    if (formNoticia) {
        formNoticia.addEventListener('submit', publicarNoticia);
    } else {
        console.warn("Falta el ID 'form-publicar-noticia' en el HTML del panel.");
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
    if (numAprobados) numAprobados.innerText = data.filter(s => s.estatus === 'aprobado').length;

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

// 4. BOTÓN DE APROBAR USUARIO
window.aprobarSolicitud = async function(id) {
    if(!confirm("¿Deseas aprobar la identidad de este usuario afectado?")) return;

    try {
        const { error } = await clienteSupabase
            .from('solicitudes_ayuda')
            .update({ estatus: 'aprobado' })
            .eq('id', id);
            
        if (error) throw error;
        fetchSolicitudes(); // Recargar tabla automáticamente
        alert("Usuario aprobado con éxito. Su pantalla cambiará en tiempo real.");
    } catch (err) {
        alert("Error al aprobar: " + err.message);
    }
}

// 5. ENVIAR NOTICIAS A LA BASE DE DATOS
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
