import { writable, type Writable } from 'svelte/store';

/** Document title; null falls back to the site name. */
export const pageTitle: Writable<string | null> = writable(null);
