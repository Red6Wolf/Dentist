// Общие факты (адрес, часы, команда) сохраняются; выбор меняет задачи и путь пациента.
const audienceRows = [...document.querySelectorAll('#services .service-list > .service-row')];
const featureSlides = [...document.querySelectorAll('.feature-slide')];
const adultRows = audienceRows.map(row => ({ href: row.getAttribute('href'), title: row.querySelector('h3').textContent, description: row.querySelector('p').textContent }));
const adultSlides = featureSlides.map(slide => ({ href: slide.getAttribute('href'), title: slide.querySelector('h3').textContent, description: slide.querySelector('.feature-description').textContent, image: slide.querySelector('img').getAttribute('src') }));
const adultReviews = document.querySelector('.review-quotes').innerHTML;
const adultPrices = document.querySelector('#prices tbody').innerHTML;
const childRows = [
    { title: 'Первый детский приём', description: 'Уточнить врача, возраст приёма и подготовку', href: 'pages/children-dentistry.html' },
    { title: 'Лечение молочных зубов', description: 'Кариес · Пульпит · Пломбирование', href: 'pages/children-dentistry.html?service=3751' },
    { title: 'Удаление молочного зуба', description: 'Что входит в стоимость и как подготовиться', href: 'pages/children-dentistry.html?service=4054' },
    { title: 'Профилактика и уход', description: 'Какие процедуры подходят ребёнку — обсудите с врачом', href: 'pages/dental-hygiene.html' }
];
const childSlides = [
    { ...childRows[0], image: 'assets/clinic/gallery-13.webp' },
    { ...childRows[1], image: 'assets/clinic/gallery-04.webp' },
    { ...childRows[2], image: 'assets/clinic/gallery-09.webp' },
    { title: 'Родителям перед визитом', description: 'Какие документы взять и о чём спросить при записи', href: 'pages/first-visit.html#children', image: 'assets/clinic/gallery-13.webp' }
];
const variants = [
    ['#services h2', 'Что нужно вашему ребёнку?'],
    ['#services .all-link', 'Все детские услуги', 'pages/children-dentistry.html'],
    ['#team h2', 'Команда «Апельсина»'],
    ['#team .team-intro', 'Познакомьтесь с командой клиники. Кто принимает детей вашего возраста, уточните у администратора при записи.'],
    ['#clinic .loc-copy h2', 'Познакомьтесь с клиникой до визита'],
    ['#clinic .loc-copy > p', 'Посмотрите детскую зону, кабинеты и вход. Покажите ребёнку фотографии и расскажите, куда вы собираетесь.'],
    ['#prices h2', 'Цены на детский приём'],
    ['#prices .price-intro p', 'Приём и отдельные процедуры для молочных зубов. Итоговый объём лечения определяет врач.'],
    ['#prices .price-intro a', 'Все цены для детей', 'pages/prices.html?direction=children'],
    ['#reviews h2', 'Сюда приходят всей семьёй'],
    ['#visit-intro h2', 'Родителям: что уточнить до визита'],
    ['#visit-intro > p', 'Возраст приёма, подходящий врач, документы и знакомство с клиникой. Не обязательно заранее выбирать лечение — начните с вопроса.'],
    ['#visit-intro .locbutton', 'Первый визит с ребёнком', 'pages/first-visit.html#children'],
    ['#booking h2', 'Запишите ребёнка на консультацию'],
    ['#booking [data-booking-description]', 'Назовите администратору возраст ребёнка и повод обращения. Уточните, кто сможет его принять, как проходит первый визит и сколько стоит консультация.']
].map(([selector, text, href]) => {
    const element = document.querySelector(selector);
    return { element, text, href, adultText: element.firstChild.textContent, adultHref: element.getAttribute('href') };
});

window.updateHomeAudience = audience => {
    const child = audience === 'child';
    document.body.dataset.audience = child ? 'child' : 'adult';
    for (const variant of variants) {
        variant.element.firstChild.textContent = child ? variant.text : variant.adultText;
        if (variant.href) variant.element.setAttribute('href', child ? variant.href : variant.adultHref);
    }
    audienceRows.forEach((row, index) => {
        const content = (child ? childRows : adultRows)[index];
        row.hidden = !content;
        if (!content) return;
        row.href = content.href;
        row.querySelector('h3').textContent = content.title;
        row.querySelector('p').textContent = content.description;
    });
    featureSlides.forEach((slide, index) => {
        const content = (child ? childSlides : adultSlides)[index];
        slide.href = content.href;
        slide.querySelector('h3').textContent = content.title;
        slide.querySelector('.feature-description').textContent = content.description;
        slide.querySelector('img').src = content.image;
        slide.querySelector('.feature-open').firstChild.textContent = 'Подробнее ';
    });
    document.querySelector('[data-parent-guide]').hidden = !child;
    const additional = document.querySelector('#services details');
    if (additional) {
        additional.hidden = child;
        additional.open = false;
    }
    document.querySelector('#team .team-specialties').hidden = child;
    document.querySelector('#prices tbody').innerHTML = child
        ? document.querySelector('#child-price-preview').content.querySelector('tbody').innerHTML
        : adultPrices;
    document.querySelector('.review-quotes').innerHTML = child
        ? document.querySelector('#child-review-quotes').innerHTML
        : adultReviews;
    document.dispatchEvent(new Event('clinic-audience-change'));
};
