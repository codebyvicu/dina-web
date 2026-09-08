// -----------------------------------------
// CONEXIÓN A SUPABASE
// -----------------------------------------
const SUPABASE_URL = 'https://szwkpgkwepgllamsbvjb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KN45RAB60JtrT0wZiH7iVQ_PD5XJ8CJ';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BUCKET = 'productos-dina';

let editandoId = null;       // null = alta nueva, si no = id del producto en edición
let imagenesActuales = [];   // urls de imágenes ya subidas (para el producto en edición)
let todosLosProductos = [];  // cache local para stats, búsqueda y filtro

// -----------------------------------------
// LOGIN / SESIÓN
// -----------------------------------------
const cajaLogin = document.getElementById('caja-login');
const shell = document.getElementById('shell');

async function chequearSesion() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        cajaLogin.style.display = 'none';
        shell.classList.add('activo');
        cargarListaProductos();
    } else {
        cajaLogin.style.display = 'block';
        shell.classList.remove('activo');
    }
}

document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const mensajeLogin = document.getElementById('mensaje-login');

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        mensajeLogin.innerText = 'Email o contraseña incorrectos.';
        return;
    }
    mensajeLogin.innerText = '';
    chequearSesion();
});

document.getElementById('btn-logout').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    chequearSesion();
});

chequearSesion();

// -----------------------------------------
// NAVEGACIÓN ENTRE VISTAS
// -----------------------------------------
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('activo'));
        btn.classList.add('activo');
        const vista = btn.getAttribute('data-vista');
        document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
        document.getElementById(`vista-${vista}`).classList.add('activa');
    });
});

// -----------------------------------------
// LISTAR PRODUCTOS + ESTADÍSTICAS
// -----------------------------------------
async function cargarListaProductos() {
    const contenedor = document.getElementById('lista-productos');
    const { data, error } = await supabaseClient
        .from('productos')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        contenedor.innerText = 'Error al cargar los productos.';
        console.error(error);
        return;
    }

    todosLosProductos = data || [];
    actualizarEstadisticas();
    renderizarListaFiltrada();
}

function actualizarEstadisticas() {
    const total = todosLosProductos.length;
    const enStock = todosLosProductos.filter(p => Number(p.stock) > 0).length;
    const sinStock = total - enStock;
    const valorInventario = todosLosProductos.reduce((acc, p) => acc + (Number(p.precio) || 0) * (Number(p.stock) || 0), 0);

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-en-stock').innerText = enStock;
    document.getElementById('stat-sin-stock').innerText = sinStock;
    document.getElementById('stat-valor').innerText = `$${valorInventario.toLocaleString('es-AR')}`;
}

function renderizarListaFiltrada() {
    const contenedor = document.getElementById('lista-productos');
    const busqueda = document.getElementById('buscador-inventario').value.trim().toLowerCase();
    const categoriaFiltro = document.getElementById('filtro-categoria-inventario').value;
    const estadoFiltro = document.getElementById('filtro-estado-inventario').value;

    const filtrados = todosLosProductos.filter(p => {
        const coincideNombre = !busqueda || (p.nombre || '').toLowerCase().includes(busqueda) || (p.variante || '').toLowerCase().includes(busqueda);
        const coincideCategoria = categoriaFiltro === 'todas' || (p.categorias || []).includes(categoriaFiltro);
        const stockNum = Number(p.stock) || 0;
        const coincideEstado = estadoFiltro === 'todos'
            || (estadoFiltro === 'en-stock' && stockNum > 0)
            || (estadoFiltro === 'sin-stock' && stockNum === 0);
        return coincideNombre && coincideCategoria && coincideEstado;
    });

    if (filtrados.length === 0) {
        contenedor.innerHTML = '<p style="color:#776b62;">No hay productos que coincidan.</p>';
        return;
    }

    contenedor.innerHTML = '';
    filtrados.forEach(p => {
        const fila = document.createElement('div');
        fila.className = 'fila-producto-admin';

        const img = document.createElement('img');
        img.src = (p.imagenes && p.imagenes[0]) || '';
        fila.appendChild(img);

        const info = document.createElement('div');
        info.className = 'info';
        const stockNum = Number(p.stock) || 0;
        info.innerHTML = `
            <div class="nombre">${p.nombre}${p.variante ? ' · ' + p.variante : ''}</div>
            <div class="detalle">$${Number(p.precio).toLocaleString('es-AR')} · ${(p.categorias || []).join(', ') || 'sin categoría'}</div>
        `;
        fila.appendChild(info);

        const etiqueta = document.createElement('span');
        etiqueta.className = `etiqueta-stock ${stockNum > 0 ? 'si' : 'no'}`;
        etiqueta.innerText = stockNum > 0 ? `Stock: ${stockNum}` : 'Sin stock';
        fila.appendChild(etiqueta);

        const acciones = document.createElement('div');
        acciones.className = 'acciones';

        const btnEditar = document.createElement('button');
        btnEditar.innerText = 'Editar';
        btnEditar.addEventListener('click', () => cargarProductoEnFormulario(p));
        acciones.appendChild(btnEditar);

        const btnEliminar = document.createElement('button');
        btnEliminar.innerText = 'Eliminar';
        btnEliminar.className = 'btn-eliminar';
        btnEliminar.addEventListener('click', () => eliminarProducto(p.id));
        acciones.appendChild(btnEliminar);

        fila.appendChild(acciones);
        contenedor.appendChild(fila);
    });
}

document.getElementById('buscador-inventario').addEventListener('input', renderizarListaFiltrada);
document.getElementById('filtro-categoria-inventario').addEventListener('change', renderizarListaFiltrada);
document.getElementById('filtro-estado-inventario').addEventListener('change', renderizarListaFiltrada);

