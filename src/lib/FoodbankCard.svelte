<script>
  const { fb, isOpen, onRequest } = $props();

  const dayMap = {
    M: "Mon",
    T: "Tue",
    W: "Wed",
    Th: "Thu",
    F: "Fri",
    Sa: "Sat",
    Su: "Sun",
  };
  // AI GENERATED FUNCTIONS TO HELP PARSE FOOD BANK HOURS
  const expandDays = (token) => {
    const out = [];
    let i = 0;
    while (i < token.length) {
      const two = token.slice(i, i + 2);
      if (two === "Th" || two === "Su" || two === "Sa") {
        out.push(dayMap[two] ?? two);
        i += 2;
      } else {
        const one = token[i];
        out.push(dayMap[one] ?? one);
        i += 1;
      }
    }
    return out;
  };

  const to12h = (time) => {
    if (!time.includes(":")) {
      const h = Number(time) || 0;
      const hr = h % 12 === 0 ? 12 : h % 12;
      const mer = h >= 12 ? "PM" : "AM";
      return `${hr}:00 ${mer}`;
    }
    const [hStr, mStr] = time.split(":");
    const h = Number(hStr) || 0;
    const m = mStr.padStart(2, "0");
    const hr = h % 12 === 0 ? 12 : h % 12;
    const mer = h >= 12 ? "PM" : "AM";
    return `${hr}:${m} ${mer}`;
  };

  const formatHours = (hours) => {
    if (!hours) return "Hours not listed";
    return hours
      .split("|")
      .map((segment) => {
        const trimmed = segment.trim();
        const firstSpace = trimmed.indexOf(" ");
        if (firstSpace === -1) return trimmed;
        const dayToken = trimmed.slice(0, firstSpace);
        const timePart = trimmed.slice(firstSpace + 1).trim();
        const days = expandDays(dayToken);

        const timeRange = timePart.replace(
          /(\d{1,2}:?\d{0,2})(?:[–-](\d{1,2}:?\d{0,2}))/g,
          (_, a, b) => `${to12h(a)}–${to12h(b)}`
        );

        const label = days.length ? days.join(", ") : dayToken;
        return `${label} · ${timeRange}`;
      })
      .join(" / ");
  };
  // FINISH AI GENERATED FUNCTIONS
  let hoursDisplay = $derived(formatHours(fb.hours));
</script>

<article class="card">
  <div class="top">
    <div class="content">
      <h4>{fb.name}</h4>
      <div class="desc">{fb.description || "Pantry & meals available"}</div>
      <div class="meta">
        {fb.address}{fb.distance ? ` • ${fb.distance}` : ""}
      </div>
      <div class="meta hours">{hoursDisplay}</div>
    </div>
  </div>
  <div class="actions">
    <button onclick={() => onRequest()}>
      {`${isOpen ? "Request" : "Schedule"} Delivery`}
    </button>
  </div>
</article>

<style>
  .card {
    background: white;
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    box-shadow: 0 10px 24px rgba(20, 20, 30, 0.05);
    border: 1px solid #e5e7eb;
    height: 100%;
    width: 100%;
    box-sizing: border-box;
  }
  .top {
    display: flex;
    flex-direction: column;
    gap: 0;
    align-items: center;
    text-align: center;
  }
  .content {
    width: 100%;
  }
  h4 {
    margin: 0 0 0.2rem 0;
    font-size: 1rem;
  }
  .desc {
    margin: 0 0 0.4rem 0;
    color: #444;
    font-size: 0.92rem;
  }
  .meta {
    font-size: 0.82rem;
    color: #555;
    line-height: 1.3;
  }
  .meta.hours {
    color: #334155;
    font-weight: 600;
  }
  .actions {
    margin-top: auto;
  }
  .actions button {
    width: 100%;
    background: #0f1724;
    color: white;
    border: none;
    padding: 0.55rem 0.7rem;
    border-radius: 8px;
    cursor: pointer;
  }
</style>
