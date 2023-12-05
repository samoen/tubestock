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

    type Props = {
        key: ClientState.CompKey;
    };
    let { key } = $props<Props>();
</script>

<!-- animate:flip={{duration:400,delay:0}} -->
<!-- <div class="outer brutal-border"> -->
    {#if key.kind == "static"}
        {#if key.id == "usr"}
            <User></User>
        {:else if key.id == "usrs"}
            <Users></Users>
        {:else if key.id == "rooms"}
            <Rooms></Rooms>
        {:else if key.id == "tubers"}
            <Tubers></Tubers>
        {:else if key.id == "positions"}
            <Positions></Positions>
        {:else if key.id == "globalChat"}
            <GlobalChat></GlobalChat>
        {:else}
            <p>comp key not found</p>
        {/if}
    {:else if key.kind == 'room'}
        <Room inviteId={key.invite.id}></Room>
    {:else if key.kind == 'user'}
        <OtherUser thingId={key.userOnClient.id}></OtherUser>
    {:else if key.kind == 'tuber'}
        <Tuber tuberOnClient={key.tuberOnClient}></Tuber>
    {/if}
<!-- </div> -->

<style>
    /* .outer{
        background-color: burlywood;
        padding:4px;
        border-radius: 5px;
    } */
</style>