async function eliminarProducto(id) {
    if (!confirm('¿Seguro que querés eliminar este producto? No se puede deshacer.')) return;
    const { error } = await supabaseClient.from('productos').delete().eq('id', id);
    if (error) {
        alert('Error al eliminar. Mirá la consola.');
        console.error(error);
        return;
    }
    cargarListaProductos();
}

// -----------------------------------------
// FORMULARIO: ALTA Y EDICIÓN
// -----------------------------------------
const form = document.getElementById('form-producto');
const tituloForm = document.getElementById('titulo-form');
const btnGuardar = document.getElementById('btn-guardar');
const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');
const contenedorImagenesActuales = document.getElementById('imagenes-actuales');

function irAVistaCargar() {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('activo'));
    document.querySelector('.nav-item[data-vista="cargar"]').classList.add('activo');
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
    document.getElementById('vista-cargar').classList.add('activa');
}

function cargarProductoEnFormulario(p) {
    editandoId = p.id;
    imagenesActuales = [...(p.imagenes || [])];

    document.getElementById('nombre').value = p.nombre || '';
    document.getElementById('variante').value = p.variante || '';
    document.getElementById('precio').value = p.precio || '';
    document.getElementById('stock').value = p.stock || 0;
    document.getElementById('descripcion').value = p.descripcion_galeria || '';
    document.getElementById('medidas').value = p.medidas || '';
    document.getElementById('destacado').value = p.destacado || '';

    const categorias = p.categorias || [];
    document.querySelectorAll('.fila-categorias input[type="checkbox"]').forEach(chk => {
        chk.checked = categorias.includes(chk.value);
    });

    renderizarImagenesActuales();

    tituloForm.innerText = `Editando: ${p.nombre}`;
    btnGuardar.innerText = 'Actualizar producto';
    btnCancelarEdicion.style.display = 'inline-block';
    irAVistaCargar();
    window.scrollTo(0, 0);
}

function renderizarImagenesActuales() {
    contenedorImagenesActuales.innerHTML = '';
    imagenesActuales.forEach((url, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'imagen-actual';

        const img = document.createElement('img');
        img.src = url;
        wrapper.appendChild(img);

        const btnBorrar = document.createElement('span');
        btnBorrar.className = 'btn-borrar-img';
        btnBorrar.innerText = '×';
        btnBorrar.addEventListener('click', () => {
            imagenesActuales.splice(index, 1);
            renderizarImagenesActuales();
        });
        wrapper.appendChild(btnBorrar);

        contenedorImagenesActuales.appendChild(wrapper);
    });
}

function resetearFormulario() {
    editandoId = null;
    imagenesActuales = [];
    form.reset();
    contenedorImagenesActuales.innerHTML = '';
    tituloForm.innerText = 'Subir Nuevo Producto';
    btnGuardar.innerText = 'Guardar en la tienda';
    btnCancelarEdicion.style.display = 'none';
}

btnCancelarEdicion.addEventListener('click', resetearFormulario);

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mensaje = document.getElementById('mensaje');
    mensaje.className = '';
    mensaje.innerText = '';
    btnGuardar.innerText = 'Guardando...';
    btnGuardar.disabled = true;

    try {
        const categorias = Array.from(document.querySelectorAll('.fila-categorias input[type="checkbox"]:checked')).map(chk => chk.value);

        // Subir las fotos nuevas seleccionadas (si hay)
        const archivos = document.getElementById('foto').files;
        const urlsNuevas = [];
        for (const archivo of archivos) {
            const nombreArchivo = `${Date.now()}-${archivo.name}`;
            const { error: errorSubida } = await supabaseClient.storage
                .from(BUCKET)
                .upload(nombreArchivo, archivo);

            if (errorSubida) throw errorSubida;

            const { data: urlPublica } = supabaseClient.storage.from(BUCKET).getPublicUrl(nombreArchivo);
            urlsNuevas.push(urlPublica.publicUrl);
        }

        const todasLasImagenes = [...imagenesActuales, ...urlsNuevas];

        if (!editandoId && todasLasImagenes.length === 0) {
            alert('Elegí al menos una foto para el producto.');
            btnGuardar.innerText = editandoId ? 'Actualizar producto' : 'Guardar en la tienda';
            btnGuardar.disabled = false;
            return;
        }

        const registro = {
            nombre: document.getElementById('nombre').value,
            variante: document.getElementById('variante').value || null,
            precio: Number(document.getElementById('precio').value),
            stock: Number(document.getElementById('stock').value),
            descripcion_galeria: document.getElementById('descripcion').value || null,
            medidas: document.getElementById('medidas').value || null,
            destacado: document.getElementById('destacado').value || null,
            categorias: categorias,
            imagenes: todasLasImagenes
        };

        let error;
        if (editandoId) {
            ({ error } = await supabaseClient.from('productos').update(registro).eq('id', editandoId));
        } else {
            ({ error } = await supabaseClient.from('productos').insert(registro));
        }

        if (error) throw error;

        mensaje.className = 'ok';
        mensaje.innerText = editandoId ? '¡Producto actualizado con éxito!' : '¡Producto agregado con éxito al catálogo!';
        resetearFormulario();
        cargarListaProductos();
    } catch (error) {
        console.error('Error al guardar:', error);
        mensaje.className = 'error';
        mensaje.innerText = 'Hubo un error. Revisá la consola.';
    } finally {
        btnGuardar.disabled = false;
        if (btnGuardar.innerText === 'Guardando...') {
            btnGuardar.innerText = editandoId ? 'Actualizar producto' : 'Guardar en la tienda';
        }
    }
});
