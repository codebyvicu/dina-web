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
                prod.style.display = 'block'; // Lo mostramos
            } else {
                prod.style.display = 'none'; // Lo escondemos
            }
        });

        // Hacemos scroll suave hasta la colección para que la clienta vea el filtro aplicado
        document.getElementById('coleccion').scrollIntoView({ behavior: 'smooth' });
    }