// Фотография открывается поверх галереи, не перестраивая её сетку.
const galleryPhotos = document.querySelectorAll(".gallery-photo");

if (galleryPhotos.length > 0 && typeof HTMLDialogElement !== "undefined") {
    const viewer = document.createElement("dialog");
    viewer.className = "gallery-viewer";
    viewer.setAttribute("aria-label", "Просмотр фотографии клиники");
    viewer.innerHTML = `
        <button class="gallery-viewer__close" type="button" aria-label="Закрыть фотографию">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>
        <img alt="" />
    `;
    document.body.append(viewer);

    const largeImage = viewer.querySelector("img");
    let activePhoto = null;

    galleryPhotos.forEach((photo) => {
        const image = photo.querySelector("img");
        photo.setAttribute("aria-label", `Увеличить фото: ${image.alt}`);

        photo.addEventListener("click", () => {
            activePhoto = photo;
            largeImage.src = image.src;
            largeImage.alt = image.alt;
            viewer.showModal();
        });
    });

    viewer.querySelector(".gallery-viewer__close").addEventListener("click", () => viewer.close());
    viewer.addEventListener("click", (event) => {
        if (event.target === viewer) viewer.close();
    });
    viewer.addEventListener("close", () => activePhoto?.focus());
}
