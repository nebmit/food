<script lang="ts">
    import { page } from "$app/stores";
</script>

<div class="error-container">
    <div class="content">
        <h1 class="error-code">{$page.status}</h1>
        <p class="error-message">
            {#if $page.error && $page.error.message}
                {$page.error.message}
            {:else}
                An error occurred.
            {/if}
        </p>

        {#if $page.status === 401}
            <a href="/login">Login</a>
            <a href="/">Go Home</a>
        {:else}
            <a href="/">Go Home</a>
        {/if}
    </div>
</div>

<style>
    .error-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-family: "Arial", sans-serif;
        position: relative;
        overflow: hidden;
    }

    .content {
        z-index: 1;
        position: relative;
        text-align: center;
    }

    .error-code {
        font-size: 3em;
        font-weight: bold;
    }

    .error-message {
        font-size: 1.5em;
        margin-bottom: 2em;
    }

    a {
        text-decoration: none;
        margin: 1em;
        padding: 0.5em;
        border: 1px solid var(--text-color);
        transition: background-color 0.3s, color 0.3s;
    }

    a:hover {
        background-color: var(--text-color);
        color: var(--bg-color);
    }
</style>
