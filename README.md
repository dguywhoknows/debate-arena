# debate-simulator

[![tests](https://github.com/dguywhoknows/debate-simulator/actions/workflows/tests.yml/badge.svg)](https://github.com/dguywhoknows/debate-simulator/actions/workflows/tests.yml)

Two AI personas debate any motion in parliamentary format while an AI adjudicator scores the clash.

Live: https://dguywhoknows.github.io/debate-simulator/

## Overview

Pick a motion, give each side a persona and a speaking style, and watch a full debate unfold: openings, rebuttal rounds and closings, streamed token by token. Every speaker sees the full transcript, so rebuttals respond to what was actually said. A separate judge model then scores both sides against a rubric and maps the key clashes. Meanwhile the app runs its own text analysis on each side's speeches.

## Pages

- **Debate**
- **Settings**

## Features

- Configurable personas, style (formal / spicy / Socratic / ELI12) and number of rebuttal rounds
- Live streaming speeches with full-transcript context for real rebuttals
- AI judge returns structured JSON: rubric scores, clash map, margin, advice
- SVG radar chart comparing both sides on logic, evidence, rebuttal and delivery
- Local analytics: Flesch readability, evidence markers, hedge words, direct call-outs
- Export the full debate and verdict as Markdown
- You-vs-AI mode: argue either side yourself with a 2-minute speech timer while the AI rebuts your actual points
- Oxford-style audience vote: record your opinion before and after; the side that moves the most minds wins the room
- AI fact-checker that extracts factual claims, rates each one and computes a credibility score per side
- Debate library: every finished debate is saved locally and can be reopened

## How it works

LLM calls are used for:

- One streamed chat completion per speech, each with its own role-play system prompt
- A low-temperature, JSON-mode adjudicator call that scores the transcript
- Claim extraction + verification pass (JSON) feeding a local credibility score

Everything else (readability scoring, syllable counting, rhetoric metrics, radar chart rendering, export) runs locally in the browser.

## Getting started

No build step and no dependencies. Serve the folder with any static server:

```bash
git clone https://github.com/dguywhoknows/debate-simulator.git
cd debate-simulator
python -m http.server 8000
```

Then open http://localhost:8000.

`index.html` is the public home page, `login.html` handles accounts and `app.html` is the app.

### Telling the app what to do

Every page has an **Ask AI** box (Ctrl/Cmd+K). Type a request in plain words and the model plans a sequence of
calls to the app's own functions, runs them and reports back. The **Instructions** tab stores standing
preferences that are added to every AI request the app makes.

### Configuration

`src/lib/config.js` is generated from the build settings: the Supabase project (accounts) and the AI proxy URL.
Signed-in users get the built-in AI through the proxy, which keeps the provider key as a server-side secret.
Without those settings the app runs for guests, in demo mode, or with a personal [Groq](https://console.groq.com/keys)
or [OpenRouter](https://openrouter.ai/keys) key entered under **Settings → Model provider** (stored only in this
browser and sent only to that provider).

## Testing

`src/core.js` holds the app's logic as pure functions and is covered by 12 unit tests.

```bash
node tests/run-node.js        # CI runs this on every push
```

Or open `tests/index.html` in a browser ([live](https://dguywhoknows.github.io/debate-simulator/tests/)).

## Project structure

```
index.html           public home page (generated)
login.html           sign-in and sign-up (generated)
app.html             the app: markup for every page
src/app.js           UI, page wiring and event handlers
src/core.js          pure logic with no DOM access (unit-tested)
src/demo.js          sample responses used when no API key is configured
src/lib/ai.js        LLM client: Groq / OpenRouter, streaming, JSON mode, retries
src/lib/dom.js       DOM helpers, namespaced storage, markdown renderer
src/lib/router.js    hash router and the Settings page
src/lib/copilot.js   AI command box that drives the app's own functions
src/lib/auth.js      accounts (Supabase Auth) and the sign-in gate
styles/base.css      design tokens and shared components
styles/app.css       app-specific styles
tests/               unit tests (browser runner + Node runner for CI)
```

## Tech

- Streaming SSE parsing
- Hand-rolled SVG radar chart
- Flesch reading-ease with heuristic syllable counter
- Pure logic in core.js with a unit-test suite run in CI and in the browser
- Vanilla JavaScript, no framework or bundler
- Deployed with GitHub Pages

## License

MIT
