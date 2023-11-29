<script lang="ts">
    import spinny from "$lib/client/svg/spinny.svg";
    import type { SamResult } from "$lib/utils";
    type Props = {
        buttonLabel: string;
        onSubmit?: (...args: any[]) => Promise<SamResult<unknown>>;
        inputs?: InputShape[];
    };
    type InputShape = {
        itype: "text" | "number" | "checkbox";
        placeHold?: string;
    };

    let { buttonLabel, inputs: things, onSubmit: coolfire } = $props<Props>();

    let meLoad = $state(false);
    let errTxt = $state("");

    type EleThing = {
        ishape: InputShape;
        ele: HTMLElement | undefined;
    };
    let inputEles: EleThing[] = !things
        ? []
        : things.map((t) => {
              return {
                  ishape: t,
                  ele: undefined,
              };
          });

    export function clearError() {
        errTxt = "";
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
        if (!coolfire) return;
        errTxt = ""
        meLoad = true;
        let vals: string[] = [];
        for (const ie of inputEles) {
            if (!ie.ele) continue;
            let child = ie.ele.firstElementChild;
            if (!child || !(child instanceof HTMLInputElement)) continue;
            if (child.type == "checkbox") {
                vals.push(child.checked ? "true" : "false");
                continue;
            }
            if (!child.value) {
                errTxt = "blank field";
                meLoad = false;
                return;
            }
            vals.push(child.value);
        }
        let res = await coolfire(...vals);
        meLoad = false;
        if (res.failed) {
            errTxt = res.error.message;
            return;
        }
        for (const ie of inputEles) {
            if (!ie.ele) continue;
            let child = ie.ele.firstElementChild;
            if (!child || !(child instanceof HTMLInputElement)) continue;
            child.value = "";
        }
    }
    function inputChanged() {
        // console.log("input changed");
        errTxt = "";
    }
</script>

{#if things}
    {#each inputEles as t}
        <div class="inputHolder" bind:this={t.ele}>
            <input
                on:input={inputChanged}
                type={t.ishape.itype}
                disabled={meLoad}
                on:keydown={inputSubmit}
                placeholder={t.ishape.placeHold}
            />
        </div>
        {#if t.ishape.itype == "checkbox"}
            {t.ishape.placeHold}
        {/if}
    {/each}
{/if}

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
<span class="err">{errTxt}</span>

<style>
    .err {
        color: red;
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
    input[type="text"] {
        padding-block: 2px;
    }
    .inputHolder {
        display: inline;
    }
</style>
