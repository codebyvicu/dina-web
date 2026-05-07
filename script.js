    // -----------------------------------------
    // CÓDIGO DEL CARRUSEL DE IMÁGENES
    // -----------------------------------------
    let imagenesGaleria = [];
    let indiceActual = 0;

    function abrirGaleria(listaImagenes, descripcion) {
        imagenesGaleria = listaImagenes;
        indiceActual = 0;
        
        document.getElementById('modal-imagen').style.display = 'flex';
        document.getElementById('img-ampliada').src = imagenesGaleria[indiceActual];
        document.getElementById('descripcion-modal').innerText = descripcion;
        
        let flechas = document.querySelectorAll('.flecha');
        if(imagenesGaleria.length > 1) {
            flechas.forEach(f => f.style.display = 'block');
        } else {
            flechas.forEach(f => f.style.display = 'none');
        }
    }

    function cambiarImagen(direccion, evento) {
        evento.stopPropagation(); 
        indiceActual = indiceActual + direccion;
        
        if (indiceActual >= imagenesGaleria.length) {
            indiceActual = 0;
        }
        if (indiceActual < 0) {
            indiceActual = imagenesGaleria.length - 1;
        }
        document.getElementById('img-ampliada').src = imagenesGaleria[indiceActual];
    }

    function cerrarModal(evento) {
        if(evento.target.id === 'modal-imagen' || evento.target.className === 'cerrar') {
            document.getElementById('modal-imagen').style.display = 'none';
        }
    }

    // -----------------------------------------
    // MAGIA DEL FILTRO POR ETIQUETAS
    // -----------------------------------------
    function filtrarCategoria(categoriaElegida) {
        // Agarramos todos los productos de la grilla
        let productos = document.querySelectorAll('.producto');
        let titulo = document.getElementById('titulo-coleccion');
        let mensajeCintos = document.getElementById('mensaje-cintos');

        // 1. Cambiamos el título según lo que eligió la clienta
        if(categoriaElegida === 'todas') {
            titulo.innerText = 'Nuestros Favoritos';
            mensajeCintos.style.display = 'none';
        } else if(categoriaElegida === 'totebags') {
            titulo.innerText = 'Bolsos, Totebags & Shoulderbags';
            mensajeCintos.style.display = 'none';
        } else if(categoriaElegida === 'minibags') {
            titulo.innerText = 'Minibags';
            mensajeCintos.style.display = 'none';
        } else if(categoriaElegida === 'cintos') {
            titulo.innerText = 'Cintos';
            mensajeCintos.style.display = 'block';
        }

        // 2. Escondemos o mostramos cada producto
        productos.forEach(prod => {
            // Si eligió "Ver Todo" o si la etiqueta del producto coincide con el menú
            if (categoriaElegida === 'todas' || prod.getAttribute('data-categoria') === categoriaElegida) {
                prod.style.display = 'flex'; // Lo mostramos
            } else {
                prod.style.display = 'none'; // Lo escondemos
            }
        });

        // Hacemos scroll suave hasta la colección para que la clienta vea el filtro aplicado
        document.getElementById('coleccion').scrollIntoView({ behavior: 'smooth' });

        // Sincroniza el desplegable para que muestre lo correcto
        let selector = document.getElementById('selector-filtro');
        if (selector) {
            selector.value = categoriaElegida;
        }
    }

    let carrito = JSON.parse(localStorage.getItem('carritoDina')) || [];

// Abre o cierra el panel derecho
function toggleCarrito() {
    document.getElementById('carrito-lateral').classList.toggle('abierto');
}

// Actualiza los números y la lista visual
function renderizarCarrito() {
    let contenedor = document.getElementById('items-carrito');
    let totalSpan = document.getElementById('total-carrito');
    let contadorSpan = document.getElementById('contador-carrito');
    
    let total = 0;
    let cantidadTotal = 0;
    contenedor.innerHTML = ""; // Limpiamos antes de dibujar

    if (carrito.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center; color: #888;">Tu carrito está vacío.</p>';
        totalSpan.innerText = "0";
        contadorSpan.innerText = "0";
        return;
    }

    // Dibujamos cada item
    carrito.forEach((prod, index) => {
        let subtotal = prod.precio * prod.cantidad;
        total += subtotal;
        cantidadTotal += prod.cantidad;
        
        contenedor.innerHTML += `
            <div class="item-carrito">
                <div>
                    <strong>${prod.nombre}</strong><br>
                    <small>${prod.cantidad} x $${prod.precio}</small>
                </div>
                <div style="text-align: right;">
                    <strong>$${subtotal}</strong><br>
                    <button onclick="eliminarDelCarrito(${index})" style="background:none; border:none; color:#cc0000; cursor:pointer; font-size: 0.8em;">Eliminar</button>
                </div>
            </div>
        `;
    });

    totalSpan.innerText = total;
    contadorSpan.innerText = cantidadTotal;
}

