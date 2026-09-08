const PLACEHOLDER = '/images/placeholder.png';

/** Svelte action: swap a broken image for the placeholder, once. */
export function imageFallback(node: HTMLImageElement, fallback: string = PLACEHOLDER) {
    const onError = () => {
        if (node.dataset.fallback) return;
        node.dataset.fallback = '1';
        node.src = fallback;
    };
    node.addEventListener('error', onError);
    return {
        destroy() {
            node.removeEventListener('error', onError);
        }
    };
}
