// GUARDIA DE SEGURIDAD
const CLAVE_ADMIN = "TU_CLAVE_AQUI"; // <--- Cambia esto por la clave que quieras
const claveIngresada = prompt("⚠️ Acceso restringido. Introduce la clave de administrador:");

if (claveIngresada !== CLAVE_ADMIN) {
    alert("Acceso denegado.");
    window.location.href = "../index.html"; // Te saca de ahí si la clave está mal
}

// 1. INICIALIZACIÓN
const supabaseUrl = 'https://gguybbqqeixjqtdsmljp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXliYnFxZWl4anF0ZHNtbGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDIxNzIsImV4cCI6MjA5ODMxODE3Mn0.d9WBBnYC9LgvoKhHzA4dl4nTiE_a06EKo48kAiujIdo';
const clienteSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    fetchSolicitudes();
    fetchGestionNoticias(); 
    
    const btnRefrescar = document.getElementById('btn-refrescar');
    if (btnRefrescar) btnRefrescar.addEventListener('click', () => {
        fetchSolicitudes();
        fetchGestionNoticias(); 
    });
    
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

// 3. PINTAR LA TABLA CON LA GENTE (CIRUGÍA APLICADA AQUÍ: Se eliminó el enlace del RIF)
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

        // Aquí ya no figura el RIF, solo la Cédula
        tr.innerHTML = `
            <td><strong>${solicitud.nombre_completo}</strong></td>
            <td>
                <a href="#" onclick="verDocumento('${solicitud.url_cedula}'); return false;" class="doc-link">👁 Cédula</a>
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
        fetchGestionNoticias(); 
    } catch (err) {
        alert("Error al publicar noticia: " + err.message);
    } finally {
        if(btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerText = "Publicar Reporte";
        }
    }
}

// 8. TRAER TODAS LAS NOTICIAS AL PANEL DE ADMINISTRADOR
async function fetchGestionNoticias() {
    const contenedor = document.getElementById('lista-gestion-noticias');
    if (!contenedor) return;

    try {
        const { data: noticias, error } = await clienteSupabase
            .from('noticias')
            .select('*')
            .order('creado_el', { ascending: false });

        if (error) throw error;

        if (!noticias || noticias.length === 0) {
            contenedor.innerHTML = '<p style="color:#64748B; font-style:italic;">No hay reportes publicados en la base de datos.</p>';
            return;
        }

        contenedor.innerHTML = '';
        noticias.forEach(item => {
            const div = document.createElement('div');
            div.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#F8FAFC; padding:12px; border:1px solid #E2E8F0; border-radius:6px; gap:10px;";
            
            div.innerHTML = `
                <div style="flex:1;">
                    <h4 style="margin:0 0 4px 0; color:#1E293B; font-size:14px;">${item.titulo}</h4>
                    <p style="margin:0; color:#64748B; font-size:12px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${item.contenido}</p>
                </div>
                <button onclick="eliminarNoticiaDesdeAdmin('${item.id}')" style="background:#EF4444; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px; flex-shrink:0;">Eliminar</button>
            `;
            contenedor.appendChild(div);
        });

    } catch (err) {
        console.error("Error listando noticias en panel:", err.message);
    }
}

// 9. ELIMINAR NOTICIA DESDE EL PANEL
window.eliminarNoticiaDesdeAdmin = async function(id) {
    if (!confirm("⚠️ ¿Estás seguro de que quieres eliminar este reporte del sistema? Desaparecerá de la vista de los usuarios.")) return;

    try {
        const { error } = await clienteSupabase
            .from('noticias')
            .delete()
            .eq('id', id);

        if (error) throw error;
        alert("Reporte eliminado correctamente.");
        fetchGestionNoticias(); 
    } catch (err) {
        alert("Error al eliminar el reporte: " + err.message);
    }
}
