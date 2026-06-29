setTimeout(() => {
    fetchNoticiasPublicas();
}, 100);

async function fetchNoticiasPublicas() {
    const contenedor = document.getElementById('contenedor-noticias-lista');
    
    // Conexión directa usando tus credenciales heredadas del contexto global de Supabase
    const supabaseUrl = 'https://gguybbqqeixjqtdsmljp.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXliYnFxZWl4anF0ZHNtbGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDIxNzIsImV4cCI6MjA5ODMxODE3Mn0.d9WBBnYC9LgvoKhHzA4dl4nTiE_a06EKo48kAiujIdo';
    const supabase = supabase.createClient(supabaseUrl, supabaseKey);

    try {
        const { data: noticias, error } = await supabase
            .from('noticias')
            .select('*')
            .order('creado_el', { ascending: false });

        if (error) throw error;

        contenedor.innerHTML = '';

        if (!noticias || noticias.length === 0) {
            contenedor.innerHTML = '<p style="color:#666; font-size:0.9rem; text-align:center; padding:10px;">No hay reportes oficiales de emergencia en este momento.</p>';
            return;
        }

        noticias.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card-noticia';
            
            // Formatear la fecha guardada en UTC a un formato legible por humanos
            const fechaLegible = new Date(item.creado_el).toLocaleDateString('es-ES', {
                day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit'
            });

            card.innerHTML = `
                ${item.url_imagen ? `<img src="${item.url_imagen}" class="noticia-imagen" alt="Foto reporte">` : ''}
                <div class="noticia-cuerpo">
                    <h4>${item.titulo}</h4>
                    <p>${item.contenido}</p>
                    <span class="noticia-fecha">📅 Oficial: ${fechaLegible}</span>
                </div>
            `;
            contenedor.appendChild(card);
        });

    } catch (err) {
        console.error("Error al cargar la sección informativa:", err.message);
        contenedor.innerHTML = '<p style="color:red; font-size:0.85rem;">Error al sincronizar las actualizaciones de rescate.</p>';
    }
          }
  
