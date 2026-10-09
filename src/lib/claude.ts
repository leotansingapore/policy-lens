import { createAnthropic } from "@ai-sdk/anthropic";

export const CLAUDE_MODEL = "claude-sonnet-5-5";

// Sonnet 5.5 returns a 400 on forced tool_choice and on any temperature, and
// ai v4 sends both: generateObject forces its tool, and every call defaults
// temperature to 0. Drop the sampling params and send tool_choice "auto" plus a
// line naming the tool; generateObject still throws if no tool call comes back.
// Thinking is always on in 5.5, so effort is pinned low to keep latency and
// spend near the old no-thinking calls.
// shortcut: rewrites requests for an old SDK; delete once on ai v5+ / @ai-sdk/anthropic v2+.
export const anthropic = createAnthropic({
  fetch: (url, init) => {
    if (typeof init?.body !== "string") return fetch(url, init);
    const body = JSON.parse(init.body);
    delete body.temperature;
    delete body.top_p;
    delete body.top_k;
    if (body.tool_choice?.type === "tool") {
      const name = body.tool_choice.name;
      body.tool_choice = { type: "auto" };
      body.system = [
        ...(body.system ?? []),
        { type: "text", text: `Give your answer by calling the ${name} tool.` },
      ];
    }
    body.output_config = { ...body.output_config, effort: "low" };
    return fetch(url, { ...init, body: JSON.stringify(body) });
  },
});
