import { ParsingException } from '$lib/types';
import { isScalar, parseDocument } from 'yaml';
import type { RecipeVersionRaw } from './databaseTypes';

const ALLOWED_MEASUREMENTS = new Set([
    'grams',
    'ml',
    'unit',
    'teaspoon',
    'tablespoon',
    'clove',
    'pinch',
    'can',
    'bunch',
    'slice',
    'packet',
    'leaf',
]);

const ROOT_REQUIRED_KEYS = new Set(['schema_version', 'meta', 'portion', 'items', 'tables']);
const ROOT_OPTIONAL_KEYS = new Set(['tags', 'note']);
const META_KEYS = new Set(['description', 'source', 'cuisine']);
const PORTION_KEYS = new Set([
    'quantity',
    'descriptor',
    'active_time_minutes',
    'passive_time_minutes',
    'complexity_rating',
    'mayhem_rating',
]);
const ITEM_REQUIRED_KEYS = new Set(['name']);
const ITEM_OPTIONAL_KEYS = new Set(['quantity', 'sub']);
const TABLE_KEYS = new Set(['name', 'stages']);
const STAGE_REQUIRED_KEYS = new Set(['id', 'action']);
const STAGE_OPTIONAL_KEYS = new Set(['inputs', 'hint', 'setup']);
const INGREDIENT_INPUT_REQUIRED_KEYS = new Set(['ingredient']);
const INGREDIENT_INPUT_OPTIONAL_KEYS = new Set(['quantity', 'measurement', 'hint']);
const STAGE_INPUT_REQUIRED_KEYS = new Set(['stage']);
const STAGE_INPUT_OPTIONAL_KEYS = new Set(['part']);

const STAGE_ID_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const BRACKET_REFERENCE_PATTERN = /\[[^[\]\n]+\]/;
const CURLY_REFERENCE_PATTERN = /\{[^{}\n]+\}/;
const SMART_QUOTES = new Set(['\u2018', '\u2019', '\u201c', '\u201d']);

interface RecipeYAML {
    schema_version: 2;
    meta: {
        description: string;
        source: string;
        cuisine: string;
    };
    portion: {
        quantity: number;
        descriptor: string;
        active_time_minutes: number;
        passive_time_minutes: number;
        complexity_rating: number;
        mayhem_rating: number;
    };
    tags?: string[];
    items: Array<{
        name: string;
        quantity?: number;
        sub?: string;
    }>;
    tables: Array<{
        name: string;
        stages: Array<{
            id: string;
            inputs?: Array<
                | {
                    ingredient: string;
                    quantity?: number;
                    measurement?: string;
                    hint?: string;
                }
                | {
                    stage: string;
                    part?: string;
                }
            >;
            action: string;
            hint?: string;
            setup?: true;
        }>;
    }>;
    note?: string[];
}

export interface ParsedIngredientInput {
    Type: 'ingredient';
    IngredientName: string;
    Quantity?: number;
    Measurement?: string;
    Hint?: string;
}

export interface ParsedStageReferenceInput {
    Type: 'stage';
    StageKey: string;
    Part?: string;
}

export type ParsedStageInput = ParsedIngredientInput | ParsedStageReferenceInput;

export interface ParsedRecipe {
    Meta: Partial<RecipeVersionRaw>;
    Tags: string[];
    Items: Array<{
        ItemName: string;
        Quantity: number;
        Sub?: string;
    }>;
    Tables: Array<{
        TableName: string;
        Stages: Array<{
            StageKey: string;
            Setup: boolean;
            Inputs: ParsedStageInput[];
            Action: string;
            Hint?: string;
        }>;
    }>;
    Notes: string[];
}

interface StageGraph {
    seen: Map<string, { tableIndex: number; stageIndex: number }>;
    tableResults: Map<number, string>;
    setupIds: Set<string>;
    order: string[];
    consumers: Map<string, number>;
    references: Array<{ path: string; stageKey: string; namesPart: boolean }>;
    complete: boolean;
}

