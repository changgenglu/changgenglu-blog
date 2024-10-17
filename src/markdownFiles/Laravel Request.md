# Laravel Request

## 抽取表單驗證

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
