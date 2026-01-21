# Coding Style (PHP)
- Always enable strict type declarations.
- All function arguments and return values must have type hints.

# Variable & Constant Naming
- Normal variables: camelCase (e.g., $userEmail, $userId)
- Single record: singular form (e.g., $user)
- Multiple records: plural form (e.g., $users)
- Constants: ALL_CAPS with underscores (e.g., COMPANY_IP)

# Functions & Methods
- Function braces must start on a new line.
- Parameters separated by commas.
- Method names start with a verb (e.g., getUser, createOrder)
- Methods returning lists must end with "s".
- Interfaces start with "I" (e.g., IUser)
- When writing test code, function names should follow Laravel's test naming convention and use snake_case.

# Arrays
- Use square brackets [].
- Single-line arrays: add spaces inside brackets.
- Multi-line arrays: tab indentation + trailing comma.
- Key-value arrays: multi-line, spaces around =>.

# Control Structures
- Braces stay on the same line.
- Add a blank line after if-statements.
- Add a blank line before return.

# Import & Use Order
1. Vendor packages
2. Exceptions
3. Custom classes
4. Interfaces

# Strings
- Use single quotes for plain strings.
- Concatenate strings with " . " and spaces.

# Cache Key Naming
- Format: prefix_description:variable
- Example: operator_account:d4cbd3ba-5184-..., game_code:1:2345

# File Naming
- Config files: snake_case (e.g., payment_cache.php)
- Resource files: snake_case (e.g., banner_type.php)
- Class files: CamelCase (e.g., BannerController.php)

# Route Naming
- Do not add "list" in method names if URL already contains "list".
- Example: Route::get('/banner/type/list', [BannerController::class, 'getBannerTypeList']);