// La función para agregar productos desde el catálogo
// Agregamos el parámetro stockDisponible a la función
function agregarAlCarrito(nombre, precio, stockDisponible) {
    // Buscamos si el producto ya está en el carrito
    let productoExistente = carrito.find(item => item.nombre === nombre);
    
    if (productoExistente) {
        // Validamos el stock antes de sumar
        if (productoExistente.cantidad >= stockDisponible) {
            mostrarAviso(`Sólo nos quedan ${stockDisponible} unidades de ${nombre} en stock.`);
            return; // Cortamos la ejecución acá, no se agrega nada al carrito
        }
        productoExistente.cantidad++;
    } else {
        // Validamos que haya stock mayor a cero antes de agregarlo por primera vez
        if (stockDisponible > 0) {
            carrito.push({ nombre: nombre, precio: precio, cantidad: 1, stockMaximo: stockDisponible });
        } else {
            mostrarAviso(`¡Ups! Este modelo está sin stock por el momento.`);
            return;
        }
    }
    
    // Si pasó las validaciones, guardamos y actualizamos la vista
    localStorage.setItem('carritoDina', JSON.stringify(carrito));
    renderizarCarrito(); 
    
    // Hacemos que el botón pegue un saltito (el efecto que agregamos antes)
    let btnFlotante = document.getElementById('btn-carrito-flotante');
    btnFlotante.classList.add('animar-carrito');
    setTimeout(() => {
        btnFlotante.classList.remove('animar-carrito');
    }, 300);
}


// Función para sacar cosas de la bolsa de a una unidad
function eliminarDelCarrito(indice) {
    // Si hay más de un artículo de este modelo, restamos 1
    if (carrito[indice].cantidad > 1) {
        carrito[indice].cantidad--;
    } else {
        // Si solo queda 1, eliminamos todo el producto del arreglo
        carrito.splice(indice, 1);
    }
    
    // Guardamos los cambios en el navegador y actualizamos la vista
    localStorage.setItem('carritoDina', JSON.stringify(carrito));
    renderizarCarrito();
}

// Cuando carga la página, dibujamos lo que ya haya guardado
window.addEventListener('DOMContentLoaded', () => {
    renderizarCarrito();
    revisarBotonCarrito();
});

function mostrarAviso(mensaje) {
    let toast = document.getElementById('toast-aviso');
    toast.innerText = mensaje;
    toast.classList.add('mostrar'); // Lo hace aparecer

    // Lo ocultamos a los 3 segundos (3000 milisegundos)
    setTimeout(() => {
        toast.classList.remove('mostrar');
    }, 3000);
}

// --- LÓGICA PARA MOSTRAR/OCULTAR EL BOTÓN DEL CARRITO ---
function revisarBotonCarrito() {
    let botonCarrito = document.getElementById('btn-carrito-flotante');
    let seccionColeccion = document.getElementById('coleccion');
    let modalImagen = document.getElementById('modal-imagen');

    if (!botonCarrito || !seccionColeccion || !modalImagen) return;

    // Verificamos si la galería de fotos está abierta
    let modalAbierto = modalImagen.style.display === 'flex';
    
    // Calculamos para que aparezca unos 300px antes de llegar a los productos
    let limiteMostrar = seccionColeccion.offsetTop - 300; 

    // Si ya scrolleamos hasta la grilla Y el modal está cerrado, lo mostramos
    if (window.scrollY > limiteMostrar && !modalAbierto) {
        botonCarrito.classList.add('mostrar');
    } else {
        botonCarrito.classList.remove('mostrar');
    }
}

// Le decimos al navegador que revise cada vez que scrolleamos
window.addEventListener('scroll', revisarBotonCarrito);