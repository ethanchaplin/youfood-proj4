<script lang="ts">
  import Header from "./lib/Header.svelte";
  import FoodbankCard from "./lib/FoodbankCard.svelte";
  import type { Foodbank, FoodItem } from "./lib/data";
  import { foodbanks, addresses, requests } from "./lib/stores";
  import { onDestroy } from "svelte";

  type Step = "list" | "items" | "confirm" | "done";

  let step: Step = $state("list");
  let chosenFoodbank: Foodbank | null = $state(null);
  let selectedFoodbankId: string | null = $state(null);
  let selectedAddressId: string | null = $state(null);
  let quantities: Record<string, number> = $state({});
  let name = $state("");
  let phone = $state("");
  let notes = $state("");
  let confirmationId: string | null = $state(null);
  let orderAhead = $state(false);
  let lastWasScheduled = $state(false);

  const unsubscribe = requests.subscribe(() => {});
  onDestroy(() => unsubscribe());

  const dayTokens = ["Su", "M", "T", "W", "Th", "F", "Sa"]; // Sunday index 0

  const toMinutes = (t: string) => {
    const [hStr, mStr = "0"] = t.split(":");
    const h = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    return h * 60 + m;
  };

  const parseDayTokens = (hours: string) => {
    return hours.match(/Su|Sa|Th|M|T|W|F/g) ?? [];
  };

  const isOpenNow = (hours?: string) => {
    if (!hours) return true;
    const now = new Date();
    const day = dayTokens[now.getDay()];
    const days = parseDayTokens(hours);
    if (!days.includes(day)) return false;

    const segments = hours.split("|");
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return segments.some((seg) => {
      const timeMatch = seg.match(
        /(\d{1,2}:\d{2}|\d{1,2})(?:[–-](\d{1,2}:\d{2}|\d{1,2}))/
      );
      if (!timeMatch) return true; // if we cannot parse, assume open when day matches
      const [, startStr, endStr] = timeMatch;
      const start = toMinutes(startStr);
      const end = toMinutes(endStr);
      return currentMinutes >= start && currentMinutes <= end;
    });
  };

  let openFoodbanks = $derived($foodbanks.filter((fb) => isOpenNow(fb.hours)));
  let closedFoodbanks = $derived(
    $foodbanks.filter((fb) => !isOpenNow(fb.hours))
  );
  $effect(() => {
    selectedAddressId = selectedAddressId ?? $addresses[0]?.id ?? null;
  });

  const viewFoodbank = (id: string) => {
    const fb = $foodbanks.find((f) => f.id === id);
    if (!fb) return;
    chosenFoodbank = fb;
    const next: Record<string, number> = {};
    chosenFoodbank.items.forEach((item) => {
      next[item.id] = quantities[item.id] ?? 0;
    });
    quantities = next;
    selectedFoodbankId = id;
    orderAhead = !isOpenNow(fb.hours);
    step = "items";
  };

  const setQty = (item: FoodItem, value: number) => {
    const clamped = Math.max(0, Math.min(item.max, value));
    quantities[item.id] = clamped;
  };

  const goToConfirm = () => {
    if (!chosenFoodbank) return;
    const items = chosenFoodbank.items
      .map((item) => ({
        itemId: item.id,
        name: item.name,
        quantity: quantities[item.id] ?? 0,
      }))
      .filter((i) => i.quantity > 0);

    if (items.length === 0) {
      alert("Select at least one item.");
      return;
    }

    step = "confirm";
  };

  const submitOrder = () => {
    if (!chosenFoodbank) return;
    const address =
      $addresses.find((a) => a.id === selectedAddressId) ?? $addresses[0];
    if (!address) {
      alert("Please add an address.");
      return;
    }

    const items = chosenFoodbank.items
      .map((item) => ({
        itemId: item.id,
        name: item.name,
        quantity: quantities[item.id] ?? 0,
      }))
      .filter((i) => i.quantity > 0);

    const now = new Date();
    const status = orderAhead ? "scheduled" : "pending";
    const rec = {
      id: String(Date.now()) + Math.floor(Math.random() * 1000),
      foodbankId: chosenFoodbank.id,
      foodbankName: chosenFoodbank.name,
      name: name || "Anonymous",
      phone,
      addressId: address.id,
      addressLabel: address.label,
      addressFull: `${address.line1}, ${address.city}`,
      notes,
      items,
      createdAt: now.toISOString(),
      status,
      scheduledFor: orderAhead ? "When pantry opens" : undefined,
    };

    requests.update((r) => [rec, ...r]);
    confirmationId = rec.id;
    lastWasScheduled = orderAhead;
    step = "done";
  };

  const resetFlow = () => {
    step = "list";
    chosenFoodbank = null;
    selectedFoodbankId = null;
    quantities = {};
    notes = "";
    name = "";
    phone = "";
    confirmationId = null;
    orderAhead = false;
    lastWasScheduled = false;
  };

  const addressSummary = (id: string | null) => {
    const a = $addresses.find((addr) => addr.id === id);
    if (!a) return "Select an address";
    return `${a.label}: ${a.line1}, ${a.city}${a.notes ? " • " + a.notes : ""}`;
  };
