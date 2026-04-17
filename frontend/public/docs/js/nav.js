// Toggle sidebar en mobile
function toggleNav() {
    const nav = document.getElementById('docsNav');
    if (nav) {
        nav.classList.toggle('open');
    }
}

// Cerrar sidebar al hacer click en un link (mobile)
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.docs-nav-sidebar a').forEach(link => {
        link.addEventListener('click', () => {
            const nav = document.getElementById('docsNav');
            if (nav) {
                nav.classList.remove('open');
            }
        });
    });

    // Marcar link activo según la página actual
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.docs-nav-sidebar a').forEach(link => {
        const href = link.getAttribute('href').split('/').pop();
        if ((currentPage === 'docs' && href === 'index.html') ||
            currentPage === href) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});
