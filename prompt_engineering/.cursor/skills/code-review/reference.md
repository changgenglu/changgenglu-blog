# Code Review Reference

詳細的檢查標準與範例。

## SOLID Principles Examples

### SRP Violation (Bad)
```php
class UserService {
    public function createUser() { ... }
    public function sendEmail() { ... }      // Violates SRP
    public function generateReport() { ... } // Violates SRP
}
```

### SRP Correct (Good)
```php
class UserService { /* Only user logic */ }
class EmailService { /* Only email */ }
class ReportService { /* Only reports */ }
```

### OCP Violation (Bad)
```php
if ($type == 'A') { ... }
elseif ($type == 'B') { ... }
elseif ($type == 'C') { ... }
```

### OCP Correct (Good)
```php
interface IPaymentProcessor {
    public function process(): void;
}
class CreditCardProcessor implements IPaymentProcessor { ... }
class PayPalProcessor implements IPaymentProcessor { ... }
```

## Eagle Coding Style Examples

### Variable Naming
```php
// ✅ Correct
$userEmail = 'test@example.com';
$userId = 123;

// ❌ Incorrect
$user_email = 'test@example.com';
$user_id = 123;
```

### Constant Naming
```php
// ✅ Correct
const COMPANY_IP = '192.168.1.1';
const MAX_RETRY_COUNT = 3;

// ❌ Incorrect
const CompanyIp = '192.168.1.1';
const maxRetryCount = 3;
```

### Interface Naming
```php
// ✅ Correct
interface IGame { ... }
interface IUserRepository { ... }

// ❌ Incorrect
interface GameInterface { ... }
interface UserRepositoryInterface { ... }
```

### Array Format
```php
// ✅ Correct - Single line
$colors = [ 'red', 'green' ];

// ✅ Correct - Multi-line
$users = [
    'Test1',
    'Test2',
];

// ✅ Correct - Key-value
$user = [
    'name' => 'Neil',
    'email' => 'test@example.com',
];

// ❌ Incorrect
$colors = ['red','green'];
$users = ['Test1',
'Test2'];
```

### Braces
```php
// ✅ Correct - Function braces on new line
function getName()
{
    // code
}

// ✅ Correct - Control structure braces on same line
if ($condition) {
    // code
}

// ❌ Incorrect
function getName() {
    // code
}
if ($condition)
{
    // code
}
```

### String Format
```php
// ✅ Correct - Pure string with single quotes
$name = 'Neil';

// ✅ Correct - String with variable (double quotes)
$msg = "Hello {$user['name']}";

// ✅ Correct - Concatenation with spaces
$full = $first . ' ' . $last;

// ❌ Incorrect
$name = "Neil";
$full = $first.' '.$last;
```

### Cache Key Format
```php
// ✅ Correct
Cache::get('user_profile:123');
Cache::get('game_code:1:2345');

// ❌ Incorrect
Cache::get('user-profile-123');
Cache::get('userProfile:123');
```

### Validation Format
```php
// ✅ Correct - Array format
$request->validate([
    'nickname' => [ 'required', 'string', 'max:50' ],
    'phone' => [ 'required', 'string', 'max:20' ],
]);

// ❌ Incorrect - Pipe format
$request->validate([
    'nickname' => 'required|string|max:50',
    'phone' => 'required|string|max:20',
]);
```

### API Design
```php
// ✅ Correct - Parameters in Body
PUT /api/members
{ "member_id": "uuid-here", "name": "Updated" }

// ❌ Incorrect - ID in URL
PUT /api/members/{member_id}
```

## Security Examples

### SQL Injection Prevention
```php
// ❌ Bad - String concatenation
$query = "SELECT * FROM users WHERE id = " . $id;

// ✅ Good - Eloquent
User::where('id', $id)->first();

// ✅ Good - Parameterized query
DB::select('SELECT * FROM users WHERE id = ?', [$id]);
```

### XSS Prevention
```php
// ❌ Bad - Direct output
echo $userInput;

// ✅ Good - Blade escaping
{{ $userInput }}

// ✅ Good - PHP escaping
echo e($userInput);
```

## Performance Examples

### N+1 Query Problem
```php
// ❌ Bad - N+1 queries
$users = User::all();
foreach ($users as $user) {
    echo $user->profile->name; // Query executed for each user
}

// ✅ Good - Eager loading
$users = User::with('profile')->get();
foreach ($users as $user) {
    echo $user->profile->name; // No additional queries
}
```

### Large Dataset Handling
```php
// ❌ Bad - Load all records
$users = User::all(); // Could be millions

// ✅ Good - Pagination
$users = User::paginate(50);

// ✅ Good - Chunking
User::chunk(1000, function ($users) {
    foreach ($users as $user) {
        // Process batch
    }
});
```

## File Format Requirements

- **Trailing Newline**: File must end with a newline
- **No Trailing Whitespace**: Remove spaces/tabs at end of lines
- **Encoding**: UTF-8 without BOM
- **Line Ending**: Unix LF (`\n`), not Windows CRLF (`\r\n`)

## Use Statement Order

```php
// ✅ Correct order
use Illuminate\Support\Facades\DB;  // Vendor
use Exception;                       // Exception
use App\Models\User;                 // Custom Class
use App\Interfaces\IUserRepository; // Interface
```
