export function stars(
    node: HTMLElement,
    { total, filled }: { total: number; filled: number }
) {
    for (let i = 0; i < total; i++) {
        const star = document.createElement("span");
        star.textContent = i < filled ? "★" : "☆";
        node.appendChild(star);
    }
}