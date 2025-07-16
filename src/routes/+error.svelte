<script lang="ts">
    import { page } from "$app/stores";
</script>

<div class="bg-white flex-1 flex items-center justify-center px-6">
    <div class="text-center max-w-md mx-auto">
        <!-- Error Code -->
        <h1 class="text-6xl md:text-8xl font-bold text-gray-800 mb-4">
            {$page.status}
        </h1>

        <!-- Error Message -->
        <p class="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
            {#if $page.error && $page.error.message}
                {$page.error.message}
            {:else if $page.status === 404}
                page not found
            {:else if $page.status === 500}
                something went wrong
            {:else}
                an error occurred
            {/if}
        </p>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
            {#if $page.status === 401}
                <a
                    href="/login"
                    class="px-6 py-2.5 bg-gray-800 text-white font-medium rounded hover:bg-gray-700 transition-colors duration-200"
                >
                    login
                </a>
            {/if}
            <a
                href="/"
                class="px-6 py-2.5 bg-gray-100 text-gray-800 font-medium rounded hover:bg-gray-200 transition-colors duration-200"
            >
                go home
            </a>
        </div>
    </div>
</div>
