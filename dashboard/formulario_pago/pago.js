setTimeout(() => {
    const formPago = document.getElementById('form-pago-movil');
    
    const supabaseUrl = 'https://gguybbqqeixjqtdsmljp.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXliYnFxZWl4anF0ZHNtbGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDIxNzIsImV4cCI6MjA5ODMxODE3Mn0.d9WBBnYC9LgvoKhHzA4dl4nTiE_a06EKo48kAiujIdo';
    
    // Cambiado a clienteSupabase para evitar errores con la librería
    const clienteSupabase = supabase.createClient(supabaseUrl, supabaseKey);

    formPago.addEventListener('submit', async (e) => {
        e.preventDefault();
        
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
                    estatus: 'finalizado' // Esto ya lo tenías excelente
                })
                .eq('id', solicitudId);

            if (error) throw error;

            alert("¡Éxito! Datos de Pago Móvil enviados. Tu transferencia está en cola.");
            localStorage.removeItem('id_solicitud_ayuda');
            location.reload();

        } catch (err) {
            alert("Error al enviar datos de pago: " + err.message);
            btnEnviar.disabled = false;
            btnEnviar.innerText = "Solicitar Transferencia";
        }
    });
}, 100);
