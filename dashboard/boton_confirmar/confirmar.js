// 1. INICIALIZACIÓN (Usamos clienteSupabase para evitar conflictos)
const supabaseUrl = 'https://gguybbqqeixjqtdsmljp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXliYnFxZWl4anF0ZHNtbGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDIxNzIsImV4cCI6MjA5ODMxODE3Mn0.d9WBBnYC9LgvoKhHzA4dl4nTiE_a06EKo48kAiujIdo';
const clienteSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. VERIFICADOR DE ESTADO (Mantiene la página donde debe estar al recargar)
document.addEventListener('DOMContentLoaded', async () => {
    const idGuardado = localStorage.getItem('id_solicitud_ayuda');
    
    if (idGuardado) {
        // Consultamos el estado actual y la hora exacta en la que se creó en la base de datos
        const { data, error } = await clienteSupabase
            .from('solicitudes_ayuda')
            .select('estatus, creado_el')
            .eq('id', idGuardado)
            .single();

        if (data) {
            // Ocultamos todo lo del inicio
            const modal = document.getElementById('modal-documentos');
            if (modal) {
                modal.classList.add('modal-oculto');
                modal.classList.remove('modal-activo');
            }
            document.getElementById('modulo-confirmar').style.display = 'none';

            if (data.estatus === 'aprobado' || data.estatus === 'finalizado') {
                // Si ya lo aprobaste en el admin, lo mandamos directo al pago
                document.getElementById('modulo-espera').style.display = 'none';
                document.getElementById('modulo-pago').style.display = 'block';
                if (typeof cargarModulo === 'function') {
                    cargarModulo('modulo-pago', 'formulario_pago/pago.html', 'formulario_pago/pago.css', 'formulario_pago/pago.js');
                }
            } else {
                // Si sigue pendiente, lo dejamos en espera y reactivamos el reloj exacto
                document.getElementById('modulo-espera').style.display = 'block';
                iniciarContador(data.creado_el);
                escucharAprobacionEnTiempoReal(idGuardado);
            }
        }
    }
});

// 3. RELOJ INTELIGENTE (Basado en la hora real de Supabase)
function iniciarContador(fechaRegistro) {
    // Convertimos la hora de Supabase a milisegundos
    const tiempoInicio = new Date(fechaRegistro).getTime();
    const duracionTotal = 10 * 60 * 1000; // 10 minutos exactos

    // Buscamos el párrafo donde vamos a meter el tiempo para que actualice en pantalla
    const moduloEspera = document.getElementById('modulo-espera');
    let textoReloj = document.getElementById('texto-contador');
    
    if (!textoReloj && moduloEspera) {
        // Si no le pusiste ID al texto en HTML, agarramos el primer párrafo dinámicamente
        const p = moduloEspera.querySelector('p');
        if (p) {
            p.id = 'texto-contador';
            textoReloj = p;
        }
    }

    const intervalo = setInterval(() => {
        const ahora = new Date().getTime();
        const transcurrido = ahora - tiempoInicio;
        const restante = duracionTotal - transcurrido;

        if (restante <= 0) {
            clearInterval(intervalo);
            if(textoReloj) {
                textoReloj.innerHTML = "⏳ <strong>Tiempo cumplido.</strong> Verificando estado de asignación...";
            }
        } else {
            const minutos = Math.floor((restante % (1000 * 60 * 60)) / (1000 * 60));
            const segundos = Math.floor((restante % (1000 * 60)) / 1000);
            
            if(textoReloj) {
                // Esto actualiza el texto visual en tu web segundo a segundo
                textoReloj.innerHTML = `⏳ En aproximadamente <strong>${minutos}m ${segundos}s</strong> se habilitará la opción para registrar tus datos de asignación.`;
            }
        }
    }, 1000); // Se refresca cada segundo
}

// 4. ABRIR Y CERRAR EL MODAL
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

// 5. GUARDAR DATOS POR PRIMERA VEZ
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
                // Guardamos el ID en el teléfono de la persona
                localStorage.setItem('id_solicitud_ayuda', data[0].id);
                
                // Cerramos modal y pasamos a la espera
                const modal = document.getElementById('modal-documentos');
                if(modal) {
                    modal.classList.add('modal-oculto');
                    modal.classList.remove('modal-activo');
                }
                
                document.getElementById('modulo-confirmar').style.display = 'none';
                document.getElementById('modulo-espera').style.display = 'block';

                // Activamos el reloj pasándole la hora exacta en la que se guardó en la BD
                iniciarContador(data[0].creado_el);
                
                // Activamos el radar por si lo apruebas rápido
                escucharAprobacionEnTiempoReal(data[0].id);
            }

        } catch (err) {
            alert("Error al registrar solicitud: " + err.message);
            btnEnviar.disabled = false;
            btnEnviar.innerText = "Enviar Documentos";
        }
    }
});

// 6. RADAR EN TIEMPO REAL (Escucha si le das "Aprobar" en el Admin)
function escucharAprobacionEnTiempoReal(idSolicitud) {
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
