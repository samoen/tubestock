<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import BarItem from "./BarItem.svelte";
    import SimpleForm from "./SimpleForm.svelte";

    const appState = ClientState.getAppState();
</script>

<div class="outer">
    <BarItem compData={{ kind: "static", id: "usrs" }} title="Users"></BarItem>
    <br />
    <br />
    <div class="usrlist">
        {#each appState.value.userList as u (u.id)}
            <div class="usrItem">
                <!-- <span>{u.displayName}</span> -->
                <BarItem
                compData={{
                        kind: "user",
                        id: `user${u.id}`,
                        userOnClient: u,
                    }}
                    title={u.displayName}
                ></BarItem>
                <!-- <button
                    type="button"
                    class="itemButton"
                    on:click={() => {
                        showUser(u);
                    }}>show</button
                > -->
            </div>
        {/each}
    </div>
</div>

<style>
    .outer {
    }
    .usrlist {
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
        /* margin-bottom: 20px;
        margin-top: 20px;
        margin-inline: 20px; */
    }
</style>
