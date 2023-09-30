<script lang="ts">
    import Navbar from "$lib/fragments/navbar.svelte";
    import { writable } from "svelte/store";
    import { fly } from "svelte/transition";
    import TextualEditor from "./textualEditor.svelte";

    let recipeName = "";
    const isNameValid = writable(false);
    let showTextualEditor = false;

    function validateName() {
        isNameValid.set(recipeName.length >= 3 && recipeName.length <= 50);
    }

    function toggleTextualEditor() {
        showTextualEditor = !showTextualEditor;
    }
</script>

<Navbar />

<div class="container mx-auto mt-20 px-4 sm:px-0">
    <div class="flex flex-col items-center">
        <div class="w-5/6 items-center">
            {#if !showTextualEditor}
                <h1 class="text-3xl font-semibold mb-10">
                    Create a New Recipe
                </h1>
                <div class="mb-8">
                    <input
                        type="text"
                        class="w-full border-b-2 border-gray-300 bg-transparent py-2 focus:outline-none focus:border-black transition duration-200"
                        placeholder="Enter recipe name..."
                        bind:value={recipeName}
                        on:input={validateName}
                    />
                </div>
            {/if}

            {#if $isNameValid && !showTextualEditor}
                <div
                    class="flex space-x-4"
                    transition:fly={{ y: 20, duration: 300, opacity: 0.6 }}
                >
                    <button
                        class="btn-editor-selection flex-grow"
                        on:click={toggleTextualEditor}
                    >
                        Textual Editor
                    </button>
                    <button
                        class="btn-editor-selection flex-grow"
                        disabled={true}
                    >
                        Graphical Editor
                    </button>
                </div>
            {/if}

            {#if showTextualEditor}
                <TextualEditor {recipeName} />
            {/if}
        </div>
    </div>
</div>

<style>
    .btn-editor-selection {
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #e1e1e1;
        padding: 12px;
        font-weight: 500;
        text-align: center;
        transition: background-color 0.3s ease, border-color 0.3s ease;
        cursor: pointer;
        background-color: #fff;
    }

    .btn-editor-selection:hover {
        border-color: #000;
        background-color: #f5f5f5;
    }

    .btn-editor-selection:disabled {
        opacity: 0.6;
        pointer-events: none;
    }
</style>
