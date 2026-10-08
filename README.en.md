[Русский](README.md) · **English**

# Jmix Demo Runbook

**Open it online: [fedoseew.github.io/jmix-demo-runbook](https://fedoseew.github.io/jmix-demo-runbook/)**

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-2ea44f.svg)](https://fedoseew.github.io/jmix-demo-runbook/)

An offline presenter runbook for two live [Jmix](https://www.jmix.io/) demos. **Demo A, "AI × Jmix"** (73 minutes, 80 with the optional block) is about AI while developing with Jmix and AI inside Jmix applications. **Demo B, "Jmix from scratch"** (45 minutes, 55 with the optional block) goes from an empty project to an app built from an existing database. One HTML page shows the audience slides on a Jmix background and gives the presenter a console with the agenda, a timer, notes, and step-by-step actions with copyable commands and prompts. The demos and the interface are in Russian; the guides are in both languages.

For people from the meetup who want to revisit a demo, repeat it on public repositories and stands ([what you can try today](docs/guide/en/demos.md#what-you-can-try-today)), or build their own runbook on top of it.

<p>
  <img src="docs/images/stage.jpg" alt="Stage: the A4 slide for the audience" width="49%">
  <img src="docs/images/console.jpg" alt="Presenter console on A4 with a step selected" width="49%">
</p>

## Quick start

The runbook is keyboard-driven; on a phone you only see the holding slide. For what each block shows, see [Demos A and B](docs/guide/en/demos.md).

Open the [site](https://fedoseew.github.io/jmix-demo-runbook/), or work offline:

```bash
git clone https://github.com/Fedoseew/jmix-demo-runbook.git
open jmix-demo-runbook/index.html   # Windows: start, Linux: xdg-open
```

No server, build or internet needed. The essential keys (all of them: press `?`, or see the [guide](docs/guide/en/usage.md#keys)):

| Key | Action |
|---|---|
| `←` / `→` | previous / next block |
| `P` | presenter console in a new window (second screen) |
| `N` | presenter dock at the bottom of the stage (mirrored projector) |
| `T` | block timer start / pause |
| `J` / `K` | next / previous step in the console or the dock |

## Documentation

| Guide | About |
|---|---|
| [Running a demo](docs/guide/en/usage.md) | second screen or mirror, every key, the timer, steps and the short version, pre-flight, troubleshooting |
| [Demos A and B](docs/guide/en/demos.md) | audience, goals, timing with optional blocks and exit points, what each block shows, what to prepare |
| [Editing the content](docs/guide/en/content.md) | the `content.js` schema, block fields, conventions, tests, your own runbook, publishing on GitHub Pages |
| [Architecture](docs/guide/en/architecture.md) | files, the state model, two-window sync, tests, screenshot and smoke-test tools |

Also: [open questions for the rehearsal (partly in Russian)](docs/open-questions.md) · [spec (Russian)](docs/superpowers/specs/2026-10-07-jmix-demo-runbook-design.md) · [review 2026-10-08 (Russian)](docs/review-2026-10-08.md) · [instructions for AI agents](AGENTS.md)

## Repository layout

```text
jmix-demo-runbook/
├── index.html              markup, CSS, SVG sprite (logo, icons, QR), meta and Open Graph tags
├── content.js              content of both demos: slides, notes, steps (globalThis.DEMOS)
├── core.js                 pure logic without the DOM: state, timer, steps (globalThis.Runbook)
├── app.js                  the DOM: stage, console, mirror dock, keys, window sync
├── test/                   node --test: content, logic, markup, page loading
├── tools/                  shot.mjs for screenshots, smoke.mjs for a two-window smoke test, browser.mjs, the shared Playwright launcher
├── docs/
│   ├── guide/ru, guide/en  guides
│   ├── images/             screenshots for the READMEs, the guides and link previews
│   ├── open-questions.md   what to check at rehearsal
│   ├── review-2026-10-08.md  independent review
│   └── superpowers/        spec and implementation plans (history)
├── AGENTS.md               instructions for AI agents; CLAUDE.md points to it
├── .agents/skills/         agent skills (linked from .claude/skills)
├── .nojekyll               GitHub Pages serves files as they are
└── LICENSE                 Apache License 2.0
```

## Useful links

| Group | Link | What it is |
|---|---|---|
| Runbook | [fedoseew.github.io/jmix-demo-runbook](https://fedoseew.github.io/jmix-demo-runbook/) | this runbook online |
| | [Fedoseew/jmix-demo-runbook](https://github.com/Fedoseew/jmix-demo-runbook) | sources, issues |
| Demo repositories | [jmix-agent-toolkit](https://github.com/jmix-framework/jmix-agent-toolkit) | skills, guidelines and tools for AI coding agents (A1, A2, B4) |
| | [jmix-cli](https://github.com/jmix-framework/jmix-cli) | create projects from the terminal: wizard and `--non-interactive` (A3, B1) |
| | [jmix-crm](https://github.com/jmix-framework/jmix-crm) | B2B CRM with AI features, the stand for A4–A6 |
| | [jmix-crm, branch 50-dynmodel-ai-agent](https://github.com/jmix-framework/jmix-crm/tree/50-dynmodel-ai-agent) | the Dynamic Model AI stand (A6) |
| | [demo.jmix.io/b2b-crm](https://demo.jmix.io/b2b-crm/login) | the same CRM online |
| Documentation | [docs.jmix.io](https://docs.jmix.io/jmix/) · [Tutorial](https://docs.jmix.io/jmix/tutorial/index.html) | Jmix documentation and the step-by-step tutorial, the place to start |
| | [AI Tools](https://docs.jmix.io/jmix/ai-tools/index.html) · [getting started](https://docs.jmix.io/jmix/ai-tools/getting-started.html) | AI Tools add-on: an LLM assistant inside the app answers questions over data (CRM AI, A4) |
| | [Jmix AI in Studio](https://docs.jmix.io/jmix/studio/ai-assistant.html) · [Coding assistance](https://docs.jmix.io/jmix/studio/coding-assistance.html) | docs chat (A3) and Ask AI about code (A3+); Studio inspections and quick-fixes that catch agent mistakes (A2) |
| | [Dynamic Model](https://docs.jmix.io/jmix/dyn-model/index.html) | new entities and attributes in a running app without code or restart (A6) |
| | [Reports](https://docs.jmix.io/jmix/reports/index.html) | Reports add-on: template-based reports; AI-generated JPQL is in 3.1 preview (A5) |
| | [Reverse engineering](https://docs.jmix.io/jmix/studio/reverse-engineering.html) · [Data stores](https://docs.jmix.io/jmix/studio/data-stores.html) | a model from an existing database, and data stores (B2) |
| | [Security](https://docs.jmix.io/jmix/security/index.html) | roles and row-level policies (A4, B3) |
| Community | [forum.jmix.io](https://forum.jmix.io/) | forum: questions and answers |
| | [Jmix Studio](https://plugins.jetbrains.com/plugin/14340-jmix) | the IntelliJ IDEA plugin |

<details>
<summary>More links: sources, AI, samples, migration, community</summary>

| Group | Link | What it is |
|---|---|---|
| Sources | [jmix-framework/jmix](https://github.com/jmix-framework/jmix) | Jmix framework sources |
| | [jmix-docs](https://github.com/jmix-framework/jmix-docs) | Jmix 3+ documentation sources |
| | [What's new](https://docs.jmix.io/jmix/whats-new/index.html) | what changed in each version |
| AI | [jmix-mcp-docs](https://github.com/jmix-framework/jmix-mcp-docs) | remote MCP server to search Jmix docs and samples |
| | [ai-assistant.jmix.io](https://ai-assistant.jmix.io/) | Jmix AI in the browser |
| | [jmix-ai-backend](https://github.com/jmix-framework/jmix-ai-backend) | backend service for Jmix AI |
| Samples | [jmix-ui-samples](https://github.com/jmix-framework/jmix-ui-samples) · [online](https://demo.jmix.io/ui-samples/) | UI component samples |
| | [jmix-samples-2](https://github.com/jmix-framework/jmix-samples-2) | solutions to typical problems |
| | [jmix-bookstore](https://github.com/jmix-framework/jmix-bookstore) | a retail bookstore app |
| | [jmix-petclinic](https://github.com/jmix-framework/jmix-petclinic) | Petclinic on Jmix |
| | [jmix-onboarding](https://github.com/jmix-framework/jmix-onboarding) | the app from the Tutorial |
| | [jmix-windturbines](https://github.com/jmix-framework/jmix-windturbines) | a mobile-first field-maintenance app for wind turbines |
| | [jmix-commercial-addons-demo](https://github.com/jmix-framework/jmix-commercial-addons-demo) | commercial add-ons demo |
| | [demo.jmix.io](https://demo.jmix.io/) | all online demos |
| Migration and tools | [jmix-migration-from-v1](https://github.com/jmix-framework/jmix-migration-from-v1) | template for AI-assisted migration from Jmix 1.x to 2.x |
| | [jmix-migration-from-cuba-platform](https://github.com/jmix-framework/jmix-migration-from-cuba-platform) | template for AI-assisted migration from CUBA Platform 7.2 to Jmix 2.x |
| | [jmix-masquerade](https://github.com/jmix-framework/jmix-masquerade) | UI testing library |
| | [jmix-dependencies-tool](https://github.com/jmix-framework/jmix-dependencies-tool) | collects Jmix dependencies for isolated environments without internet |
| Community | [jmix.io](https://www.jmix.io/) | the Jmix website |
| | [Marketplace](https://www.jmix.io/marketplace/) | add-ons |
| | [Training](https://www.jmix.io/training/) | courses for teams |
| | [YouTube](https://www.youtube.com/channel/UCEmWc8OwhgHnAV7vVVxtglQ) | videos and webinars |
| | [github.com/jmix-framework](https://github.com/jmix-framework) · [github.com/jmix-projects](https://github.com/jmix-projects) | all repositories; jmix-projects holds older samples and demos |

</details>

## License and contributing

Code and text are under the [Apache License 2.0](LICENSE). Use the runbook as a base for your own demo: fork it, write your own `content.js`, swap the colours and the QR code. The steps are in [Editing the content](docs/guide/en/content.md#your-own-runbook-from-this-one). Found a bug or have an idea? Open an [issue](https://github.com/Fedoseew/jmix-demo-runbook/issues) or a pull request; run `node --test` before a PR and use conventional commit messages.
