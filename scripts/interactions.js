// Текстовые ссылки получают обратную связь; фирменная подпись остаётся статичной.
function markTextLinks(root) {
    const links = root.matches?.('a') ? [root] : [...(root.querySelectorAll?.('a') || [])];
    for (const link of links) {
        if (link.classList.contains('brand') || link.closest('.brand')) continue;
        if (getComputedStyle(link).textDecorationLine.includes('underline')) link.classList.add('text-action');
    }
}
markTextLinks(document);
new MutationObserver(records => {
    for (const record of records) {
        for (const node of record.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) markTextLinks(node);
        }
    }
}).observe(document.body, { childList: true, subtree: true });

// Нативные details сохраняют клавиатурное поведение; указатель раскрывает содержимое за 200 мс.
const disclosureMotion = new WeakMap();
const gentleMotion = matchMedia('(prefers-reduced-motion: reduce)');
document.addEventListener('click', event => {
    if (event.defaultPrevented) return;
    const summary = event.target.closest('summary');
    if (!summary || event.target.closest('a, button, input')) return;
    const details = summary.parentElement;
    if (!details.matches('details')) return;
    const previous = disclosureMotion.get(details);
    const targetOpen = !(previous?.targetOpen ?? details.open);
    if (event.detail === 0 || gentleMotion.matches) {
        if (previous?.animation) {
            event.preventDefault();
            previous.animation.cancel();
            details.style.height = '';
            details.style.overflow = '';
            details.open = targetOpen;
            disclosureMotion.delete(details);
        }
        return;
    }
    event.preventDefault();
    const startHeight = details.getBoundingClientRect().height;
    previous?.animation?.cancel();
    details.style.height = '';
    details.style.overflow = '';
    details.open = targetOpen;
    const endHeight = details.getBoundingClientRect().height;
    details.open = true;
    details.style.overflow = 'hidden';
    details.style.height = startHeight + 'px';
    const state = { targetOpen, animation: null };
    disclosureMotion.set(details, state);
    state.animation = details.animate(
        [{ height: startHeight + 'px' }, { height: endHeight + 'px' }],
        { duration: 200, easing: 'cubic-bezier(.23, 1, .32, 1)', fill: 'both' }
    );
    state.animation.onfinish = () => {
        if (disclosureMotion.get(details) !== state) return;
        details.open = targetOpen;
        details.style.height = '';
        details.style.overflow = '';
        state.animation.cancel();
        disclosureMotion.delete(details);
    };
});
