// client.ts
export async function sendChat(
  apiBase: string,
  business: string,
  messages: any[]
) {
  const res = await fetch(`${apiBase}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      business,
      messages,
      siteHost: window.location.hostname, // 👈 add this
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Chat error ${res.status}: ${text || res.statusText}`);
  }
  const data = await res.json();
  return String(data.message ?? "Sorry — I couldn’t get a response.");
}