function isMapping(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function union(...sets: Set<string>[]): Set<string> {
    return new Set(sets.flatMap(set => [...set]));
}

function validateUnknownKeys(
    value: Record<string, unknown>,
    path: string,
    allowed: Set<string>,
    errors: string[],
) {
    const unknown = Object.keys(value).filter(key => !allowed.has(key)).sort();
    if (unknown.length > 0) {
        errors.push(`'${path}' contains unknown key(s): ${unknown.map(key => `'${key}'`).join(', ')}`);
    }
}

function validateExactKeys(
    value: Record<string, unknown>,
    path: string,
    required: Set<string>,
    optional: Set<string>,
    errors: string[],
) {
    for (const key of [...required].sort()) {
        if (!(key in value)) errors.push(`'${path}' missing required key '${key}'`);
    }
    validateUnknownKeys(value, path, union(required, optional), errors);
}

function validateString(value: unknown, path: string, errors: string[]): value is string {
    if (typeof value !== 'string' || value.length === 0 || value !== value.trim()) {
        errors.push(`'${path}' must be a non-empty, trimmed string`);
        return false;
    }

    let valid = true;
    if (SMART_QUOTES.has(value[0]) || SMART_QUOTES.has(value[value.length - 1])) {
        errors.push(`'${path}' must not use literal smart-quote wrappers`);
        valid = false;
    }
    if (BRACKET_REFERENCE_PATTERN.test(value)) {
        errors.push(`'${path}' contains a legacy bracket reference`);
        valid = false;
    }
    if (CURLY_REFERENCE_PATTERN.test(value)) {
        errors.push(`'${path}' contains legacy proportion/reference syntax`);
        valid = false;
    }
    return valid;
}

function validatePositiveNumber(value: unknown, path: string, errors: string[]): value is number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        errors.push(`'${path}' must be a positive finite number`);
        return false;
    }
    return true;
}

function validatePositiveInteger(
    value: unknown,
    path: string,
    errors: string[],
    hasIntegerSyntax = true,
): value is number {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0 || !hasIntegerSyntax) {
        errors.push(`'${path}' must be a positive integer`);
        return false;
    }
    return true;
}

function validateStringList(value: unknown, path: string, errors: string[]) {
    if (!Array.isArray(value)) {
        errors.push(`'${path}' must be a list`);
        return;
    }
    value.forEach((entry, index) => validateString(entry, `${path}[${index}]`, errors));
}

function validateMeta(value: unknown, errors: string[]) {
    if (!isMapping(value)) {
        errors.push("'meta' must be a mapping");
        return;
    }
    validateExactKeys(value, 'meta', META_KEYS, new Set(), errors);
    for (const key of META_KEYS) {
        if (key in value) validateString(value[key], `meta.${key}`, errors);
    }
}

function validatePortion(
    value: unknown,
    errors: string[],
    isIntegerAt: (path: Array<string | number>) => boolean,
) {
    if (!isMapping(value)) {
        errors.push("'portion' must be a mapping");
        return;
    }
    validateExactKeys(value, 'portion', PORTION_KEYS, new Set(), errors);

    if ('quantity' in value) {
        validatePositiveInteger(
            value.quantity,
            'portion.quantity',
            errors,
            isIntegerAt(['portion', 'quantity']),
        );
    }
    if ('descriptor' in value) validateString(value.descriptor, 'portion.descriptor', errors);

    for (const key of ['active_time_minutes', 'passive_time_minutes']) {
        if (!(key in value)) continue;
        const entry = value[key];
        if (
            typeof entry !== 'number'
            || !Number.isInteger(entry)
            || entry < 0
            || !isIntegerAt(['portion', key])
        ) {
            errors.push(`'portion.${key}' must be a non-negative integer`);
        }
    }

    for (const key of ['complexity_rating', 'mayhem_rating']) {
        if (!(key in value)) continue;
        const entry = value[key];
        if (
            typeof entry !== 'number'
            || !Number.isInteger(entry)
            || entry < 1
            || entry > 5
            || !isIntegerAt(['portion', key])
        ) {
            errors.push(`'portion.${key}' must be an integer between 1 and 5`);
        }
    }
}

