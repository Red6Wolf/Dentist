const galleryPhotos = [...document.querySelectorAll(".gallery-photo")];

if (galleryPhotos.length > 0 && typeof HTMLDialogElement !== "undefined") {
    const viewer = document.createElement("dialog");
    viewer.className = "gallery-viewer";
    viewer.setAttribute("aria-label", "Фотографии клиники");
    viewer.innerHTML = `
        <button class="gallery-viewer__close" type="button" aria-label="Закрыть фотографию" autofocus>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>
        <div class="gallery-viewer__stage">
            <img alt="" hidden />
            <p class="gallery-viewer__status" role="status"></p>
        </div>
        <div class="gallery-viewer__controls">
            <button type="button" data-gallery-prev aria-label="Предыдущая фотография">
                <span class="gallery-viewer__chevron" aria-hidden="true"></span>
            </button>
            <p class="gallery-viewer__caption" aria-live="polite"></p>
            <button type="button" data-gallery-next aria-label="Следующая фотография">
                <span class="gallery-viewer__chevron" aria-hidden="true"></span>
            </button>
        </div>
    `;
    document.body.append(viewer);

    const image = viewer.querySelector("img");
    const status = viewer.querySelector(".gallery-viewer__status");
    const caption = viewer.querySelector(".gallery-viewer__caption");
    const previousButton = viewer.querySelector("[data-gallery-prev]");
    const nextButton = viewer.querySelector("[data-gallery-next]");
    const closeButton = viewer.querySelector(".gallery-viewer__close");
    let opener = null;
    let activeIndex = 0;
    let activeRequest = 0;

    async function showPhoto(index) {
        activeIndex = (index + galleryPhotos.length) % galleryPhotos.length;
        const photo = galleryPhotos[activeIndex];
        const thumbnail = photo.querySelector("img");
        const request = ++activeRequest;
        image.hidden = true;
        status.textContent = "Загружаем фотографию…";
        caption.textContent = (activeIndex + 1) + " / " + galleryPhotos.length + " · " + thumbnail.alt;
        image.alt = thumbnail.alt;
        image.src = photo.href;

        try {
            await image.decode();
            if (request !== activeRequest) return;
            image.hidden = false;
            status.textContent = "";
        } catch {
            if (request !== activeRequest) return;
            status.textContent = "Фотография не загрузилась. Можно открыть соседний снимок.";
        }
    }

    galleryPhotos.forEach((photo, index) => {
        const thumbnail = photo.querySelector("img");
        photo.setAttribute("aria-label", "Увеличить фото: " + thumbnail.alt);
        photo.addEventListener("click", (event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            opener = photo;
            viewer.classList.toggle("gallery-viewer--pointer", event.detail > 0);
            viewer.showModal();
            showPhoto(index);
        });
    });

    previousButton.addEventListener("click", () => showPhoto(activeIndex - 1));
    nextButton.addEventListener("click", () => showPhoto(activeIndex + 1));
    closeButton.addEventListener("click", () => viewer.close());
    viewer.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            showPhoto(activeIndex + (event.key === "ArrowLeft" ? -1 : 1));
        }
    });
    viewer.addEventListener("click", (event) => {
        if (event.target === viewer) viewer.close();
    });
    viewer.addEventListener("close", () => {
        if (!viewer.open) opener?.focus({ preventScroll: true });
    });
}
