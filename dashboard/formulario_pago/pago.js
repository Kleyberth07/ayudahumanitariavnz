setTimeout(() => {
    const formPago = document.getElementById('form-pago-movil');
    
    // Configuración de Supabase (Reemplazar por las tuyas o heredar del entorno global)
    const supabaseUrl = 'TU_SUPABASE_URL';
    const supabaseKey = 'TU_SUPABASE_ANON_KEY';
    // const supabase = supabase.createClient(supabaseUrl, supabaseKey);

    formPago.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnEnviar = document.getElementById('btn-enviar-pago');
        btnEnviar.disabled = true;
        btnEnviar.innerText = "Procesando...";

        const banco = document.getElementById('pago-banco').value;
        const cedulaCompleta = document.getElementById('pago-tipo-cedula').value + document.getElementById('pago-cedula').value;
        const telefono = document.getElementById('pago-telefono').value;

        // Recuperamos el ID de la solicitud guardado previamente en el localStorage durante el registro inicial
        const solicitudId = localStorage.getItem('id_solicitud_ayuda');

        if (!solicitudId) {
            alert("Error: No se encontró la referencia de tu registro inicial.");
            btnEnviar.disabled = false;
            btnEnviar.innerText = "Solicitar Transferencia";
            return;
        }

        /* Lógica real de Supabase a implementar:
        const { data, error } = await supabase
            .from('solicitudes_ayuda')
            .update({ 
                banco: banco,
                pago_movil_cedula: cedulaCompleta,
                pago_movil_telefono: telefono,
                estatus: 'finalizado' // Cambia a finalizado para que pase a la cola de transferencias del admin
            })
            .eq('id', solicitudId);

        if (!error) {
            alert("Datos de pago guardados exitosamente. Tu transferencia está en cola de procesamiento.");
            location.reload();
        } else {
            alert("Error al guardar los datos: " + error.message);
            btnEnviar.disabled = false;
            btnEnviar.innerText = "Solicitar Transferencia";
        }
        */

        // Simulación visual en local para desarrollo:
        alert("¡Éxito! Datos enviados al panel de administración para proceder con el pago móvil.");
        localStorage.removeItem('id_solicitud_ayuda');
        location.reload();
    });
}, 100);
