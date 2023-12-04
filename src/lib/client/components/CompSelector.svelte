<script lang="ts">
    import User from "$lib/client/components/User.svelte"
    import Users from "$lib/client/components/Users.svelte"
    import Rooms from "$lib/client/components/Rooms.svelte"
    import Positions from "$lib/client/components/Positions.svelte"
    import GlobalChat from "$lib/client/components/GlobalChat.svelte"
    import Tubers from "$lib/client/components/Tubers.svelte"
    import * as ClientState from "$lib/client/clientState.svelte"

    type Props = {
        key:ClientState.CompKey;
    };
    let { key } = $props<Props>();



</script>

<!-- animate:flip={{duration:400,delay:0}} -->
<div 
class='outer'
>
    {#if key == 'usr'}
        <User></User>
    {:else if key == 'usrs'}
        <Users></Users>
    {:else if key == 'rooms'}
    <Rooms></Rooms>
    {:else if key == 'tubers'}
    <Tubers></Tubers>
    {:else if key == 'positions'}
    <Positions></Positions>
    {:else if key == 'globalChat'}
    <GlobalChat></GlobalChat>
    {:else}
    <p>comp key not found</p>
    {/if}

</div>




