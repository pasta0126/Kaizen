# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Kaizen is a new, currently empty repository (no source code yet).

## Workflow: OpenSpec (spec-driven development)

This repo uses [OpenSpec](https://github.com/Fission-AI/OpenSpec) (`@fission-ai/openspec`) to manage feature work as proposals with generated artifacts, applied only after explicit approval. Config lives in `openspec/config.yaml` (schema: `spec-driven`).

Use the `/opsx:*` slash commands (backed by `.claude/skills/openspec-*` and `.claude/commands/opsx/*.md`) instead of ad hoc planning:

- `/opsx:propose "<description>"` — create a change and generate its artifacts (`proposal.md`, `specs/<capability>/spec.md`, `design.md`, `tasks.md`). Planning only — never edit project code during this step.
- `/opsx:explore` — investigate/spike before proposing.
- `/opsx:update` — revise an existing change's artifacts.
- `/opsx:apply` — implement a change once its artifacts are approved.
- `/opsx:archive` — archive a completed change and fold its spec deltas into the main specs.
- `/opsx:sync` — sync specs.

Key rules:
- Do not start implementation in the same turn as `/opsx:propose`; wait for an explicit user request to apply.
- If the work targets a registered OpenSpec "store" (a separate OpenSpec repo), discover it via `openspec store list --json` and pass `--store <id>` consistently to subsequent `openspec` CLI calls.
- Project-specific context, per-artifact rules, and operation guidance can be added to `openspec/config.yaml` (currently unset/default).