function validateItems(value: unknown, errors: string[]) {
    if (!Array.isArray(value) || value.length === 0) {
        errors.push("'items' must be a non-empty list");
        return;
    }

    value.forEach((entry, index) => {
        const path = `items[${index}]`;
        if (!isMapping(entry)) {
            errors.push(`'${path}' must be a mapping`);
            return;
        }
        validateExactKeys(entry, path, ITEM_REQUIRED_KEYS, ITEM_OPTIONAL_KEYS, errors);
        if ('name' in entry) validateString(entry.name, `${path}.name`, errors);
        if ('quantity' in entry) validatePositiveNumber(entry.quantity, `${path}.quantity`, errors);
        if ('sub' in entry) validateString(entry.sub, `${path}.sub`, errors);
    });
}

function validateStageId(value: unknown, path: string, errors: string[]): value is string {
    if (!validateString(value, path, errors)) return false;
    if (!STAGE_ID_PATTERN.test(value)) {
        errors.push(`'${path}' must be a snake_case identifier`);
        return false;
    }
    return true;
}

function validateIngredientInput(value: Record<string, unknown>, path: string, errors: string[]) {
    validateExactKeys(value, path, INGREDIENT_INPUT_REQUIRED_KEYS, INGREDIENT_INPUT_OPTIONAL_KEYS, errors);
    validateString(value.ingredient, `${path}.ingredient`, errors);

    const hasQuantity = 'quantity' in value;
    const hasMeasurement = 'measurement' in value;
    if (hasQuantity !== hasMeasurement) {
        errors.push(`'${path}' must provide 'quantity' and 'measurement' together`);
    }
    if (hasQuantity) validatePositiveNumber(value.quantity, `${path}.quantity`, errors);
    if (hasMeasurement && validateString(value.measurement, `${path}.measurement`, errors)) {
        if (!ALLOWED_MEASUREMENTS.has(value.measurement)) {
            const allowed = [...ALLOWED_MEASUREMENTS].sort().join(', ');
            errors.push(`'${path}.measurement' value '${value.measurement}' is not allowed. Use one of: ${allowed}`);
        }
    }
    if ('hint' in value) {
        validateString(value.hint, `${path}.hint`, errors);
    } else if (!hasQuantity && !hasMeasurement) {
        errors.push(`'${path}' must include a non-empty 'hint' when amountless`);
    }
}

function validateStageReferenceInput(
    value: Record<string, unknown>,
    path: string,
    tableIndex: number,
    graph: StageGraph,
    errors: string[],
) {
    validateExactKeys(value, path, STAGE_INPUT_REQUIRED_KEYS, STAGE_INPUT_OPTIONAL_KEYS, errors);
    const namesPart = 'part' in value;
    if (namesPart) validateString(value.part, `${path}.part`, errors);

    const reference = value.stage;
    if (!validateStageId(reference, `${path}.stage`, errors)) return;
    const referencedStage = graph.seen.get(reference);
    if (!referencedStage) {
        errors.push(`'${path}.stage' must reference an earlier stage; '${reference}' has not been defined yet`);
        return;
    }
    if (graph.setupIds.has(reference)) {
        errors.push(`'${path}.stage' must not reference setup stage '${reference}' as food`);
        return;
    }

    graph.consumers.set(reference, (graph.consumers.get(reference) ?? 0) + 1);
    graph.references.push({ path, stageKey: reference, namesPart });
    if (referencedStage.tableIndex !== tableIndex && graph.tableResults.get(referencedStage.tableIndex) !== reference) {
        errors.push(`'${path}.stage' cross-table reference '${reference}' must target the final stage of its earlier table`);
    }
}

function validateInputs(
    value: unknown,
    path: string,
    tableIndex: number,
    graph: StageGraph,
    errors: string[],
) {
    if (!Array.isArray(value)) {
        errors.push(`'${path}' must be a list`);
        return;
    }

    let seenIngredient = false;
    value.forEach((entry, index) => {
        const inputPath = `${path}[${index}]`;
        if (!isMapping(entry)) {
            errors.push(`'${inputPath}' must be a mapping`);
            return;
        }

        const hasIngredient = 'ingredient' in entry;
        const hasStage = 'stage' in entry;
        if (hasIngredient === hasStage) {
            errors.push(`'${inputPath}' must contain exactly one of 'ingredient' or 'stage'`);
            validateUnknownKeys(
                entry,
                inputPath,
                union(
                    INGREDIENT_INPUT_REQUIRED_KEYS,
                    INGREDIENT_INPUT_OPTIONAL_KEYS,
                    STAGE_INPUT_REQUIRED_KEYS,
                    STAGE_INPUT_OPTIONAL_KEYS,
                ),
                errors,
            );
            return;
        }

        if (hasIngredient) {
            seenIngredient = true;
            validateIngredientInput(entry, inputPath, errors);
            return;
        }

        if (seenIngredient) errors.push(`'${inputPath}' must be listed before the ingredient inputs`);
        validateStageReferenceInput(entry, inputPath, tableIndex, graph, errors);
    });
}

