function inicializarPagoMovil() {
    const formPago = document.getElementById('form-pago-movil');
    
    // Si el HTML del pago aún no ha cargado, esperamos 50ms y volvemos a buscarlo.
    // Esto evita que el código falle y la página se quede en un bucle.
    if (!formPago) {
        setTimeout(inicializarPagoMovil, 50);
        return;
    }

    // Evitamos duplicar el evento si el script se llega a inyectar dos veces
    if (formPago.dataset.activo === "true") return;
    formPago.dataset.activo = "true";

    // --- TU BOTÓN DE ESCAPE ---
    // Creamos un botón para que puedas salir del bucle en tus pruebas y volver al inicio
    const btnSalir = document.createElement('button');
    btnSalir.type = 'button';
    btnSalir.innerHTML = "❌ Cancelar y Volver al Inicio";
    btnSalir.style.cssText = "background: none; color: #EF4444; border: none; margin-top: 15px; width: 100%; font-size: 14px; cursor: pointer; text-decoration: underline;";
    
    btnSalir.onclick = () => {
        // Esto borra tu rastro y te devuelve al botón naranja
        localStorage.removeItem('id_solicitud_ayuda');
        location.reload();
    };
    formPago.appendChild(btnSalir);
    // --------------------------

    const supabaseUrl = 'https://gguybbqqeixjqtdsmljp.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXliYnFxZWl4anF0ZHNtbGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDIxNzIsImV4cCI6MjA5ODMxODE3Mn0.d9WBBnYC9LgvoKhHzA4dl4nTiE_a06EKo48kAiujIdo';
    const clienteSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    formPago.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que la página se recargue y te deje atrapado
        
        const btnEnviar = document.getElementById('btn-enviar-pago');
        btnEnviar.disabled = true;
        btnEnviar.innerText = "Procesando...";

        const banco = document.getElementById('pago-banco').value;
        const cedulaCompleta = document.getElementById('pago-tipo-cedula').value + document.getElementById('pago-cedula').value;
        const telefono = document.getElementById('pago-telefono').value;

        const solicitudId = localStorage.getItem('id_solicitud_ayuda');

        if (!solicitudId) {
            alert("Error: No se encontró la referencia de tu registro.");
            btnEnviar.disabled = false;
            btnEnviar.innerText = "Solicitar Transferencia";
            return;
        }

        try {
            const { error } = await clienteSupabase
                .from('solicitudes_ayuda')
                .update({ 
                    banco: banco,
                    pago_movil_cedula: cedulaCompleta,
                    pago_movil_telefono: telefono,
                    estatus: 'finalizado'
                })
                .eq('id', solicitudId);

            if (error) throw error;

            alert("¡Éxito! Datos de Pago Móvil enviados. Tu transferencia está en cola.");
            
            // IMPORTANTE: Eliminamos el location.reload() y el borrado de localStorage de aquí.
            // Ahora, al cambiar el estatus a 'finalizado', tu archivo confirmar.js 
            // lo detectará mágicamente en tiempo real y te mostrará la pantalla de Registro Exitoso y noticias.

        } catch (err) {
            alert("Error al enviar datos de pago: " + err.message);
            btnEnviar.disabled = false;
            btnEnviar.innerText = "Solicitar Transferencia";
        }
    });
}

// Arrancamos la función
inicializarPagoMovil();

