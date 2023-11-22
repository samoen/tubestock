<script lang="ts">
    import spinny from "$lib/client/svg/spinny.svg";
    import type { SamResult } from "$lib/utils";
    type Props = {
        buttonLabel: string;
        fire: (inputTxt: string) => Promise<SamResult<unknown>>;
        inputType?: "text" | "number";
        placeholder?: string;
    };

    let { buttonLabel, fire, inputType, placeholder } = $props<Props>();
    const pHold = placeholder ? placeholder : ''

    const iType = inputType ? inputType : "text";
    let meLoad = $state(false);
    let meInputTxt = $state("");
    let errTxt = $state("");

    $effect(()=>{
        meInputTxt
        clearError()
    })
    
    export function clearError(){
        errTxt = ''

    }


    export function inputSubmit(
        event: KeyboardEvent & {
            currentTarget: EventTarget & HTMLInputElement;
        }
    ) {
        if (event.key === "Enter") {
            itClicked();
            event.preventDefault();
        }
    }

    async function itClicked() {
        if (!meInputTxt) {
            errTxt = 'blank field'
            return
        };
        meLoad = true;
        let res = await fire(meInputTxt);
        meLoad = false;
        if(res.failed){
            errTxt = res.error.message
            return
        }
        meInputTxt = "";
    }
</script>

<!-- placeholder="Type your name" -->
<!-- disabled={formProps.loading} -->
{#if iType == "text"}
    <input
        type="text"
        disabled={meLoad}
        bind:value={meInputTxt}
        on:keydown={inputSubmit}
        placeholder="{pHold}"
    />
{:else}
    <input
        type="number"
        disabled={meLoad}
        bind:value={meInputTxt}
        on:keydown={inputSubmit}
        placeholder="{pHold}"
    />
{/if}
<div class='slotHold'>
    <slot></slot>
</div>
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
<span class='err'>{errTxt}</span>

<style>
    .err{
        color:red;
    }
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
    .slotHold {
        display: inline-block;
        /* background-color: blue; */
        /* padding:3px; */
    }
    .slotHold :global(input){
        padding-block: 2px;
    }
</style>