function validateStage(
    value: unknown,
    path: string,
    tableIndex: number,
    stageIndex: number,
    graph: StageGraph,
    errors: string[],
) {
    if (!isMapping(value)) {
        errors.push(`'${path}' must be a mapping`);
        graph.complete = false;
        return;
    }

    validateExactKeys(value, path, STAGE_REQUIRED_KEYS, STAGE_OPTIONAL_KEYS, errors);
    const stageKey = value.id;
    const validStageKey = validateStageId(stageKey, `${path}.id`, errors);
    if ('action' in value) validateString(value.action, `${path}.action`, errors);
    if ('hint' in value) validateString(value.hint, `${path}.hint`, errors);

    let isSetup = false;
    if ('setup' in value) {
        if (value.setup !== true) {
            errors.push(`'${path}.setup' must be the boolean true when present`);
        } else {
            isSetup = true;
            if (value.inputs) errors.push(`'${path}' is a setup stage and must not take inputs`);
        }
    }

    if ('inputs' in value) validateInputs(value.inputs, `${path}.inputs`, tableIndex, graph, errors);

    if (!validStageKey) {
        graph.complete = false;
        return;
    }
    const firstUse = graph.seen.get(stageKey);
    if (firstUse) {
        errors.push(
            `'${path}.id' duplicates stage id '${stageKey}' first used at tables[${firstUse.tableIndex}].stages[${firstUse.stageIndex}]`,
        );
        graph.complete = false;
        return;
    }

    graph.seen.set(stageKey, { tableIndex, stageIndex });
    graph.order.push(stageKey);
    if (isSetup) graph.setupIds.add(stageKey);
}

function validateStageGraph(graph: StageGraph, errors: string[]) {
    for (const reference of graph.references) {
        if ((graph.consumers.get(reference.stageKey) ?? 0) > 1 && !reference.namesPart) {
            errors.push(
                `'${reference.path}' must name a 'part' because stage '${reference.stageKey}' feeds more than one later stage`,
            );
        }
    }
    if (!graph.complete || graph.order.length === 0) return;

    const unused = graph.order.filter(stageKey => !graph.setupIds.has(stageKey) && !graph.consumers.has(stageKey));
    if (unused.length !== 1) {
        const rendered = unused.length > 0 ? unused.map(stageKey => `'${stageKey}'`).join(', ') : 'none';
        errors.push(`'tables' must contain exactly one unused stage holding the finished dish; found: ${rendered}`);
        return;
    }
    if (unused[0] !== graph.order[graph.order.length - 1]) {
        errors.push(`'tables' finished dish '${unused[0]}' must be the last stage of the last table`);
    }
}

function validateTables(value: unknown, errors: string[]) {
    if (!Array.isArray(value) || value.length === 0) {
        errors.push("'tables' must be a non-empty list");
        return;
    }

    const graph: StageGraph = {
        seen: new Map(),
        tableResults: new Map(),
        setupIds: new Set(),
        order: [],
        consumers: new Map(),
        references: [],
        complete: true,
    };

    value.forEach((table, tableIndex) => {
        const tablePath = `tables[${tableIndex}]`;
        if (!isMapping(table)) {
            errors.push(`'${tablePath}' must be a mapping`);
            graph.complete = false;
            return;
        }
        validateExactKeys(table, tablePath, TABLE_KEYS, new Set(), errors);
        if ('name' in table) validateString(table.name, `${tablePath}.name`, errors);

        if (!('stages' in table)) {
            graph.complete = false;
            return;
        }
        if (!Array.isArray(table.stages) || table.stages.length === 0) {
            errors.push(`'${tablePath}.stages' must be a non-empty list`);
            graph.complete = false;
            return;
        }

        table.stages.forEach((stage, stageIndex) => {
            validateStage(stage, `${tablePath}.stages[${stageIndex}]`, tableIndex, stageIndex, graph, errors);
        });

        const finalStage = table.stages[table.stages.length - 1];
        if (isMapping(finalStage) && validateStageIdWithoutErrors(finalStage.id)) {
            if (graph.setupIds.has(finalStage.id)) {
                errors.push(
                    `'${tablePath}.stages[${table.stages.length - 1}]' is the table result and must not be a setup stage`,
                );
            } else {
                graph.tableResults.set(tableIndex, finalStage.id);
            }
        }
    });

    validateStageGraph(graph, errors);
}

