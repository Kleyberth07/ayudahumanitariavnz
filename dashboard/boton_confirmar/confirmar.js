// 1. INICIALIZACIÓN (Usamos clienteSupabase para evitar conflictos)
const supabaseUrl = 'https://gguybbqqeixjqtdsmljp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXliYnFxZWl4anF0ZHNtbGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDIxNzIsImV4cCI6MjA5ODMxODE3Mn0.d9WBBnYC9LgvoKhHzA4dl4nTiE_a06EKo48kAiujIdo';
const clienteSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. VERIFICADOR DE ESTADO A PRUEBA DE BALAS (Ciclo de rastreo)
async function verificarEstadoGuardado() {
    const idGuardado = localStorage.getItem('id_solicitud_ayuda');
    if (!idGuardado) return; 

    const moduloConfirmar = document.getElementById('modulo-confirmar');
    const moduloEspera = document.getElementById('modulo-espera');
    const moduloPago = document.getElementById('modulo-pago');
    const moduloFinal = document.getElementById('modulo-final');

    if (!moduloConfirmar || !moduloEspera) {
        setTimeout(verificarEstadoGuardado, 50);
        return;
    }

    moduloConfirmar.style.display = 'none';

    try {
        const { data, error } = await clienteSupabase
            .from('solicitudes_ayuda')
            .select('estatus, creado_el')
            .eq('id', idGuardado)
            .single();

        if (data) {
            const modal = document.getElementById('modal-documentos');
            if (modal) {
                modal.classList.add('modal-oculto');
                modal.classList.remove('modal-activo');
            }

            if (data.estatus === 'finalizado') {
                moduloEspera.style.display = 'none';
                if (moduloPago) moduloPago.style.display = 'none'; 
                if (moduloFinal) moduloFinal.style.display = 'block';
                
                if (typeof cargarNoticias === 'function') {
                    cargarNoticias(); 
                }
            } else if (data.estatus === 'aprobado') {
                moduloEspera.style.display = 'none';
                if (moduloPago) moduloPago.style.display = 'block';
                
                if (typeof cargarModulo === 'function') {
                    cargarModulo('modulo-pago', 'formulario_pago/pago.html', 'formulario_pago/pago.css', 'formulario_pago/pago.js');
                }
            } else {
                moduloEspera.style.display = 'block';
                iniciarContador(data.creado_el);
                escucharAprobacionEnTiempoReal(idGuardado);
            }
        }
    } catch (err) {
        console.error("Error verificando el estado:", err);
    }
}

verificarEstadoGuardado();

// 3. RELOJ INTELIGENTE (Basado en la hora real de Supabase)
function iniciarContador(fechaRegistro) {
    const tiempoInicio = new Date(fechaRegistro).getTime();
    const duracionTotal = 10 * 60 * 1000; 

    const moduloEspera = document.getElementById('modulo-espera');
    let textoReloj = document.getElementById('texto-contador');
    
    if (!textoReloj && moduloEspera) {
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
                textoReloj.innerHTML = `⏳ En aproximadamente <strong>${minutos}m ${segundos}s</strong> se habilitará la opción para registrar tus datos de asignación.`;
            }
        }
    }, 1000); 
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

// 5. CIRUGÍA INTERNA: GUARDAR DATOS DE TEXTO PLANO POR PRIMERA VEZ
document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'form-confirmacion') {
        e.preventDefault();
        
        const btnEnviar = document.getElementById('btn-enviar-datos');
        btnEnviar.disabled = true;
        btnEnviar.innerText = "Registrando...";

        // Capturamos el contenido de las nuevas casillas limpias
        const primerNombre = document.getElementById('reg-primer-nombre').value.trim();
        const segundoNombre = document.getElementById('reg-segundo-nombre').value.trim();
        const primerApellido = document.getElementById('reg-primer-apellido').value.trim();
        const segundoApellido = document.getElementById('reg-segundo-apellido').value.trim();
        
        // Unificamos el formato completo para mantener compatibilidad con tu columna original
        const nombreCompleto = `${primerNombre} ${segundoNombre} ${primerApellido} ${segundoApellido}`.replace(/\s+/g, ' ').trim();
        
        const cedula = document.getElementById('reg-cedula').value.trim();
        const direccion = document.getElementById('reg-direccion').value.trim();
        const ciudad = document.getElementById('reg-ciudad').value.trim();
        const estado = document.getElementById('reg-estado').value.trim();

        try {
            const { data, error } = await clienteSupabase
                .from('solicitudes_ayuda')
                .insert([
                    { 
                        nombre_completo: nombreCompleto,
                        nombres: `${primerNombre} ${segundoNombre}`.trim(),
                        apellidos: `${primerApellido} ${segundoApellido}`.trim(),
                        cedula: cedula,
                        direccion: direccion,
                        ciudad: ciudad,
                        estado: estado,
                        estatus: 'pendiente',
                        url_cedula: 'texto_plano', // Indicadores comodín para no alterar la estructura obligatoria de la tabla
                        url_direccion: 'texto_plano'
                    }
                ])
                .select();

            if (error) throw error;

            if (data && data.length > 0) {
                localStorage.setItem('id_solicitud_ayuda', data[0].id);
                
                const modal = document.getElementById('modal-documentos');
                if(modal) {
                    modal.classList.add('modal-oculto');
                    modal.classList.remove('modal-activo');
                }
                
                document.getElementById('modulo-confirmar').style.display = 'none';
                document.getElementById('modulo-espera').style.display = 'block';

                iniciarContador(data[0].creado_el);
                escucharAprobacionEnTiempoReal(data[0].id);
            }

        } catch (err) {
            alert("Error al registrar solicitud: " + err.message);
            btnEnviar.disabled = false;
            btnEnviar.innerText = "Confirmar Registro";
        }
    }
});

// 6. RADAR EN TIEMPO REAL 
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
            if (payload.new.estatus === 'finalizado') {
                document.getElementById('modulo-espera').style.display = 'none';
                
                const moduloPago = document.getElementById('modulo-pago');
                if (moduloPago) moduloPago.style.display = 'none'; 
                
                const moduloFinal = document.getElementById('modulo-final');
                if (moduloFinal) moduloFinal.style.display = 'block';
                
                if (typeof cargarNoticias === 'function') {
                    cargarNoticias(); 
                }
            }
        })
        .subscribe();
}
