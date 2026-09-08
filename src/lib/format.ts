import type { StageIngredientInput } from './types';

/** Scales a quantity and prints it with at most one decimal. */
export function formatQuantity(quantity: number, factor = 1): string {
    const scaled = Math.round(quantity * factor * 10) / 10;
    return scaled % 1 === 0 ? scaled.toFixed(0) : scaled.toFixed(1);
}

const PLURALS: Record<string, string> = {
    clove: 'cloves',
    pinch: 'pinches',
    can: 'cans',
    bunch: 'bunches',
    slice: 'slices',
    packet: 'packets',
    leaf: 'leaves',
    teaspoon: 'teaspoons',
    tablespoon: 'tablespoons',
};

/** `150 g`, `30 ml`, `3 ×`, `2 cloves`, `1 pinch`. */
export function formatMeasure(quantity: number, measurement: string, factor = 1): string {
    const amount = formatQuantity(quantity, factor);
    switch (measurement) {
    case 'grams':
        return `${amount} g`;
    case 'ml':
        return `${amount} ml`;
    case 'unit':
        return `${amount} ×`;
    default: {
        const singular = amount === '1';
        return `${amount} ${singular ? measurement : (PLURALS[measurement] ?? measurement)}`;
    }
    }
}

/** The amount slot of an ingredient cell; qualitative inputs show their hint instead. */
export function formatAmount(input: StageIngredientInput, factor = 1): string {
    if (input.Quantity === undefined || input.Measurement === undefined) {
        return input.Hint ?? '';
    }
    return formatMeasure(input.Quantity, input.Measurement, factor);
}

/** `◼◼◻◻◻` for a 1–5 rating. */
export function rating(value: number, total = 5): string {
    const filled = Math.max(0, Math.min(total, Math.round(value)));
    return '◼'.repeat(filled) + '◻'.repeat(total - filled);
}

/** `30 min`, `1 h`, `1 h 30 min`. */
export function formatTime(minutes: number): string {
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const rest = minutes % 60;
        return rest ? `${hours} h ${rest} min` : `${hours} h`;
    }
    return `${minutes} min`;
}

/** `30 min active · 4 h passive` (passive omitted when zero). */
export function formatTimes(version: { ActiveTimeMinutes: number; PassiveTimeMinutes: number }): string {
    const parts = [`${formatTime(version.ActiveTimeMinutes)} active`];
    if (version.PassiveTimeMinutes > 0) {
        parts.push(`${formatTime(version.PassiveTimeMinutes)} passive`);
    }
    return parts.join(' · ');
}

/** `01`, `12`. */
export function padStep(step: number): string {
    return String(step).padStart(2, '0');
}
