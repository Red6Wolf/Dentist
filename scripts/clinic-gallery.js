const galleryPhotos = document.querySelectorAll('.gallery-photo');

function closeExpandedPhoto() {
    const expandedPhoto = document.querySelector('.gallery-photo.is-expanded');

    if (!expandedPhoto) return;

    expandedPhoto.classList.remove('is-expanded');
    expandedPhoto.setAttribute('aria-expanded', 'false');
    expandedPhoto.setAttribute('aria-label', `Увеличить фото: ${expandedPhoto.querySelector('img').alt}`);
}

galleryPhotos.forEach((photo) => {
    const description = photo.querySelector('img').alt;
    photo.setAttribute('aria-label', `Увеличить фото: ${description}`);

    photo.addEventListener('click', () => {
        const wasExpanded = photo.classList.contains('is-expanded');
        closeExpandedPhoto();

        if (wasExpanded) return;

        photo.classList.add('is-expanded');
        photo.setAttribute('aria-expanded', 'true');
        photo.setAttribute('aria-label', `Свернуть фото: ${description}`);
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        photo.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'nearest' });
    });
});

document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeExpandedPhoto();
});
