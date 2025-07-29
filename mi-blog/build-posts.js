// mi-blog/build-posts.js
const fs = require('fs');
const path = require('path');

// Asegúrate de que posts.json esté en la carpeta 'data'
const posts = require('./data/posts.json');

// --- Definición de la carpeta de salida ---
const outputDir = path.join(__dirname, 'dist');
const postsOutputDir = path.join(outputDir, 'posts'); // Para los posts individuales

// Crea la carpeta 'dist' si no existe
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}
// Crea la carpeta 'dist/posts' si no existe
if (!fs.existsSync(postsOutputDir)) {
    fs.mkdirSync(postsOutputDir, { recursive: true });
}

// --- Plantilla básica para un post individual ---
const postTemplate = (post) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} - Mi Blog Estático</title>
    <meta name="description" content="${post.excerpt}">
    <link rel="stylesheet" href="../style.css"> </head>
<body>
    <header>
        <h1><a href="../index.html">Mi Blog Estático</a></h1>
        <nav><a href="../index.html">Inicio</a></nav>
    </header>

    <main class="single-post-page">
        <article class="single-post">
            <h2>${post.title}</h2>
            <p class="post-meta">Publicado el ${post.date} por ${post.author}</p>
            <div class="post-content">${post.content}</div>
            <p><a href="../index.html">Volver a los posts</a></p>
        </article>
    </main>

    <footer>
        <p>&copy; 2024 Mi Blog. Todos los derechos reservados.</p>
    </footer>
</body>
</html>
`;

// --- Plantilla para el index.html principal ---
const indexTemplate = (allPosts) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi Blog Estático - Inicio</title>
    <meta name="description" content="Bienvenido a mi blog estático generado con Node.js">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>Mi Blog Estático</h1>
        <nav><a href="index.html">Inicio</a></nav>
    </header>

    <main id="blog-posts-container">
        <h2>Últimos Artículos</h2>
        ${allPosts.map(post => `
            <article class="blog-post">
                <h3><a href="posts/${post.id}.html">${post.title}</a></h3>
                <p class="post-meta">Publicado el ${post.date} por ${post.author}</p>
                <p>${post.excerpt}</p>
                <a href="posts/${post.id}.html" class="read-more-btn">Leer más</a>
            </article>
        `).join('')}
    </main>

    <footer>
        <p>&copy; 2024 Mi Blog. Todos los derechos reservados.</p>
    </footer>
</body>
</html>
`;


// --- Generar los HTML de posts individuales ---
console.log('Iniciando generación de posts individuales...');
posts.forEach(post => {
    const filePath = path.join(postsOutputDir, `${post.id}.html`);
    const htmlContent = postTemplate(post);
    fs.writeFileSync(filePath, htmlContent);
    console.log(`- Generado: ${filePath}`);
});
console.log('Posts individuales generados con éxito.');

// --- Generar el index.html principal ---
console.log('Generando index.html...');
const indexHtmlContent = indexTemplate(posts);
fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtmlContent);
console.log(`- Generado: ${path.join(outputDir, 'index.html')}`);

// --- Copiar archivos estáticos (CSS, JS del cliente) ---
console.log('Copiando archivos estáticos...');
fs.copyFileSync(path.join(__dirname, 'style.css'), path.join(outputDir, 'style.css'));
console.log(`- Copiado: style.css`);

// Si tienes un script.js para interactividad mínima en el cliente, también cópialo
// fs.copyFileSync(path.join(__dirname, 'script.js'), path.join(outputDir, 'script.js'));
// console.log(`- Copiado: script.js`);

console.log('¡Generación completa de tu blog estático en la carpeta "dist"!');