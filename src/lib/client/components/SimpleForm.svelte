<script lang="ts">
    import spinny from "$lib/client/svg/spinny.svg";

    let {buttonLabel, fire} = $props<{buttonLabel:string,fire: (inputTxt:string) => Promise<void>}>()
    // export const buttonLabel: string;
    // export let loading: boolean;
    // export let fire: (inputTxt:string) => Promise<void>;
    // export let formProps: ClientState.SimpleFormProps;

    let meLoad = $state(false)
    let meInputTxt = $state('')

    function inputSubmit(
        event: KeyboardEvent & {
            currentTarget: EventTarget & HTMLInputElement;
        },
        
    ) {
        if (event.key === "Enter") {
            itClicked();
            event.preventDefault();
        }
    }

    async function itClicked(){
        if (!meInputTxt) return;
        meLoad = true
        await fire(meInputTxt);
        meLoad = false
        meInputTxt = "";
    }
</script>

<!-- placeholder="Type your name" -->
<!-- disabled={formProps.loading} -->
<input
    type="text"
    disabled={meLoad}
    bind:value={meInputTxt}
    on:keydown={inputSubmit}
/>
<!-- disabled={formProps.loading} -->
<!-- class:transparentText={formProps.loading} -->
<button
    type="button"
    on:click={itClicked}
    disabled={meLoad}
    class:transparentText={meLoad}
>
    <!-- {#if formProps.loading} -->
    {#if meLoad}
        <img class="buttonLoading" src={spinny} alt="spinner" />
    {/if}
    {buttonLabel}
</button>

<style>
    .transparentText {
        color: transparent;
    }

    button {
        position: relative;
        padding-block: 2px;
        padding-inline: 4px;
    }
    .buttonLoading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        height: 1em;
    }
    input {
        padding-block: 2px;
    }
</style>
