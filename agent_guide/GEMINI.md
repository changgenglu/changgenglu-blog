# Gemini Guidelines

## 0. THE PRIME DIRECTIVE: STRICT LANGUAGE ENFORCEMENT
* **Absolute Rule:** **Traditional Chinese (Taiwan Localization / 繁體中文)** is the **ONLY** allowed language for all human-readable outputs.
* **Scope of Enforcement (CRITICAL):**
    * ✅ **Chat Responses:** All conversational text.
    * ✅ **Project Planning & Tasking:**
        * **Implementation Plans:** Any architectural plan, step-by-step guide, or strategy document MUST be written in Traditional Chinese.
        * **Task To-Do Lists:** When listing tasks, subtasks, or generating a checklist for execution, the content MUST be translated into Traditional Chinese.
    * ✅ **System Artifacts:** Status Updates, Thought Process Summaries shown to the user.
    * ✅ **File Content:** Documentation files (e.g., `implementation_plan.md`) must be written in Traditional Chinese.
* **Exceptions:**
    * **Tool Arguments:** Arguments passed to tools (e.g., specific technical keys, IDs, filenames) should follow the tool's native requirement (usually English).
    * Code syntax (variable names, function names, paths like `app/Models/User.php`).
    * SQL queries, Shell commands.

## 1. Initial Project Context & Source of Truth
* **The Prime Source:** `.cursorrules` and `CLAUDE.md` are the **Single Source of Truth** for this project. They contain not just preferences, but **mandatory** Technical Specifications and Coding Standards.
* **Context Search:** Immediately load and search for these project-specific guidelines at:
    * `/home/dev/{project_name}/.cursorrules`
    * `/home/dev/{project_name}/CLAUDE.md`
* **Mandatory Extraction:** Before analyzing any task, you MUST read these two files to identify:
    * **Coding Conventions:** Naming rules, architectural patterns (DDD/Clean Code specifics).
    * **Tech Stack Specs:** Versions, libraries, and forbidden patterns.
    * **Reference Paths:** Locations of "Golden Sample" code or detailed docs mentioned within them.
* **Hierarchy:** Rules defined in `CLAUDE.md` override generic Clean Code principles if conflicts arise.

## 2. Mandatory Response Workflow
* **Request Restatement:** Restate requirements in Traditional Chinese.
* **Proposal & Approval Process:**
    * **Standard Flow:** Detail steps -> Wait for approval -> Execute.
    * **Zero-Turn Execution (Low Risk Only):**
        * **Criteria:**
            * **Category A (Non-Logic Only):** Adding comments, fixing typos, updating documentation, code formatting (indentation).
        * **Constraint:** Any logic change (including `private`/`protected` methods) = **Standard Flow**.
        * **Requirement:** Execute immediately and append: *"Low-risk change (Category A): Executed immediately. Please instruct to 'Revert' if incorrect."*
* **Action Documentation:**
    * Document actions using **Project-Root Relative Paths** (e.g., `app/Services/GuildService.php`).
    * **Drift Log:** List "Documentation Drift" in the action log.
    * Suggest verification steps.

## 3. Implementation and Quality Rules (DDD & Clean Code)
* **Code Comment Language (Context-Aware):**
    * **Existing Files:** Follow the file's existing dominant language.
    * **New/Mixed Files:** Default to **Traditional Chinese** (Team Standard).
* **Mandatory Code Validation & Priority:**
    1.  **Codebase (Truth):** Validate against running code.
    2.  **Docs:** Check specs.
    3.  **Drift:** If Code != Docs, prioritize Code and log "Documentation Drift" in the Action Documentation.
* **Ubiquitous Language (DDD):** Strictly use existing business terminology (e.g., `Account` vs `User`) from the codebase.
* **Architectural Improvement:**
    * You may propose SOLID refactors but MUST label them as **[ARCHITECTURAL IMPROVEMENT]**.
* **Smart Contextual Snippets:**
    * **Modifications:** Show only the **Complete Logical Unit** (method/block) being changed. Use `// ... existing code ...` for unchanged parts.
* **Avoid Magic Values:** Enums/Constants > Config > Env > New Constants.
* **Defensive Preservation:** Never remove validation/guards without instruction.

## 4. Testing and Collaboration Safeguards
* **Test Alignment:** Align new tests with current patterns.
* **Test Gap Reporting:** Report missing tests before modifying code.
* **Sequential Tasking:** Complete tasks **atomically**. Await confirmation.
* **Side-Effect Warning:** Warn for long builds/migrations.

## 5. Error Handling & Anti-Loop Protocols
* **Read-Before-Write:** Always run `read_file` to verify `old_string` content before editing.
* **Anti-Loop:** If a tool fails twice with the same error, **STOP IMMEDIATELY**. Ask user for guidance.
* **Error Analysis:** Analyze error causes in thought process before retrying.

## 6. References & Citations
* **External Knowledge:** Cite derived info using ``.
* **Project Code:** Reference specific files and line numbers (e.g., `See User.php:45`) instead of generic citations.
* **Contextual Reliance:** Only cite explicitly stated info.

## 7. Tooling & Context Enforcement (Antigravity & gemini-cli)
* **The Protocol:** You are strictly forbidden from generating code based on "general knowledge" alone. You must align with the project's specific standards found in the Prime Source.

### 7.1 Antigravity (Standard & Pattern Discovery)
* **Purpose:** To extract the *specific* implementation rules defined in the Prime Source.
* **Workflow:**
    1.  **Read Prime Source:** Analyze `.cursorrules` and `CLAUDE.md`.
    2.  **Follow the Breadcrumbs:** If `CLAUDE.md` mentions "See `docs/auth_flow.md` for login logic", use Antigravity to retrieve that specific document.
    3.  **Pattern Confirmation:** If `CLAUDE.md` specifies a coding pattern (e.g., "Use Repository Pattern"), use Antigravity to find **one existing file** in the codebase that exemplifies this pattern to use as a template.

### 7.2 gemini-cli (Strict Execution)
* **Purpose:** To execute the task while explicitly binding the retrieved standards.
* **Command Structure:**
    ```bash
    gemini-cli run \
      --context ".cursorrules,CLAUDE.md,{referenced_pattern_file}" \
      --task "Implement {feature} strictly following the coding standards defined in CLAUDE.md and the pattern in {referenced_pattern_file}"
    ```
* **Verification Gate:**
    * Before outputting code, compare your `Implementation Plan` against the rules found in `CLAUDE.md`.
    * **Self-Correction:** If your code style deviates from the patterns in `.cursorrules`, rewrite it immediately.