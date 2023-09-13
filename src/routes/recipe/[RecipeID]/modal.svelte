<script lang="ts">
    export let imageUrl: string = "";
    export let recipeName: string = "";
    export let onSave: (image: File, name: string) => string | void = () => {};
    export let onCancel: () => void = () => {};

    let imageFile: File;
    let previewImageUrl: string;
    let errorMessage = "";

    function handleFileChange(event: Event) {
        const target = event.target as HTMLInputElement;
        if (!target.files || target.files.length === 0) return;

        errorMessage = "";

        imageFile = target.files[0];
        if (!imageFile.type.startsWith("image/")) {
            errorMessage = "File must be an image";
            return;
        }

        const reader = new FileReader();

        reader.onload = (e: ProgressEvent<FileReader>) => {
            if (e.target && e.target.result) {
                previewImageUrl = e.target.result as string;
            }
        };

        reader.onerror = (errorEvent: ProgressEvent<FileReader>) => {
            console.error("Error reading the file:", errorEvent);
            errorMessage = "Error reading the file";
        };

        reader.readAsDataURL(imageFile);
    }
</script>

<div
    class="fixed z-10 inset-0 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
>
    <div
        class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
        <div
            class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            on:click={onCancel}
            aria-hidden="true"
        />

        <span
            class="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true">&#8203;</span
        >

        <div
            class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
        >
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div class="mb-4">
                    <label
                        for="recipeName"
                        class="block text-sm font-medium text-gray-700"
                        >Recipe Name:</label
                    >
                    <input
                        type="text"
                        id="recipeName"
                        name="recipeName"
                        class="mt-1 p-2 w-full border rounded-md"
                        bind:value={recipeName}
                    />
                </div>
                <div class="mb-4">
                    <label
                        for="recipeImage"
                        class="block text-sm font-medium text-gray-700"
                        >Recipe Image:</label
                    >
                    <img
                        src={previewImageUrl || imageUrl}
                        alt={recipeName}
                        class="w-full h-40 object-cover mb-2"
                    />

                    <div class="relative inline-block">
                        <input
                            type="file"
                            id="recipeImage"
                            name="recipeImage"
                            class="absolute opacity-0 w-0 h-0"
                            accept="image/*"
                            on:change={handleFileChange}
                        />
                        <label
                            for="recipeImage"
                            class="px-4 py-2 select-none outline-slate-600 outline-1 text-gray-800 font-medium rounded-bl cursor-pointer hover:outline transition duration-200"
                            >Upload Image...
                        </label>
                    </div>
                </div>
            </div>
            <div class="text-right font-semibold text-red-600 h-6 px-8">
                {errorMessage}
            </div>
            <div class="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                    type="button"
                    class="bg-blue-800 text-white hover:bg-blue-600 rounded px-4 py-2 font-semibold transition duration-200 ease-in-out"
                    on:click={() => {
                        errorMessage = onSave(imageFile, recipeName) ?? "";
                    }}
                >
                    Save
                </button>
                <button
                    type="button"
                    class="bg-gray-300 text-gray-700 hover:bg-gray-400 rounded px-4 py-2 font-semibold transition duration-200 ease-in-out mr-2"
                    on:click={() => onCancel()}
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
</div>
