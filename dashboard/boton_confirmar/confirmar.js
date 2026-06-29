// Inicialización con tus credenciales de Supabase
const supabaseUrl = 'https://gguybbqqeixjqtdsmljp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXliYnFxZWl4anF0ZHNtbGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDIxNzIsImV4cCI6MjA5ODMxODE3Mn0.d9WBBnYC9LgvoKhHzA4dl4nTiE_a06EKo48kAiujIdo';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 1. DELEGACIÓN DE EVENTOS PARA LOS CLICS (A prueba de fallos de carga dinámica)
document.addEventListener('click', (e) => {
    // Si presionan "Confirmar Ayuda" (Abrir Modal)
    if (e.target && e.target.id === 'btn-abrir-modal') {
        const modal = document.getElementById('modal-documentos');
        if (modal) {
            modal.classList.add('modal-activo');
            modal.classList.remove('modal-oculto');
        }
    }
    
    // Si presionan "Cancelar" (Cerrar Modal)
    if (e.target && e.target.id === 'btn-cerrar-modal') {
        const modal = document.getElementById('modal-documentos');
        if (modal) {
            modal.classList.add('modal-oculto');
            modal.classList.remove('modal-activo');
        }
    }
});

// 2. DELEGACIÓN DE EVENTOS PARA EL FORMULARIO
document.addEventListener('submit', async (e) => {
    // Solo ejecutamos si el formulario que se envió es el de confirmación
    if (e.target && e.target.id === 'form-confirmacion') {
        e.preventDefault();
        
        const btnEnviar = document.getElementById('btn-enviar-datos');
        btnEnviar.disabled = true;
        btnEnviar.innerText = "Enviando...";

        const nombre = document.getElementById('nombre-completo').value;
        const urlCedulaSimulada = "documentos/cedula_pendiente.jpg";
        const urlDireccionSimulada = "documentos/rif_pendiente.jpg";

        try {
            const { data, error } = await supabase
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
                // Guardamos el ID en el dispositivo
                localStorage.setItem('id_solicitud_ayuda', data[0].id);
                
                // Ocultamos todo y pasamos al estado de espera
                const modal = document.getElementById('modal-documentos');
                modal.classList.add('modal-oculto');
                modal.classList.remove('modal-activo');
                
                document.getElementById('modulo-confirmar').style.display = 'none';
                document.getElementById('modulo-espera').style.display = 'block';

                // Activamos el radar en tiempo real
                escucharAprobacionEnTiempoReal(data[0].id);
            }

        } catch (err) {
            alert("Error al registrar solicitud: " + err.message);
            btnEnviar.disabled = false;
            btnEnviar.innerText = "Enviar Documentos";
        }
    }
});

// 3. RADAR EN TIEMPO REAL (Escucha a Supabase)
function escucharAprobacionEnTiempoReal(idSolicitud) {
    supabase
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
                
                // Cargamos el módulo de pago móvil dinámicamente
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
