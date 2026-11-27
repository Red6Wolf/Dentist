// Совместимость со старыми закладками без второго набора страниц прайса.
const destination = document.body.dataset.priceDestination;
if (destination) {
    const target = new URL(destination, location.href);
    const source = new URL(location.href);
    for (const key of ["q", "service"]) {
        if (source.searchParams.has(key)) target.searchParams.set(key, source.searchParams.get(key));
    }
    target.hash = source.hash || "prices";
    location.replace(target);
}
