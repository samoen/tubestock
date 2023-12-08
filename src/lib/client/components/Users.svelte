<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import BarItem from "./BarItem.svelte";
    import SimpleForm from "./SimpleForm.svelte";

    const appState = ClientState.getAppState();
    let searchResult = $state<undefined | Utils.OtherUserOnClient>(undefined);
    // let lastSearchResult = $derived((()=>{
    //     appState.value.uiUserList.
    // })())
    async function userSearch(inTxt: string) {
        const intVal = Number.parseInt(inTxt);
        const toSend: Utils.UserSearchRequest = {
            userDbId: intVal,
        };
        const hit = await ClientState.hitEndpoint(
            "userSearch",
            toSend,
            Utils.userSearchResponseSchema,
        );
        if (hit.failed) {
            return hit;
        }
        // appState.value.uiUserList.push(hit.value.userDeets)
        appState.dirty();
        searchResult = hit.value.userDeets;
        // appState.value.uiUserList.push(hit.value.userDeets);
        return hit;
    }
    // let userstest = ClientState.userstest
    // console.log(JSON.stringify(userstest))
</script>

<div class="outer">
    <BarItem compData={{ kind: "usrs" }} title="Users"></BarItem>
    <br />
    <br />
    {#if appState.value.friendsList.length > 0}
        <h4>Friends</h4>
        <div class="listOfBarItems">
            {#each appState.value.friendsList as u (u.id)}
                <div class="listItem">
                    <BarItem
                        compData={{
                            kind: "otherUsr",
                            thingId: u.id,
                            maybeMakeProps() {
                                let found = appState.value.friendsList.findLast(
                                    (fr) => fr.id == u.id,
                                );
                                if (found) return { thing: found };
                                return undefined;
                            },
                        }}
                        title={u.displayName}
                    ></BarItem>
                </div>
            {/each}
        </div>
    {/if}
    <h4>User search</h4>
    <SimpleForm
        buttonLabel="Search"
        inputs={[{ itype: "text" }]}
        onSubmit={userSearch}
    ></SimpleForm>
    {#if searchResult}
        <h4>Search results</h4>
        <div class="listOfBarItems">
            <!-- {#each appState.value.uiUserList as u (u.id)} -->
            <div class="listItem">
                <BarItem
                    compData={{
                        kind: "otherUsr",
                        thingId: searchResult.id,
                        maybeMakeProps() {
                            console.log("making search result props");
                            console.log(JSON.stringify(searchResult));
                            return { thing: searchResult };
                        },
                    }}
                    title={searchResult.displayName}
                ></BarItem>
            </div>
            <!-- {/each} -->
        </div>
    {/if}
    <!-- {#if searchResult}
        <br />
        <BarItem
            compData={{
                kind: "otherUsr",
                thingId: searchResult.id,
            }}
            title={searchResult.displayName}
        ></BarItem>
    {/if} -->
</div>

<style>
    .outer {
    }
</style>
