import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Tus claves de Firebase (solo dejamos la de la base de datos)
const firebaseConfig = {
  apiKey: "AIzaSyBAeF1hpyEqC74_HytqD1HnLA71pSIJ750",
  authDomain: "dinacoutureweb.firebaseapp.com",
  projectId: "dinacoutureweb",
  storageBucket: "dinacoutureweb.firebasestorage.app",
  messagingSenderId: "107917581819",
  appId: "1:107917581819:web:4406f000a56b824267bf5e",
  measurementId: "G-KDTVPDF6Y1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Tus datos de Cloudinary (completalos con lo que sacaste en el Paso 1 y 2)
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dl5lyptgc/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "dinacoutureweb"; // El nombre que le pusiste en el paso 2

document.getElementById('form-producto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-guardar');
    const mensaje = document.getElementById('mensaje');
    btn.innerText = "Subiendo foto y guardando...";
    btn.disabled = true;

    try {
        // 1. Obtener la foto y prepararla para Cloudinary
        const archivo = document.getElementById('foto').files[0];
        const formData = new FormData();
        formData.append('file', archivo);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        // 2. Subir la imagen a Cloudinary usando fetch
        const respuestaCloudinary = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData
        });
        const datosCloudinary = await respuestaCloudinary.json();
        const imagenUrl = datosCloudinary.secure_url; // ¡Acá está el link público de la foto!

        // 3. Guardar todo en Firebase Firestore
        await addDoc(collection(db, "productos"), {
            nombre: document.getElementById('nombre').value,
            precio: Number(document.getElementById('precio').value),
            stock: Number(document.getElementById('stock').value),
            descripcion: document.getElementById('descripcion').value,
            categoria: document.getElementById('categoria').value,
            imagenUrl: imagenUrl // Guardamos el link que nos dio Cloudinary
        });

        mensaje.innerText = "¡Producto agregado con éxito al catálogo!";
        document.getElementById('form-producto').reset();
    } catch (error) {
        console.error("Error al subir:", error);
        mensaje.innerText = "Hubo un error. Revisá la consola.";
        mensaje.style.color = "red";
    } finally {
        btn.innerText = "Guardar en la tienda";
        btn.disabled = false;
    }
});