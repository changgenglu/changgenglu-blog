---
name: code-review
description: Review code for quality, security, and maintainability following Stars Laravel project standards. Use when reviewing pull requests, examining code changes, or when the user asks for a code review. Checks SOLID principles, code quality, Eagle coding style, correctness, security, performance, and testability.
---

# Code Review

## Quick Start

When reviewing code, follow this structured process:

1. **Initial Scan**: Identify change types and scope
2. **Detailed Review**: Check all categories systematically
3. **Scoring & Report**: Calculate scores and generate feedback

## Review Checklist

### SOLID Principles (25% weight)
- [ ] **SRP**: Each class/method has single responsibility
- [ ] **OCP**: New features extend, don't modify existing code
- [ ] **LSP**: Subclasses fully substitute parent classes
- [ ] **ISP**: Interfaces are focused and minimal
- [ ] **DIP**: Depend on abstractions, not concretions

**Red Flags:**
- Class names with "And", "Or", "Manager", "Handler" but unclear responsibility
- Methods with more than 3 main actions
- Classes depending on more than 7 other classes
- Direct instantiation of concrete classes (except DTOs/Entities)
- Switch/case chains for type handling

### Code Quality (20% weight)
- [ ] **Naming**: Follow camelCase (variables), PascalCase (classes), UPPER_SNAKE_CASE (constants)
- [ ] **Complexity**: Cyclomatic complexity < 10, methods < 50 lines, classes < 500 lines
- [ ] **Duplication**: Extract similar code appearing 3+ times
- [ ] **Parameters**: Max 5 parameters per method
- [ ] **Nesting**: Max depth 4 levels

### Eagle Coding Style (15% weight)
- [ ] **Variables**: camelCase (`$userEmail`, not `$user_email`)
- [ ] **Constants**: UPPER_SNAKE_CASE (`COMPANY_IP`, not `CompanyIp`)
- [ ] **Classes**: PascalCase (`MemberController`, not `member_controller`)
- [ ] **Interfaces**: I prefix (`IGame`, not `GameInterface`)
- [ ] **Enums**: PascalCase (`OrderStatus`)
- [ ] **Singular/Plural**: Single data uses singular (`$user`), collections use plural (`$users`)
- [ ] **Arrays**: Use `[]` syntax, proper spacing in multi-line arrays
- [ ] **Braces**: Function braces on new line, control structures on same line
- [ ] **Strings**: Single quotes for pure strings, double quotes with variables
- [ ] **Cache Keys**: Format `prefix_description:variable` (e.g., `user_profile:123`)
- [ ] **Validation**: Use array format `['field' => ['required', 'string']]`
- [ ] **API Design**: Parameters in Body, not URL; correct HTTP methods
- [ ] **File Format**: Trailing newline, no trailing whitespace, UTF-8 no BOM, Unix LF

### Correctness (15% weight)
- [ ] **Business Logic**: Matches requirements
- [ ] **Boundary Conditions**: Handles null, empty arrays/strings, extreme values
- [ ] **Error Handling**: Appropriate exception handling, meaningful error messages
- [ ] **Concurrency**: No race conditions, deadlock risks, proper resource cleanup
- [ ] **Transactions**: Correct transaction scope, complete rollback mechanism

### Security (15% weight)
- [ ] **SQL Injection**: Use Eloquent or parameterized queries (no string concatenation)
- [ ] **XSS**: Use `{{ }}` or `e()` function for user input output
- [ ] **Hardcoded Secrets**: Use environment variables, not hardcoded passwords/keys
- [ ] **File Upload**: Validate file type and size
- [ ] **Sensitive Logging**: Mask or remove sensitive data from logs

### Performance (5% weight)
- [ ] **Database**: No N+1 queries (use `with()`), proper indexing, pagination for large datasets
- [ ] **Memory**: Use `chunk()` or `cursor()` for large collections
- [ ] **Caching**: Appropriate cache usage, correct key format, reasonable TTL

### Testability (5% weight)
- [ ] **Unit Tests**: Corresponding tests exist, adequate coverage
- [ ] **Mockability**: Dependencies can be mocked, interfaces used
- [ ] **Test Quality**: Tests are meaningful, cover edge cases and exceptions

## Scoring System

| Category | Weight | Pass | Warning | Fail |
|----------|--------|------|---------|------|
| SOLID Principles | 25% | 100 | 60 | 0 |
| Code Quality | 20% | 100 | 60 | 0 |
| Eagle Coding Style | 15% | 100 | 60 | 0 |
| Correctness | 15% | 100 | 60 | 0 |
| Security | 15% | 100 | 60 | 0 |
| Performance | 5% | 100 | 60 | 0 |
| Testability | 5% | 100 | 60 | 0 |

**Final Grade:**
- **90-100**: Excellent - Ready to merge
- **70-89**: Good - Fix minor issues then merge
- **50-69**: Needs Improvement - Important issues must be fixed
- **0-49**: Rejected - Major changes required

## Issue Format

For each issue found, provide:

```markdown
**Location**: `file.php:123`
**Severity**: Critical / Warning / Suggestion
**Description**: Clear explanation of the problem
**Suggestion**: Specific code recommendation
```

**Severity Levels:**
- 🔴 **Critical**: Must fix (security vulnerabilities, data corruption risks)
- 🟡 **Warning**: Should fix (performance issues, style violations)
- 🟢 **Suggestion**: Optional (code style, readability improvements)

## Output Format

Your review must include:

1. **Basic Info**: PR number, author, reviewer
2. **Change Summary**: Overview of changes
3. **Category Results**: Table showing scores per category
4. **Issue List**: Issues grouped by severity
5. **Score Summary**: Final grade and recommendation
6. **Review Comments**: Constructive feedback

## Tone Guidelines

- Objective and professional
- Constructive and helpful
- Avoid personal attacks
- Focus on code, not the developer

## Additional Resources

For detailed coding standards and examples, see:
- Project rule: `.cursor/rules/code-review.mdc`
- Project rule: `.cursor/rules/agent.mdc` (implementation guidelines)
