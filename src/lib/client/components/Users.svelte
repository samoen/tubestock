<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import BarItem from "./BarItem.svelte";
    import SimpleForm from "./SimpleForm.svelte";

    const appState = ClientState.getAppState();
    let searchResult = $state<undefined | Utils.OtherUserOnClient>(undefined)
    async function userSearch(inTxt:string){
        const intVal = Number.parseInt(inTxt);
        // if (!intVal) {
        //     return {
        //         failed: true,
        //         error: new Error("Must be number greater than 0"),
        //     };
        // }
        const toSend : Utils.UserSearchRequest = {
            userDbId: intVal
        }
        const hit = await ClientState.hitEndpoint('userSearch',toSend,Utils.userSearchResponseSchema)
        if(hit.failed){
            return hit
        }
        searchResult = hit.value.userDeets
        return hit
    }

</script>

<div class="outer">
    <BarItem compData={{ kind: "usrs", thingId: undefined, }} title="Users"></BarItem>
    <br />
    <br />
    <h4>Friends</h4>
    <div class="listOfBarItems">
        {#each appState.value.friendsList as u (u.id)}
            <div class="listItem">
                <BarItem
                compData={{
                        kind: "otherUsr",
                        thingId:u.id,
                    }}
                    title={u.displayName}
                ></BarItem>
            </div>
        {/each}
    </div>

    <h4>Top Users</h4>
    <div class="listOfBarItems">
        {#each appState.value.userList as u (u.id)}
            <div class="listItem">
                <BarItem
                compData={{
                        kind: "otherUsr",
                        thingId:u.id,
                    }}
                    title={u.displayName}
                ></BarItem>
            </div>
            {/each}
        </div>
        <h4>User search</h4>
        <SimpleForm buttonLabel='Search' inputs={[{itype:'text'}]} onSubmit={userSearch}></SimpleForm>
        {#if searchResult}
            <br/>
            <BarItem
            compData={{
                    kind: "otherUsr",
                    thingId:searchResult.id,
                }}
                title={searchResult.displayName}
            ></BarItem>
    {/if}
</div>

<style>
    .outer {
    }
</style>
