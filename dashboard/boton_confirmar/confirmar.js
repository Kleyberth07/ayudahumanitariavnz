// 1. INICIALIZACIÓN (Usamos clienteSupabase para no chocar con el nombre del CDN)
const supabaseUrl = 'https://gguybbqqeixjqtdsmljp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXliYnFxZWl4anF0ZHNtbGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDIxNzIsImV4cCI6MjA5ODMxODE3Mn0.d9WBBnYC9LgvoKhHzA4dl4nTiE_a06EKo48kAiujIdo';
const clienteSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. DELEGACIÓN DE EVENTOS PARA LOS CLICS
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'btn-abrir-modal') {
        const modal = document.getElementById('modal-documentos');
        if (modal) {
            modal.classList.add('modal-activo');
            modal.classList.remove('modal-oculto');
        }
    }
    
    if (e.target && e.target.id === 'btn-cerrar-modal') {
        const modal = document.getElementById('modal-documentos');
        if (modal) {
            modal.classList.add('modal-oculto');
            modal.classList.remove('modal-activo');
        }
    }
});

// 3. DELEGACIÓN DE EVENTOS PARA EL FORMULARIO
document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'form-confirmacion') {
        e.preventDefault();
        
        const btnEnviar = document.getElementById('btn-enviar-datos');
        btnEnviar.disabled = true;
        btnEnviar.innerText = "Enviando...";

        const nombre = document.getElementById('nombre-completo').value;
        const urlCedulaSimulada = "documentos/cedula_pendiente.jpg";
        const urlDireccionSimulada = "documentos/rif_pendiente.jpg";

        try {
            // Usamos clienteSupabase en lugar de supabase
            const { data, error } = await clienteSupabase
                .from('solicitudes_ayuda')
                .insert([
                    { 
                        nombre_completo: nombre,
                        estatus: 'pendiente',
                        url_cedula: urlCedulaSimulada,
                        url_direccion: urlDireccionSimulada
                    }
                ])
                .select();

            if (error) throw error;

            if (data && data.length > 0) {
                localStorage.setItem('id_solicitud_ayuda', data[0].id);
                
                const modal = document.getElementById('modal-documentos');
                modal.classList.add('modal-oculto');
                modal.classList.remove('modal-activo');
                
                document.getElementById('modulo-confirmar').style.display = 'none';
                document.getElementById('modulo-espera').style.display = 'block';

                escucharAprobacionEnTiempoReal(data[0].id);
            }

        } catch (err) {
            alert("Error al registrar solicitud: " + err.message);
            btnEnviar.disabled = false;
            btnEnviar.innerText = "Enviar Documentos";
        }
    }
});

// 4. RADAR EN TIEMPO REAL
function escucharAprobacionEnTiempoReal(idSolicitud) {
    // Usamos clienteSupabase
    clienteSupabase
        .channel('cambios-solicitud')
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'solicitudes_ayuda',
            filter: `id=eq.${idSolicitud}`
        }, (payload) => {
            if (payload.new.estatus === 'aprobado') {
                document.getElementById('modulo-espera').style.display = 'none';
                document.getElementById('modulo-pago').style.display = 'block';
                
                if (typeof cargarModulo === 'function') {
                    cargarModulo(
                        'modulo-pago', 
                        'formulario_pago/pago.html', 
                        'formulario_pago/pago.css', 
                        'formulario_pago/pago.js'
                    );
                }
            }
        })
        .subscribe();
}
