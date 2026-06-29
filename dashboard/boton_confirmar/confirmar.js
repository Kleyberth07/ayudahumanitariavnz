setTimeout(() => {
    const btnAbrir = document.getElementById('btn-abrir-modal');
    const btnCerrar = document.getElementById('btn-cerrar-modal');
    const modal = document.getElementById('modal-documentos');
    const formConfirmacion = document.getElementById('form-confirmacion');

    // Inicialización con tus credenciales de Supabase
    const supabaseUrl = 'https://gguybbqqeixjqtdsmljp.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXliYnFxZWl4anF0ZHNtbGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDIxNzIsImV4cCI6MjA5ODMxODE3Mn0.d9WBBnYC9LgvoKhHzA4dl4nTiE_a06EKo48kAiujIdo';
    const supabase = supabase.createClient(supabaseUrl, supabaseKey);

    btnAbrir.addEventListener('click', () => {
        modal.classList.add('modal-activo');
        modal.classList.remove('modal-oculto');
    });

    btnCerrar.addEventListener('click', () => {
        modal.classList.add('modal-oculto');
        modal.classList.remove('modal-activo');
    });

    formConfirmacion.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnEnviar = document.getElementById('btn-enviar-datos');
        btnEnviar.disabled = true;
        btnEnviar.innerText = "Enviando...";

        const nombre = document.getElementById('nombre-completo').value;
        
        // NOTA: Para producción real se sube a Supabase Storage. 
        // Por ahora, guardamos un string temporal para validar el flujo de la base de datos.
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
                // Guardamos el ID generado por Supabase para usarlo en el siguiente paso (Pago Móvil)
                localStorage.setItem('id_solicitud_ayuda', data[0].id);
                
                // Cambiar visualmente el estado del Dashboard a "Espera"
                modal.classList.add('modal-oculto');
                document.getElementById('modulo-confirmar').style.display = 'none';
                document.getElementById('modulo-espera').style.display = 'block';

                // Activar la escucha en tiempo real para cuando el Admin apruebe
                escucharAprobacionEnTiempoReal(data[0].id);
            }

        } catch (err) {
            alert("Error al registrar solicitud: " + err.message);
            btnEnviar.disabled = false;
            btnEnviar.innerText = "Enviar Documentos";
        }
    });

    // Función para detectar la aprobación en tiempo real sin recargar la página
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
                    // Ocultamos la espera y cargamos dinámicamente el formulario de pago
                    document.getElementById('modulo-espera').style.display = 'none';
                    document.getElementById('modulo-pago').style.display = 'block';
                    
                    cargarModulo(
                        'modulo-pago', 
                        'formulario_pago/pago.html', 
                        'formulario_pago/pago.css', 
                        'formulario_pago/pago.js'
                    );
                }
            })
            .subscribe();
    }
}, 100);
