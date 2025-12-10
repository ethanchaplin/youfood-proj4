<script lang="ts">
  const { clickLogo } = $props();
</script>

<header class="site-header">
  <div class="brand" onclick={clickLogo}>
    <div class="logo">🍽</div>
    <div>
      <div class="title">YouFood</div>
      <div class="subtitle">Connecting foodbanks to volunteers</div>
    </div>
  </div>
  <div class="actions"></div>
</header>

<style>
  .site-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
    background: white;
    box-shadow: 0 2px 6px rgba(10, 10, 15, 0.04);
  }
  .brand {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    cursor: pointer;
  }
  .title {
    font-weight: 700;
    font-size: 1.05rem;
  }
  .subtitle {
    font-size: 0.78rem;
    color: #666;
  }
  .logo {
    flex: 0 0 auto;
    background-color: rgb(223, 100, 125);
    width: 3rem;
    height: 3rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 2rem;
    color: white;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
</style>
