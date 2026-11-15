import type { RecipeSummary } from './types';

/**
 * The browse drilldown narrows one facet at a time, in this order. The design
 * wants course → dish → cuisine; the data repo carries course and cuisine, so
 * dish is the level still missing. Tags are not a level: they are matched by
 * free-text search only.
 */
export const FACETS = ['course', 'cuisine'] as const;
export type FacetKey = typeof FACETS[number];

export const OPTION_LABELS: Record<FacetKey, string> = {
    course: 'Course',
    cuisine: 'Narrow by cuisine',
};

export type FacetGroup = [label: string, count: number];

export function facetValues(summary: RecipeSummary, key: FacetKey): string[] {
    switch (key) {
    case 'course':
        return summary.Course ? [summary.Course] : [];
    case 'cuisine':
        return summary.Cuisine ? [summary.Cuisine] : [];
    }
}

/** Distinct values of a facet with counts, most frequent first, then alphabetical. */
export function groupBy(list: RecipeSummary[], key: FacetKey): FacetGroup[] {
    const counts = new Map<string, number>();
    for (const summary of list) {
        for (const value of facetValues(summary, key)) {
            counts.set(value, (counts.get(value) ?? 0) + 1);
        }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** Recipes matching every level of a facet path. */
export function applyPath(list: RecipeSummary[], path: string[]): RecipeSummary[] {
    return list.filter(summary =>
        path.every((value, level) => {
            const key = FACETS[level];
            return key !== undefined && facetValues(summary, key).includes(value);
        })
    );
}

export interface Crumb {
    label: string;
    path: string[];
}

export function crumbs(path: string[]): Crumb[] {
    const list: Crumb[] = [{ label: 'All recipes', path: [] }];
    return list.concat(
        path.map((label, index) => ({ label, path: path.slice(0, index + 1) }))
    );
}

export interface FacetOptions {
    label: string;
    opts: FacetGroup[];
}

/** The next narrowing step for a path, or null when the path is exhausted. */
export function options(list: RecipeSummary[], path: string[]): FacetOptions | null {
    const key = FACETS[path.length];
    if (key === undefined) return null;
    return { label: OPTION_LABELS[key], opts: groupBy(applyPath(list, path), key) };
}

export function encodePath(path: string[]): string {
    return path.map(encodeURIComponent).join('/');
}

export function decodePath(raw: string | null | undefined): string[] {
    if (!raw) return [];
    return raw.split('/').filter(Boolean).map(decodeURIComponent).slice(0, FACETS.length);
}

/** Free-text match on name, course, cuisine and tags. */
export function matchesQuery(summary: RecipeSummary, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return summary.RecipeName.toLowerCase().includes(q)
        || summary.Course.toLowerCase().includes(q)
        || summary.Cuisine.toLowerCase().includes(q)
        || summary.Tags.some(tag => tag.toLowerCase().includes(q));
}
