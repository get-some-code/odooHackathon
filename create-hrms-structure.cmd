@echo off
echo Creating HRMS Project Structure...
echo.

:: Root folders
mkdir app
mkdir components
mkdir lib
mkdir hooks
mkdir services
mkdir actions
mkdir middleware
mkdir types
mkdir utils
mkdir public
mkdir styles
mkdir prisma

:: ===========================
:: APP ROUTER
:: ===========================

mkdir app\(auth)
mkdir app\(auth)\login
mkdir app\(auth)\register
mkdir app\(auth)\verify-email

type nul > app\(auth)\login\page.tsx
type nul > app\(auth)\register\page.tsx
type nul > app\(auth)\verify-email\page.tsx

:: Employee Routes

mkdir app\(employee)
mkdir app\(employee)\dashboard
mkdir app\(employee)\profile
mkdir app\(employee)\attendance
mkdir app\(employee)\leave
mkdir app\(employee)\payroll

type nul > app\(employee)\dashboard\page.tsx
type nul > app\(employee)\profile\page.tsx
type nul > app\(employee)\attendance\page.tsx
type nul > app\(employee)\leave\page.tsx
type nul > app\(employee)\payroll\page.tsx

:: Admin Routes

mkdir app\(admin)
mkdir app\(admin)\dashboard
mkdir app\(admin)\employees
mkdir app\(admin)\attendance
mkdir app\(admin)\leave
mkdir app\(admin)\payroll

type nul > app\(admin)\dashboard\page.tsx
type nul > app\(admin)\employees\page.tsx
type nul > app\(admin)\attendance\page.tsx
type nul > app\(admin)\leave\page.tsx
type nul > app\(admin)\payroll\page.tsx

:: API Routes

mkdir app\api

mkdir app\api\auth
mkdir app\api\attendance
mkdir app\api\employee
mkdir app\api\leave
mkdir app\api\payroll
mkdir app\api\admin

mkdir app\api\auth\login
mkdir app\api\auth\register
mkdir app\api\auth\verify-email

type nul > app\api\auth\login\route.ts
type nul > app\api\auth\register\route.ts
type nul > app\api\auth\verify-email\route.ts

mkdir app\api\attendance\checkin
mkdir app\api\attendance\checkout
mkdir app\api\attendance\history

type nul > app\api\attendance\checkin\route.ts
type nul > app\api\attendance\checkout\route.ts
type nul > app\api\attendance\history\route.ts

mkdir app\api\employee\profile
type nul > app\api\employee\profile\route.ts

mkdir app\api\leave\apply
mkdir app\api\leave\approve
mkdir app\api\leave\reject

type nul > app\api\leave\apply\route.ts
type nul > app\api\leave\approve\route.ts
type nul > app\api\leave\reject\route.ts

mkdir app\api\payroll\salary
type nul > app\api\payroll\salary\route.ts

:: ===========================
:: COMPONENTS
:: ===========================

mkdir components\ui
mkdir components\layout
mkdir components\dashboard
mkdir components\attendance
mkdir components\leave
mkdir components\payroll
mkdir components\employee
mkdir components\admin
mkdir components\forms

:: ===========================
:: LIB
:: ===========================

type nul > lib\db.ts
type nul > lib\auth.ts
type nul > lib\utils.ts
type nul > lib\validators.ts

:: ===========================
:: ACTIONS
:: ===========================

type nul > actions\auth.ts
type nul > actions\attendance.ts
type nul > actions\employee.ts
type nul > actions\leave.ts
type nul > actions\payroll.ts

:: ===========================
:: SERVICES
:: ===========================

type nul > services\attendance.service.ts
type nul > services\employee.service.ts
type nul > services\leave.service.ts
type nul > services\payroll.service.ts

:: ===========================
:: MIDDLEWARE
:: ===========================

type nul > middleware\auth.ts
type nul > middleware\admin.ts

:: ===========================
:: TYPES
:: ===========================

type nul > types\attendance.ts
type nul > types\employee.ts
type nul > types\leave.ts
type nul > types\payroll.ts
type nul > types\user.ts

:: ===========================
:: HOOKS
:: ===========================

type nul > hooks\useAuth.ts
type nul > hooks\useAttendance.ts

:: ===========================
:: UTILS
:: ===========================

type nul > utils\constants.ts
type nul > utils\helpers.ts

:: ===========================
:: PRISMA
:: ===========================

type nul > prisma\schema.prisma

:: ===========================
:: PUBLIC
:: ===========================

mkdir public\images
mkdir public\icons

echo.
echo ====================================
echo HRMS Folder Structure Created!
echo ====================================

pause