// Asegurar que el DOM inyectado esté listo
setTimeout(() => {
    const btnAbrir = document.getElementById('btn-abrir-modal');
    const btnCerrar = document.getElementById('btn-cerrar-modal');
    const modal = document.getElementById('modal-documentos');
    const formConfirmacion = document.getElementById('form-confirmacion');

    // Inicializar Supabase (Reemplaza con tus URL y ANON_KEY)
    const supabaseUrl = 'TU_SUPABASE_URL';
    const supabaseKey = 'TU_SUPABASE_ANON_KEY';
    // Descomentar cuando coloques tus credenciales
    // const supabase = supabase.createClient(supabaseUrl, supabaseKey);

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
        
        // Aquí iría la lógica de subir imágenes a Supabase Storage y obtener sus URLs
        // URL_CEDULA = await supabase.storage...
        
        // Cambiar la vista a "Espera"
        modal.classList.add('modal-oculto');
        document.getElementById('modulo-confirmar').style.display = 'none';
        document.getElementById('modulo-espera').style.display = 'block';

        /* Lógica real de Supabase a implementar:
        const { data, error } = await supabase
            .from('solicitudes_ayuda')
            .insert([
                { 
                    nombre_completo: document.getElementById('nombre-completo').value,
                    estatus: 'pendiente',
                    url_cedula: 'url_storage_pendiente',
                    url_direccion: 'url_storage_pendiente'
                }
            ]);
        */
    });
}, 100); // Pequeño retraso para asegurar que el HTML del fetch ya existe en el DOM
