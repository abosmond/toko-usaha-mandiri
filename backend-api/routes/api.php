<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\CategoryController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\SupplierController;
use App\Http\Controllers\API\StockController;
use App\Http\Controllers\API\CustomerController;
use App\Http\Controllers\API\SaleController;
use App\Http\Controllers\API\ReportController;
use App\Http\Controllers\API\SettingController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware(['auth:sanctum'])->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // Users management (admin only)
    Route::middleware(['role:admin'])->group(function () {
        Route::apiResource('users', UserController::class);
        Route::put('/users/{user}/update-role', [UserController::class, 'updateRole']);
    });
    
    // Routes accessible to admins and managers
    Route::middleware(['role:admin,manager'])->group(function () {
        // Categories
        Route::apiResource('categories', CategoryController::class);
        
        // Products (except index and show which are available to all)
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);
        
        // Suppliers
        Route::apiResource('suppliers', SupplierController::class);
        
        // Stock management
        Route::post('/stock/adjust', [StockController::class, 'adjust']);
        Route::get('/stock/history', [StockController::class, 'history']);
        Route::get('/stock/history/{product}', [StockController::class, 'productHistory']);
        
        // Customers management
        Route::apiResource('customers', CustomerController::class);
        
        // Reports
        Route::prefix('reports')->group(function () {
            Route::get('/sales-by-date', [ReportController::class, 'salesByDate']);
            Route::get('/sales-by-payment', [ReportController::class, 'salesByPaymentMethod']);
            Route::get('/sales-by-product', [ReportController::class, 'salesByProduct']);
            Route::get('/sales-by-category', [ReportController::class, 'salesByCategory']);
            Route::get('/profit', [ReportController::class, 'profit']);
            Route::get('/inventory', [ReportController::class, 'inventory']);
            Route::get('/customers', [ReportController::class, 'customers']);
            Route::get('/tax', [ReportController::class, 'tax']);
            Route::get('/stock-adjustments', [ReportController::class, 'stockAdjustments']);
            Route::get('/staff-performance', [ReportController::class, 'staffPerformance']);
            Route::get('/dashboard', [ReportController::class, 'dashboard']);
        });
    });
    
    // Routes accessible to all authenticated users (admin, manager, cashier)
    // Products (index and show)
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{product}', [ProductController::class, 'show']);
    Route::get('/products/barcode/{barcode}', [ProductController::class, 'findByBarcode']);
    Route::get('/products/search/{query}', [ProductController::class, 'search']);
    Route::get('/products/category/{category}', [ProductController::class, 'byCategory']);
    Route::get('/products/low-stock', [ProductController::class, 'lowStock']);
    
    // Sales/Transactions
    Route::post('/sales', [SaleController::class, 'store']);
    Route::get('/sales', [SaleController::class, 'index']);
    Route::get('/sales/{sale}', [SaleController::class, 'show']);
    Route::get('/sales/invoice/{invoice}', [SaleController::class, 'findByInvoice']);
    Route::post('/sales/{sale}/void', [SaleController::class, 'voidSale']);
    Route::post('/sales/{sale}/print-receipt', [SaleController::class, 'printReceipt']);
    
    // Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::middleware(['role:admin'])->group(function () {
        Route::post('/settings', [SettingController::class, 'update']);
        Route::delete('/settings/logo', [SettingController::class, 'deleteLogo']);
        Route::post('/settings/reset', [SettingController::class, 'reset']);
        Route::post('/settings/logo', [SettingController::class, 'uploadLogo']);
    });
    Route::get('/settings/logo', [SettingController::class, 'getLogo']);
});