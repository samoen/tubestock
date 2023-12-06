<script lang="ts">
    import User from "$lib/client/components/User.svelte";
    import Users from "$lib/client/components/Users.svelte";
    import Rooms from "$lib/client/components/Rooms.svelte";
    import Positions from "$lib/client/components/Positions.svelte";
    import GlobalChat from "$lib/client/components/GlobalChat.svelte";
    import Tubers from "$lib/client/components/Tubers.svelte";
    import Tuber from "$lib/client/components/Tuber.svelte";
    import * as ClientState from "$lib/client/clientState.svelte";
    import Room from "./Room.svelte";
    import OtherUser from "./OtherUser.svelte";

    const appState = ClientState.getAppState();

    type Props = {
        key: {compKey: ClientState.ComponentWantShow,thing:any};
    };
    const { key } = $props<Props>();
</script>

<!-- {#if key.compKey.kind == "static"}
    {#if key.compKey.thingId == "usr"}
        <User></User>
    {:else if key.compKey.thingId == "usrs"}
        <Users></Users>
    {:else if key.compKey.thingId == "rooms"}
        <Rooms></Rooms>
    {:else if key.compKey.thingId == "tubers"}
        <Tubers></Tubers>
    {:else if key.compKey.thingId == "positions"}
        <Positions></Positions>
    {:else if key.compKey.thingId == "globalChat"}
        <GlobalChat></GlobalChat>
    {:else}
        <p>static comp not found</p>
    {/if}
{:else if key.compKey.kind == "room"}
    <Room thing={key.thing}></Room>
{:else if key.compKey.kind == "user"}
    <OtherUser thing={key.thing}></OtherUser>
{:else if key.compKey.kind == "tuber"}
    <Tuber thing={key.thing}></Tuber>
{:else}
    <p>comp not found</p>
{/if} -->

<!-- </div> -->

<style>
    /* .outer{
        background-color: burlywood;
        padding:4px;
        border-radius: 5px;
    } */
</style>
