import { cubicOut } from "svelte/easing";

function random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export function variableTransition(
    node: any,
    options: { fn: Function;[key: string]: any } | undefined
) {
    if (options === undefined) return;
    return options.fn(node, options);
}

export function glitch(
    node: any,
    {
        duration = 1000,
        delay = 0,
        easing = cubicOut,
        displacement = 50,
        frequency = 1,
    }
): {
    delay: number;
    duration: number;
    tick: (t: number, u: number) => void;
} {
    const initialOpacity = parseFloat(
        window.getComputedStyle(node).opacity
    );
    const glitches = duration / 100;

    const reset = () => {
        node.style.filter = "";
        node.style.transform = "";
        node.style.opacity = "" + initialOpacity;
    };

    return {
        delay,
        duration,
        tick: (t: number, u: number) => {
            if (t === 1) {
                reset();
                return;
            }
            const glitchCount = Math.floor(t * glitches);
            const glitchStrength = easing(u);
            if (Math.random() > frequency) {
                reset();
                return;
            }
            if (glitchCount % 3 === 0) {
                const dx = random(
                    -glitchStrength * displacement,
                    glitchStrength * displacement
                );
                const dy = random(
                    -glitchStrength * displacement,
                    glitchStrength * displacement
                );
                let color = ["#ff00a2", "#00d5ff", "#ff00a2", "#00d5ff"][
                    Math.floor(Math.random() * 4)
                ];
                node.style.filter = `drop-shadow(0 0 0.25rem ${color})`;
                node.style.transform += `translate(${dx}px, ${dy}px)`;
            }
            if (glitchCount % 2 === 0) {
                node.style.opacity =
                    "" + initialOpacity * (1 - glitchStrength);
            }
            if (glitchCount % 2 !== 0 && glitchCount % 3 !== 0) {
                reset();
            }
        },
    };
}
