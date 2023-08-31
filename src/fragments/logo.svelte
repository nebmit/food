<script lang="ts">
    import { cubicIn } from "svelte/easing";
    import { draw, fade } from "svelte/transition";
    import { variableTransition } from "../transitions";

    export let width = "400";
    export let stroke = "#fff";
    export let color = "#00d5ff";

    export let outTransition: { [key: string]: any; fn: Function } = {
        fn: fade,
    };

    function mirrored({
        x1,
        y1,
        x2,
        y2,
        color,
        in: inTransition,
    }: (typeof lines)[0]) {
        return [
            { x1, y1, x2, y2, in: inTransition, color },
            { x1: x2, y1: y2, x2: x1, y2: y1, in: inTransition, color },
        ];
    }

    const lines: Array<{
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        in?: { fn: Function; [key: string]: any };
        out?: { fn: Function; [key: string]: any };
        color?: string;
    }> = [
        // Left Top
        ...mirrored({
            x1: 292.5,
            y1: 112.5,
            x2: 100,
            y2: 200,
            color,
            in: {
                fn: draw,
                duration: 750,
                delay: 1250,
            },
        }),
        // Left Bottom
        {
            x1: 360,
            y1: 400,
            x2: 100,
            y2: 245,
            in: {
                fn: draw,
                duration: 750,
                delay: 750,
            },
        },
        // Middle
        {
            x1: 395,
            y1: 380,
            x2: 340,
            y2: 135,
            in: {
                fn: draw,
                duration: 750,
                delay: 750,
            },
        },
        // Right Top
        {
            x2: 440,
            y2: 405,
            x1: 625,
            y1: 340,
            in: {
                fn: draw,
                duration: 750,
                delay: 400,
            },
        },
        // Right Middle
        {
            x1: 605,
            y1: 485,
            x2: 655,
            y2: 370,
            color,
            in: {
                fn: draw,
                duration: 750,
                delay: 0,
            },
        },
        // Right Bottom
        {
            x2: 440,
            y2: 440,
            x1: 555,
            y1: 505,
            in: {
                fn: draw,
                duration: 750,
                delay: 400,
            },
        },
    ];

    const ellipses: Array<{
        cx: number;
        cy: number;
        in?: { fn: Function; [key: string]: any };
        out?: { fn: Function; [key: string]: any };
        color?: string;
    }> = [
        {
            cx: 330,
            cy: 100,
            in: { fn: fade, duration: 500, delay: 750, easing: cubicIn },
        },
        {
            cx: 65,
            cy: 220,
            in: { fn: fade, duration: 500, delay: 500, easing: cubicIn },
        },
        {
            cx: 400,
            cy: 420,
            in: { fn: fade, duration: 500, delay: 250, easing: cubicIn },
        },
        {
            cx: 670,
            cy: 330,
            in: { fn: fade, duration: 500, easing: cubicIn },
        },
        {
            cx: 590,
            cy: 520,
            color,
            in: { fn: fade, duration: 0 },
        },
    ];
</script>

<svg
    {width}
    viewBox="0 0 700 600"
    xmlns="http://www.w3.org/2000/svg"
    out:variableTransition={outTransition}
>
    <g>
        {#each lines as line}
            <line
                stroke={line.color !== undefined ? line.color : stroke}
                in:variableTransition={line.in}
                out:variableTransition={line.out}
                y1={line.y1}
                x1={line.x1}
                y2={line.y2}
                x2={line.x2}
                stroke-linecap="round"
                stroke-width="26"
            />
        {/each}

        {#each ellipses as ellipse}
            <ellipse
                stroke={ellipse.color ?? stroke}
                in:variableTransition={ellipse.in}
                out:variableTransition={ellipse.out}
                cy={ellipse.cy}
                cx={ellipse.cx}
                ry="7"
                rx="7"
                stroke-width="14"
            />
        {/each}
    </g>
</svg>
