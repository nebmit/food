<script lang="ts">
    export let onDelete: () => void = () => {};

    function handleClick() {
        if (!confirm("Are you sure you want to delete this element?")) {
            return;
        }
        onDelete();
    }
</script>

<button class=" bg-red-600 p-1 rounded hover:bg-red-700" on:click={handleClick}>
    <svg
        width="20"
        height="20"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="white"
    >
        <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
        />
    </svg>
</button>
