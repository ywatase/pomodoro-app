<script>
  import { invoke } from '@tauri-apps/api/core';

  let name = $state('');
  let greetMsg = $state('');

  async function greet(event) {
    event.preventDefault();
    greetMsg = await invoke('greet', { name });
  }
</script>

<main class="container">
  <h1>tomatask</h1>
  <p>ローカル完結のポモドーロタイマー</p>
  <form class="row" onsubmit={greet}>
    <input id="greet-input" placeholder="Enter a name..." bind:value={name} />
    <button type="submit">Greet</button>
  </form>
  <p>{greetMsg}</p>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #1a1a2e;
    color: #eee;
    font-family: 'Segoe UI', system-ui, sans-serif;
  }

  .container {
    margin: 0;
    padding-top: 10vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    gap: 1rem;
  }
</style>
