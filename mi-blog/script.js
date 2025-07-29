document.addEventListener('DOMContentLoaded', () => {
    const blogPostsContainer = document.getElementById('blog-posts-container');
    const homeLink = document.getElementById('home-link');

    // Función para cargar y mostrar los posts
    async function loadPosts() {
        blogPostsContainer.innerHTML = '<h2>Cargando posts...</h2>'; // Mensaje de carga

        try {
            const response = await fetch('data/posts.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const posts = await response.json();
            displayPosts(posts);
        } catch (error) {
            console.error('Error al cargar los posts:', error);
            blogPostsContainer.innerHTML = '<p>Lo sentimos, no pudimos cargar los posts en este momento.</p>';
        }
    }

    // Función para mostrar los posts en el HTML
    function displayPosts(posts) {
        blogPostsContainer.innerHTML = ''; // Limpiar el contenedor
        posts.forEach(post => {
            const postElement = document.createElement('article');
            postElement.classList.add('blog-post');
            postElement.innerHTML = `
                <h3>${post.title}</h3>
                <p class="post-meta">Publicado el ${post.date} por ${post.author}</p>
                <p>${post.excerpt}</p>
                <button class="read-more-btn" data-post-id="${post.id}">Leer más</button>
            `;
            blogPostsContainer.appendChild(postElement);
        });

        // Añadir event listeners a los botones "Leer más"
        document.querySelectorAll('.read-more-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const postId = event.target.dataset.postId;
                showSinglePost(postId, posts);
            });
        });
    }

    // Función para mostrar un post individual
    function showSinglePost(postId, allPosts) {
        const post = allPosts.find(p => p.id === postId);
        if (post) {
            blogPostsContainer.innerHTML = `
                <article class="single-post">
                    <h2>${post.title}</h2>
                    <p class="post-meta">Publicado el ${post.date} por ${post.author}</p>
                    <div class="post-content">${post.content}</div>
                    <button id="back-to-home-btn">Volver a los posts</button>
                </article>
            `;
            document.getElementById('back-to-home-btn').addEventListener('click', loadPosts);
        } else {
            blogPostsContainer.innerHTML = '<p>Post no encontrado.</p>';
        }
    }

    // Evento para el enlace "Inicio"
    homeLink.addEventListener('click', (event) => {
        event.preventDefault(); // Evitar el comportamiento predeterminado del enlace
        loadPosts();
    });

    // Cargar los posts al inicio
    loadPosts();
});