</script>

<Header clickLogo={() => resetFlow()} />

<main class="page">
  <section class="hero">
    <div>
      <p class="eyebrow">Food delivery made simple</p>
      <h1>YouFood — find an open pantry and request what you need</h1>
      <p class="lede">
        Pick an open pantry, choose your items, confirm your drop-off address,
        and get a quick confirmation.
      </p>
    </div>
  </section>

  {#if step === "list"}
    <section class="panel">
      <header class="panel-head">
        <div>
          <div class="eyebrow">Open now</div>
          <h3>Available pantries</h3>
        </div>
        <div class="meta">
          {openFoodbanks.length} open • {$foodbanks.length} total
        </div>
      </header>
      {#if openFoodbanks.length === 0}
        <p class="muted">None open right now based on the listed hours.</p>
      {:else}
        <div class="grid">
          {#each openFoodbanks as fb}
            <FoodbankCard
              {fb}
              isOpen={true}
              onRequest={() => viewFoodbank("fb-8")}
            />
          {/each}
        </div>
      {/if}
    </section>

    <section class="panel subtle">
      <header class="panel-head">
        <div>
          <div class="eyebrow">Order ahead</div>
          <h3>Closed pantries (schedule for delivery on opening)</h3>
        </div>
        <div class="meta">{closedFoodbanks.length} closed</div>
      </header>
      {#if closedFoodbanks.length === 0}
        <p class="muted">All pantries appear open right now.</p>
      {:else}
        <div class="grid">
          {#each closedFoodbanks as fb}
            <FoodbankCard
              {fb}
              isOpen={false}
              onRequest={() => viewFoodbank(fb.id)}
            />
          {/each}
        </div>
      {/if}
    </section>
  {:else if step === "items" && chosenFoodbank}
    <section class="panel">
      <header class="panel-head items-head center-header">
        <div>
          <div class="eyebrow">Step 1 of 3</div>
          <h3>{chosenFoodbank.name}</h3>
          <div class="meta">
            {chosenFoodbank.address} • {chosenFoodbank.hours}
          </div>
          {#if orderAhead}
            <div class="badge warn">
              Pantry is closed — this request will queue until it opens.
            </div>
          {/if}
        </div>
        <button class="ghost" onclick={resetFlow}>Change pantry</button>
      </header>
      <div class="items-grid">
        {#each chosenFoodbank.items as item}
          <div class="item-card">
            <div class="item-name">{item.name}</div>
            <div class="item-max">Max {item.max}</div>
            <div class="qty">
              <button
                type="button"
                onclick={() => setQty(item, (quantities[item.id] ?? 0) - 1)}
                >-</button
              >
              <input
                type="number"
                min="0"
                max={item.max}
                value={quantities[item.id] ?? 0}
                onchange={(e) => setQty(item, Number(e.target.value))}
              />
              <button
                type="button"
                onclick={() => setQty(item, (quantities[item.id] ?? 0) + 1)}
                >+</button
              >
            </div>
          </div>
        {/each}
      </div>
      <div class="actions">
        <button class="ghost" onclick={resetFlow}>Back</button>
        <button class="primary" onclick={goToConfirm}>Next: Confirm</button>
      </div>
    </section>
  {:else if step === "confirm" && chosenFoodbank}
    <section class="panel">
      <header class="panel-head center-header">
        <div>
          <div class="eyebrow">Step 2 of 3</div>
          <h3>Confirm details</h3>
          <div class="meta">{chosenFoodbank.name}</div>
          {#if orderAhead}
            <div class="badge warn">Will be sent when pantry opens</div>
          {/if}
        </div>
      </header>

      <div class="form-section">
        <div class="form-group">
          <div class="label">Delivery address</div>
          <select bind:value={selectedAddressId}>
            {#each $addresses as a}
              <option value={a.id}>{a.label} — {a.line1}</option>
            {/each}
          </select>
          <div class="meta">{addressSummary(selectedAddressId)}</div>
        </div>
        <div class="form-group">
          <div class="label">Contact</div>
          <input bind:value={name} placeholder="Your name (optional)" />
          <input bind:value={phone} placeholder="Phone (optional)" />
        </div>
        <div class="form-group">
          <div class="label">Notes</div>
          <textarea
            rows={3}
            bind:value={notes}
            placeholder="Dietary or access notes"
          />
        </div>
      </div>

      <div class="summary">
        <div class="label">Items</div>
        <div class="items">
          {#each Object.entries(quantities).filter(([, qty]) => qty > 0) as [itemId, qty]}
            {#each chosenFoodbank.items.filter((it) => it.id === itemId) as item}
              <span class="pill">{item.name} × {qty}</span>
            {/each}
          {/each}
        </div>
      </div>

      <div class="actions">
        <button class="ghost" onclick={() => (step = "items")}>Back</button>
        <button class="primary" onclick={submitOrder}>Place request</button>
      </div>
    </section>
  {:else if step === "done"}
    <section class="panel">
      <div class="center">
        <div class="eyebrow">Step 3 of 3</div>
        <h3>Request submitted</h3>
        <p class="lede">
          {#if lastWasScheduled}
            We'll queue this order and release it when the pantry opens.
          {:else}
            We've recorded your request. A volunteer will pick it up and deliver
            to your selected address.
          {/if}
        </p>
        {#if confirmationId}
          <div class="confirmation">Confirmation #{confirmationId}</div>
        {/if}
        <div class="actions center">
          <button class="primary" onclick={resetFlow}>Back to home</button>
        </div>
      </div>
    </section>
  {/if}
</main>

<style>
  :global(body) {
    font-family:
      system-ui,
      -apple-system,
      "Segoe UI",
      Roboto,
      "Helvetica Neue",
      Arial;
    margin: 0;
    color: #111;
    background: #f7f7f8;
  }
  .page {
    max-width: 1100px;
    margin: 0 auto 4rem;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .hero {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    box-shadow: 0 10px 30px rgba(10, 20, 40, 0.06);
  }
  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.8rem;
    color: #5b6b7a;
    margin: 0 0 0.35rem 0;
  }
  h1 {
    margin: 0 0 0.35rem 0;
    font-size: 1.6rem;
  }
  .lede {
    margin: 0;
    color: #4a5563;
    max-width: 640px;
    text-align: center;
  }
  .panel {
    background: white;
    border-radius: 12px;
    padding: 1rem 1.25rem 1.5rem;
    box-shadow: 0 10px 30px rgba(10, 20, 40, 0.05);
  }
  .panel.subtle {
    background: #f9fafb;
    box-shadow: none;
  }
  .panel-head {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    text-align: center;
  }
  .panel-head h3 {
    margin: 0.1rem 0;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.6rem;
    margin-top: 1rem;
    align-items: stretch;
  }

  .items-grid {
    margin-top: 1rem;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
  .item-card {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 1rem;
    text-align: center;
  }
  .item-name {
    font-weight: 700;
    margin: 0;
  }
  .item-max {
    font-size: 0.85rem;
    color: #64748b;
    margin: 0.1rem 0 0 0;
  }
  .qty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
  }
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type="number"] {
    -moz-appearance: textfield;
  }
  .qty input {
    width: 30px;
    text-align: center;
    padding: 0.4rem;
    border-radius: 8px;
    border: 1px solid #d6d9df;
  }
  .qty button {
    border: 1px solid #d6d9df;
    background: white;
    border-radius: 8px;
    padding: 0.35rem 0.6rem;
    cursor: pointer;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
    margin-top: 1rem;
  }
  .actions.center {
    justify-content: center;
  }
  .primary {
    background: #0f172a;
    color: white;
    border: none;
    padding: 0.65rem 1rem;
    border-radius: 10px;
    cursor: pointer;
  }
  .ghost {
    background: transparent;
    color: #0f172a;
    border: 1px solid #cbd5e1;
    padding: 0.6rem 0.9rem;
    border-radius: 10px;
    cursor: pointer;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-top: 1.5rem;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .label {
    font-weight: 700;
    font-size: 0.95rem;
    margin-bottom: 0.25rem;
  }
  select,
  input,
  textarea {
    width: 100%;
    padding: 0.5rem;
    border-radius: 8px;
    border: 1px solid #d8dce3;
  }
  textarea {
    resize: vertical;
  }

  .summary {
    margin-top: 1rem;
  }
  .summary .items {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .pill {
    background: #eef2ff;
    color: #1f2a44;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    font-size: 0.82rem;
  }
  .badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 8px;
    font-size: 0.85rem;
  }
  .badge.warn {
    background: #fff4e6;
    color: #9a3412;
    border: 1px solid #fed7aa;
  }
  .meta {
    color: #555;
    font-size: 0.9rem;
  }
  .muted {
    color: #666;
  }

  .confirmation {
    margin: 0.75rem 0;
    padding: 0.75rem;
    background: #ecfeff;
    border: 1px solid #cffafe;
    border-radius: 10px;
    text-align: center;
  }
  .center {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  .center-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
</style>
