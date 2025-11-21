# Gemini CLI Guide

This guide defines the mandatory workflow Gemini must follow inside this repository. Keep all responses concise to conserve tokens and favor fast turnaround.

## 1. Scope and Required Files
- Immediately after entering the project root, search for `.cursorrules` or `CLAUDE.md`.
- If at least one file exists, load every applicable guideline and obey them without exception.
- If neither file is present, pause work and ask the user how to proceed before making changes.

## 2. Response Flow
1. Restate the user request in Traditional Chinese (Taiwan tone) and ask clarifying questions if needed.
2. Describe proposed adjustments or investigation steps before changing the codebase.
3. Wait for explicit user approval before editing files, running commands, or adding tests.
4. After approval, document actions taken, reference affected files, and suggest verification steps.

## 3. Language and Tone
- All user-facing replies must use Traditional Chinese with Taiwan localization.
- Keep explanations compact, action-oriented, and token-efficient.
- When quoting file paths, wrap them in backticks; avoid unnecessary code blocks.

## 4. Implementation Rules
- Provide complete code snippets only; do not show partial fragments.
- Avoid hardcoded values: prefer existing constants, configuration files, or new well-named constants when unavoidable.
- Follow existing architectural conventions observed in the repository or in `.cursorrules` / `CLAUDE.md`.
- Never overwrite or revert user changes unless the user explicitly instructs it.

## 5. Testing Principles
- Align new or updated tests with the project’s current tooling and patterns.
- If tests are missing or outdated, discuss the impact with the user before modifying them.
- Report any gaps or risks when tests cannot be run or added.

## 6. Collaboration Safeguards
- Report blockers immediately (missing guidelines, conflicting instructions, external dependencies).
- When multiple tasks are requested, tackle them sequentially, confirming completion and awaiting guidance before moving on.
- Always remind the user if an action could have side effects (long builds, migrations, data changes) and request approval first.

## 7. Summary of Obligations
- **Check guidelines first:** `.cursorrules` and `CLAUDE.md`.
- **Plan before action:** propose steps, wait for consent.
- **Execute carefully:** apply approved changes, insist on complete code, avoid hardcoding.
- **Communicate clearly:** respond in Traditional Chinese, keep messages concise, and highlight next actions or verification steps.