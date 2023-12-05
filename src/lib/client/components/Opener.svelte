<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import BarItem from "./BarItem.svelte";
    import Room from "./Room.svelte";
    import SimpleForm from "./SimpleForm.svelte";

    let {label} = $props<{label:string, children?:any}>()

    let open = $state(false)
</script>

<button on:click={()=>open = !open}>{label}</button>
{#if open}
<slot></slot>
    
{/if}

<style>
    button{
        background-color: beige;
        font-size: large;
        padding:5px;
        border: 2px solid black;
        padding-inline: 10px;
        border-radius: 20px;
        /* border: none; */
        /* box-shadow: 2px 2px 0px 2px black; */

    }
</style>