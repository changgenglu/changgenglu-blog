# Laravel 表單驗證

## 基礎驗證方法 `validate()`

```php
$validatedData = $request->validate([
    'title' => ['required', 'unique:posts', 'max:255'],
    'body' => ['required'],
]);
```

也可以使用 `validateWithBag()` 來請求驗證，並將所有錯誤訊息，儲存在一個命名錯誤訊息包

```php
$validatedData = $request->validateWithBag('post', [
    'title' => ['required', 'unique:posts', 'max:255'],
    'body' => ['required'],
]);
```

在驗證規則中，加入 bail，如果某個字串在第一次驗證失敗之後，就立即停止驗證。

```php
$request->validate([
    'title' => 'bail|required|unique:posts|max:255',
    'body' => 'required',
]);
// 如果title沒通過unique的規則，那麼就不會再 繼續驗證max規則
```

如果你的 HTTP 請求，包還嵌套參數(比如陣列)，你可以在驗證規則中使用「點」語法，來指定這些參數

```php
$request->validate([
    'title' => 'required|unique:posts|max:255',
    'author.name' => 'required',
    'author.description' => 'required',
]);
```

如果你的字段名稱包含點，則可以使用跳脫符號

```php
$request->validate([
    'title' => 'required|unique:posts|max:255',
    'v1\.0' => 'required',
]);
```

## [常用規則](https://learnku.com/docs/laravel/8.x/validation/9374)

## 抽取表單驗證

### Form Request

使用 request class 將表單驗證邏輯從 controller 中抽出

1. 建立 Request class

   ```bach
       php artisan make:request RegisterRequest
       php artisan make:request LoginRequest
       php artisan make:request ShowUsersRequest
       php artisan make:request UpdateUserRequest
   ```

2. 在 request class 中建立驗證邏輯

   ```php
       <?php

       namespace App\Http\Requests;

       use Illuminate\Foundation\Http\FormRequest;

       class RegisterRequest extends FormRequest
       {
           public function authorize()
           {
               return true;
           }

           public function rules()
           {
               return [
                   'name' => 'required|string|max:255',
                   'email' => 'required|string|email|unique:users,email',
                   'password' => 'required|string|min:8',
               ];
           }
       }

   ```

3. 更新 controller

   ```php
       <?php

       namespace App\Http\Controllers;

       use App\Http\Requests\RegisterRequest;
       use App\Http\Requests\LoginRequest;
       use App\Http\Requests\ShowUsersRequest;
       use App\Http\Requests\UpdateUserRequest;
       use Illuminate\Support\Facades\Cache;
       use Illuminate\Support\Facades\Hash;
       use App\Models\User;
       use App\Models\Wallet;

       class UserController extends Controller
       {
            public function register(RegisterRequest $request)
           {
               $validatedData = $request->validated();

               $user = User::create([
                   'name' => $validatedData['name'],
                   'email' => $validatedData['email'],
                   'password' => Hash::make($validatedData['password']),
               ]);

               $token = $user->createToken('authToken')->plainTextToken;

               return response()->json([
                   'user' => $user,
                   'token' => $token,
               ], 201);
           }


           // ... 其他方法保持不變
       }

   ```

4. 集中多個請求的表單驗證

   一般會建議依不同請求，個別建立單獨的 request class

   ```bash
       php artisan make:request UserRequest
   ```

5. 在此 request 中實現所有請求的驗證邏輯

   ```php
       <?php

       namespace App\Http\Requests;

       use Illuminate\Foundation\Http\FormRequest;

       class UserRequest extends FormRequest
       {
           public function authorize()
           {
               return true;
           }

           public function rules()
           {
               $method = $this->method();
               $action = $this->route()->getActionMethod();

               switch($action) {
                   case 'register':
                       return [
                           'name' => 'required|string|max:255',
                           'email' => 'required|string|email|unique:users,email',
                           'password' => 'required|string|min:8',
                       ];
                   case 'login':
                       return [
                           'email' => 'required|string|email|exists:users,email',
                           'password' => 'required|string',
                       ];
                   case 'show':
                       return [
                           "item_limit" => "nullable|integer|min:1|max:75",
                           "filter_params" => "nullable|array",
                           "filter_params.user_balance" => "nullable|integer",
                       ];
                   case 'update':
                       return [
                           'name' => 'string|max:255',
                           'password' => 'string|min:8|nullable',
                       ];
                   default:
                       return [];
               }
           }
       }
   ```

優點：

1. 可以在多個控制器重用相同驗證規則
2. 可以自訂錯誤消息
3. 可以在套用驗證規則前處理、或是在驗證後處理資料

缺點：

1. 對於不需要驗證使用者權限，或較單純的表單驗證而言，為每個不同的請求建立相對的 request class，顯得小題大作。

### ValidatesRequests Trait

自訂驗證 trait

```php
namespace App\Http\Traits;

use Illuminate\Support\Facades\Validator;

trait ValidatesWalletRequests
{
    protected function validateWalletRequest(array $data)
    {
        return Validator::make($data, [
            'amount' => 'required|numeric|min:0',
            'description' => 'required|string|max:255',
        ]);
    }
}

```

```php
class WalletController extends Controller
{
    use ValidatesWalletRequests;

    public function charge(Request $request)
    {
        $validator = $this->validateWalletRequest($request->all());
        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }
        // 繼續處理邏輯
    }
}
```

優點：

1. 不受資料流限制，隨時可以驗證。
2. 驗證邏輯可重用。
3. 適合處理跨多個 controller 的通用驗證邏輯。

缺點：

1. 不如 form request 易用。
2. 當專案變大時，會變的難以追蹤驗證邏輯的來源。

### 結語

驗證邏輯在很多情況之下，並不能完全通用，因此在 laravel 官方文件中使用 form request 來處理需要複雜表單驗證、以及使用者權限驗證的單一請求。
若今天此一請求的表單驗證並沒有這麼複雜時，將表單驗證寫在 controller 中即可。