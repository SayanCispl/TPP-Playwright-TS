---
name: playwright-ai-agent
description: >-
  Workflow guide for using the Playwright MCP server as an AI browser agent in
  the pharmacy-playwright-ts project. Covers starting the MCP server, driving
  the browser via MCP tool calls, and generating test code from observed
  actions. Activate when asked to explore, record, or automate the pharmacy
  site interactively using AI.
---

# Playwright AI Agent — pharmacy-playwright-ts

The Playwright MCP server exposes browser control as structured MCP tool calls.
This lets AI agents (Antigravity, Claude, Cursor, Copilot) navigate, click,
type, and snapshot pages using the same accessibility tree that Playwright tests
use — no pixel-based vision needed.

---

## 1. Starting the MCP Server

### Option A — SSE server (for remote / multi-client use)

Start the server (it stays running):
```bash
npm run mcp:server
# which is: playwright-mcp --port 3001
```

The MCP endpoint will be available at:
```
http://localhost:3001/mcp
```

To use the project config file:
```bash
node_modules/.bin/playwright-mcp --config mcp.config.json --port 3001
```

### Option B — stdio (for Antigravity IDE / local AI clients)

The workspace `.agents/mcp_config.json` registers the server automatically.
Antigravity IDE will start the process on demand when it needs to use a
Playwright MCP tool. **No manual startup needed.**

---

## 2. Connecting an AI Client

### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "playwright": {
      "command": "node",
      "args": ["./node_modules/@playwright/mcp/cli.js", "--config", "mcp.config.json"],
      "cwd": "/Users/codeclouds-sayan/Downloads/pharmacy-playwright-ts"
    }
  }
}
```

### Cursor / Windsurf / VS Code (`.cursor/mcp.json` or equivalent)
```json
{
  "mcpServers": {
    "playwright": {
      "url": "http://localhost:3001/mcp"
    }
  }
}
```
> Start the SSE server first with `npm run mcp:server`.

---

## 3. Key MCP Tools Available

Once connected the agent can call these tools:

| Tool | What it does |
|---|---|
| `browser_navigate` | Navigate to a URL |
| `browser_snapshot` | Return accessibility tree snapshot of the current page |
| `browser_click` | Click an element by ref from a snapshot |
| `browser_type` | Type text into a focused input |
| `browser_fill` | Fill an input field |
| `browser_select_option` | Select a dropdown option |
| `browser_check` / `browser_uncheck` | Toggle checkboxes |
| `browser_screenshot` | Capture a screenshot |
| `browser_wait_for` | Wait for a condition |
| `browser_evaluate` | Run JavaScript in the page |
| `browser_network_requests` | Inspect network traffic |
| `browser_console_messages` | Read browser console output |
| `browser_close` | Close the browser |

---

## 4. Typical AI Agent Workflow

### Explore a page and generate a locator

1. Tell the agent: *"Navigate to the Tirzepatide product page and snapshot it"*
2. Agent calls `browser_navigate` → `browser_snapshot`
3. Inspect the accessibility tree to find stable selectors
4. Agent suggests locators for use in `*.page.ts` Page Objects

### Record a new user flow

1. Tell the agent: *"Walk through the Semaglutide checkout and record the steps"*
2. Agent navigates, snapshots, clicks through each step
3. Use `--codegen typescript` flag to auto-generate Playwright TypeScript code:
   ```bash
   node_modules/.bin/playwright-mcp --config mcp.config.json --codegen typescript --port 3001
   ```

### Debug a failing test interactively

1. Start MCP server in headed mode (default in `mcp.config.json`)
2. Tell the agent: *"Reproduce the checkout failure — navigate to the product page and try to add to cart"*
3. Agent performs the steps and snapshots the DOM at the failure point
4. Use `browser_console_messages` and `browser_network_requests` to diagnose

---

## 5. Generating TypeScript Test Code

The MCP server can emit TypeScript test code for every action it takes.
Start the server with `--codegen typescript`:

```bash
node_modules/.bin/playwright-mcp \
  --config mcp.config.json \
  --codegen typescript \
  --port 3001
```

Generated code follows the project's Page Object Model — paste the output into
a new `*.page.ts` method or test spec.

---

## 6. Session Saving

The `mcp.config.json` sets `saveSession: true` and `outputDir: ./reports/mcp-sessions`.
Each AI agent session is saved so you can:

- Replay the session trace in Playwright Trace Viewer:
  ```bash
  npx playwright show-trace reports/mcp-sessions/<session>/trace.zip
  ```
- Review screenshots captured during the session in `reports/mcp-sessions/`

---

## 7. Project Context for the AI Agent

When driving the pharmacy site, provide this context:

| Setting | Value |
|---|---|
| Base URL | `https://the-pharmacy-place.webflow.io` |
| Products | `/product/tirzepatide`, `/product/semaglutide` |
| Questionnaire URL pattern | `/questionnaires?key=<tracking_key>` |
| Checkout page | `/checkout` |
| Thank-you / confirmation | `/order-confirmation?key=<tracking_key>` |
| Patient status options | `New Patient`, `Existing Patient` |
| Default dosage | `Step 1` |

### Ant-bot measures to be aware of

- **Cloudflare Turnstile** is present on the checkout page. The MCP server
  runs a real browser so it will face the real CAPTCHA. Use the `--isolated`
  flag to avoid cached sessions that might be flagged:
  ```bash
  node_modules/.bin/playwright-mcp --config mcp.config.json --isolated
  ```
- The product page hides patient-status controls when `navigator.webdriver`
  is detected. Start the server without `--headless` (default) and avoid
  headless mode for product page interactions.

---

## 8. Integrating MCP Output Back Into Tests

After exploring with the AI agent:

1. **Copy stable selectors** discovered via snapshots into `src/pages/*/` page objects
2. **Paste generated code** (from `--codegen typescript`) as new page object methods
3. **Run `npm run typecheck`** to verify TypeScript validity
4. **Run the smoke suite** to confirm nothing regressed:
   ```bash
   npm run test:smoke
   ```
