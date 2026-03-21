# Project Guide

## Working style

- Start with a short plan before major changes.
- Use project subagents proactively based on task fit.
- Keep changes small, testable, and easy to explain.
- After changes, summarize what changed and how to run or verify it.

## Delegation rules

- Use founder-product-planner when the request may be solving the wrong problem, when scope is fuzzy, or when we need alternatives before building.
- Use tech-lead-planner after product direction is chosen, or when architecture, data flow, edge cases, security boundaries, deployment concerns, and test strategy need to be defined.
- Use implementation-engineer for concrete coding tasks after the plan is clear.
- Use integration-debugger for installs, configuration, environment variables, tool setup, build failures, runtime errors, deployment issues, and external integrations like Vercel.

## Engineering defaults

- Search for built-in framework/runtime capabilities before adding custom infrastructure.
- Prefer fewer moving parts.
- Make hidden assumptions explicit.
- When meaningful, compare 2-3 approaches before committing.
- If scope is too large, propose a smaller MVP.
- Investigate before fixing.
- Do not defer obvious tests, docs, or edge-case handling when the remaining work is small.

## Design System

Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, border radius, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.
Key rules:

- Accent color is forest green `#2D6A4F` — never blue, never purple
- Prices use Instrument Serif — never Geist for price display
- Elevation data uses Geist Mono
- Background is `#FAFAF8` (warm off-white) — not pure `#FFFFFF`
- Every property card must show: price, beds/baths/sqft, lot size, elevation (ft), prominence score, days on market

## Repo notes

- Dev server: `npm run dev` → http://localhost:3000
- Type check: `npm run type-check`
- Lint: `npm run lint`
- Build: `npm run build`
