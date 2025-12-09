# Gemini CLI Development Guidelines

## 0. THE PRIME DIRECTIVE: STRICT LANGUAGE ENFORCEMENT
* **Absolute Rule:** **Traditional Chinese (Taiwan Localization / 繁體中文)** is the **ONLY** allowed language for all human-readable outputs.
* **Scope of Enforcement (CRITICAL):**
    * ✅ **Chat Responses:** All conversational text.
    * ✅ **Tool Arguments (Tasks):** When creating/updating tasks, the `title` and `description` fields **MUST** be in Traditional Chinese. (e.g., `Task: "Analyze code"` -> ❌ / `Task: "分析程式碼"` -> ⭕).
    * ✅ **System Artifacts:** Implementation Plans, Status Updates, Thought Process Summaries shown to the user.
    * ✅ **File Content:** Documentation files (e.g., `implementation_plan.md`) must be written in Traditional Chinese.
* **Exceptions:**
    * Code syntax (variable names, function names, paths like `app/Models/User.php`).
    * SQL queries, Shell commands.

## 1. Initial Project Context & Guidelines Check
* **Context Search:** Immediately search for project-specific guidelines at:
    * `/home/dev/{project_name}/.cursorrules`
    * `/home/dev/{project_name}/CLAUDE.md`
* **Hierarchy:** Project-specific files (`CLAUDE.md`) override this guide.
* **Initial Report:** Report loaded files and any conflicts found.

## 2. Mandatory Response Workflow
* **Request Restatement:** Restate requirements in Traditional Chinese.
* **Proposal & Approval Process:**
    * **Standard Flow:** Detail steps -> Wait for approval -> Execute.
    * **Zero-Turn Execution (Low Risk Only):**
        * **Criteria:**
            * **Category A (Non-Logic):** Comments, docs, formatting.
            * **Category B (Isolated):** Internal refactoring of `private`/`protected` methods (no signature change).
        * **Constraint:** Public interfaces/Schema changes = **Standard Flow**.
        * **Requirement:** Execute immediately and append: *"Low-risk change (Category A/B): Executed immediately. Please instruct to 'Revert' if incorrect."*
* **Action Documentation:**
    * Document actions using **Project-Root Relative Paths** (e.g., `app/Services/GuildService.php`).
    * **Drift Log:** List "Documentation Drift" in the action log.
    * Suggest verification steps.

## 3. Implementation and Quality Rules (DDD & Clean Code)
* **Code Comment Language (Context-Aware):**
    * **Existing Files:** Follow the file's existing dominant language (English/Chinese).
    * **New/Mixed Files:** Default to **Traditional Chinese**.
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

## 6. Citing Sources
* **Mandatory Citation:** Cite derived info using ``.
* **Contextual Reliance:** Only cite explicitly stated info.