function validateStageIdWithoutErrors(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0 && value === value.trim() && STAGE_ID_PATTERN.test(value);
}

function validateRecipeFormat(
    data: unknown,
    isIntegerAt: (path: Array<string | number>) => boolean,
): data is RecipeYAML {
    const errors: string[] = [];
    if (!isMapping(data)) return false;

    validateExactKeys(data, 'root', ROOT_REQUIRED_KEYS, ROOT_OPTIONAL_KEYS, errors);
    if ('schema_version' in data && (data.schema_version !== 2 || !isIntegerAt(['schema_version']))) {
        errors.push("'schema_version' must be the integer 2");
    }
    if ('meta' in data) validateMeta(data.meta, errors);
    if ('portion' in data) validatePortion(data.portion, errors, isIntegerAt);
    if ('tags' in data) validateStringList(data.tags, 'tags', errors);
    if ('items' in data) validateItems(data.items, errors);
    if ('tables' in data) validateTables(data.tables, errors);
    if ('note' in data) validateStringList(data.note, 'note', errors);

    if (errors.length > 0) throw new ParsingException(errors.join('\n'));
    return true;
}

export function parseRecipeYAML(recipeData: string): ParsedRecipe {
    const document = parseDocument(recipeData);
    if (document.errors.length > 0) {
        throw new ParsingException(`Error parsing YAML: ${document.errors.map(error => error.message).join('\n')}`);
    }
    const parsedYaml: unknown = document.toJS();
    const isIntegerAt = (path: Array<string | number>) => {
        const node = document.getIn(path, true);
        if (!isScalar<number>(node) || typeof node.value !== 'number' || typeof node.source !== 'string') {
            return false;
        }
        return /^[-+]?[0-9]+$/.test(node.source) || /^0x[0-9a-fA-F]+$/.test(node.source) || /^0o[0-7]+$/.test(node.source);
    };

    if (!validateRecipeFormat(parsedYaml, isIntegerAt)) {
        throw new ParsingException('The YAML document root must be a mapping');
    }

    return {
        Meta: {
            SchemaVersion: parsedYaml.schema_version,
            Description: parsedYaml.meta.description,
            Source: parsedYaml.meta.source,
            Cuisine: parsedYaml.meta.cuisine,
            PortionQuantity: parsedYaml.portion.quantity,
            PortionDescriptor: parsedYaml.portion.descriptor,
            ActiveTimeMinutes: parsedYaml.portion.active_time_minutes,
            PassiveTimeMinutes: parsedYaml.portion.passive_time_minutes,
            ComplexityRating: parsedYaml.portion.complexity_rating,
            MayhemRating: parsedYaml.portion.mayhem_rating,
        },
        Tags: parsedYaml.tags ?? [],
        Items: parsedYaml.items.map(item => ({
            ItemName: item.name,
            Quantity: item.quantity ?? 1,
            Sub: item.sub,
        })),
        Tables: parsedYaml.tables.map(table => ({
            TableName: table.name,
            Stages: table.stages.map(stage => ({
                StageKey: stage.id,
                Setup: stage.setup ?? false,
                Inputs: (stage.inputs ?? []).map(input => {
                    if ('ingredient' in input) {
                        return {
                            Type: 'ingredient' as const,
                            IngredientName: input.ingredient,
                            Quantity: input.quantity,
                            Measurement: input.measurement,
                            Hint: input.hint,
                        };
                    }
                    return {
                        Type: 'stage' as const,
                        StageKey: input.stage,
                        Part: input.part,
                    };
                }),
                Action: stage.action,
                Hint: stage.hint,
            })),
        })),
        Notes: parsedYaml.note ?? [],
    };
}
