<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Product;
use App\Models\Category;
use App\Models\Customer;
use App\Models\StockAdjustment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Get sales report by date range.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function salesByDate(Request $request)
    {
        try {
            // Default to current month if no range specified
            $endDate = $request->has('end_date') 
                ? Carbon::parse($request->end_date)->endOfDay() 
                : Carbon::now()->endOfDay();
                
            $startDate = $request->has('start_date') 
                ? Carbon::parse($request->start_date)->startOfDay() 
                : Carbon::now()->startOfMonth()->startOfDay();
            
            // Get group by parameter (day, week, month, year)
            $groupBy = $request->group_by ?? 'day';
            
            $salesQuery = Sale::whereBetween('created_at', [$startDate, $endDate])
                           ->where('payment_status', 'paid');

            // Group sales by date
            if ($groupBy === 'day') {
                $salesData = $salesQuery->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(final_amount) as total'),
                    DB::raw('SUM(tax_amount) as tax'),
                    DB::raw('SUM(discount_amount) as discount')
                )
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('date')
                ->get()
                ->map(function ($item) {
                    return [
                        'date' => $item->date,
                        'label' => Carbon::parse($item->date)->format('d M'),
                        'count' => $item->count,
                        'total' => $item->total,
                        'tax' => $item->tax,
                        'discount' => $item->discount,
                    ];
                });
            } elseif ($groupBy === 'week') {
                $salesData = $salesQuery->select(
                    DB::raw('YEAR(created_at) as year'),
                    DB::raw('WEEK(created_at, 1) as week'),
                    DB::raw('MIN(DATE(created_at)) as start_date'),
                    DB::raw('MAX(DATE(created_at)) as end_date'),
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(final_amount) as total'),
                    DB::raw('SUM(tax_amount) as tax'),
                    DB::raw('SUM(discount_amount) as discount')
                )
                ->groupBy('year', 'week')
                ->orderBy('year')
                ->orderBy('week')
                ->get()
                ->map(function ($item) {
                    return [
                        'date' => $item->start_date,
                        'label' => 'Week ' . $item->week . ' (' . Carbon::parse($item->start_date)->format('d M') . ' - ' . Carbon::parse($item->end_date)->format('d M') . ')',
                        'count' => $item->count,
                        'total' => $item->total,
                        'tax' => $item->tax,
                        'discount' => $item->discount,
                    ];
                });
            } elseif ($groupBy === 'month') {
                $salesData = $salesQuery->select(
                    DB::raw('YEAR(created_at) as year'),
                    DB::raw('MONTH(created_at) as month'),
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(final_amount) as total'),
                    DB::raw('SUM(tax_amount) as tax'),
                    DB::raw('SUM(discount_amount) as discount')
                )
                ->groupBy('year', 'month')
                ->orderBy('year')
                ->orderBy('month')
                ->get()
                ->map(function ($item) {
                    return [
                        'date' => "{$item->year}-{$item->month}-01",
                        'label' => Carbon::createFromDate($item->year, $item->month, 1)->format('M Y'),
                        'count' => $item->count,
                        'total' => $item->total,
                        'tax' => $item->tax,
                        'discount' => $item->discount,
                    ];
                });
            } else { // year
                $salesData = $salesQuery->select(
                    DB::raw('YEAR(created_at) as year'),
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(final_amount) as total'),
                    DB::raw('SUM(tax_amount) as tax'),
                    DB::raw('SUM(discount_amount) as discount')
                )
                ->groupBy('year')
                ->orderBy('year')
                ->get()
                ->map(function ($item) {
                    return [
                        'date' => "{$item->year}-01-01",
                        'label' => $item->year,
                        'count' => $item->count,
                        'total' => $item->total,
                        'tax' => $item->tax,
                        'discount' => $item->discount,
                    ];
                });
            }

            // Get summary totals
            $summary = [
                'total_sales' => $salesQuery->count(),
                'total_amount' => $salesQuery->sum('final_amount'),
                'avg_sale_value' => $salesQuery->count() > 0 ? $salesQuery->sum('final_amount') / $salesQuery->count() : 0,
                'total_tax' => $salesQuery->sum('tax_amount'),
                'total_discount' => $salesQuery->sum('discount_amount'),
            ];

            return response()->json([
                'status' => 'success',
                'data' => [
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                    'group_by' => $groupBy,
                    'summary' => $summary,
                    'sales' => $salesData,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate sales report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get sales report by payment method.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function salesByPaymentMethod(Request $request)
    {
        try {
            // Set date range
            $endDate = $request->has('end_date') 
                ? Carbon::parse($request->end_date)->endOfDay() 
                : Carbon::now()->endOfDay();
                
            $startDate = $request->has('start_date') 
                ? Carbon::parse($request->start_date)->startOfDay() 
                : Carbon::now()->startOfMonth()->startOfDay();

            $paymentData = Sale::whereBetween('created_at', [$startDate, $endDate])
                ->where('payment_status', 'paid')
                ->join('payment_methods', 'sales.payment_method_id', '=', 'payment_methods.id')
                ->select(
                    'payment_methods.id',
                    'payment_methods.name',
                    DB::raw('COUNT(sales.id) as count'),
                    DB::raw('SUM(sales.final_amount) as total')
                )
                ->groupBy('payment_methods.id', 'payment_methods.name')
                ->orderBy('total', 'desc')
                ->get();

            // Get overall total
            $totalAmount = Sale::whereBetween('created_at', [$startDate, $endDate])
                ->where('payment_status', 'paid')
                ->sum('final_amount');

            // Calculate percentages
            $paymentData = $paymentData->map(function ($item) use ($totalAmount) {
                $item['percentage'] = $totalAmount > 0 ? ($item['total'] / $totalAmount) * 100 : 0;
                return $item;
            });

            return response()->json([
                'status' => 'success',
                'data' => [
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                    'total_amount' => $totalAmount,
                    'payment_methods' => $paymentData,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate payment method report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get sales report by product.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function salesByProduct(Request $request)
    {
        try {
            // Set date range
            $endDate = $request->has('end_date') 
                ? Carbon::parse($request->end_date)->endOfDay() 
                : Carbon::now()->endOfDay();
                
            $startDate = $request->has('start_date') 
                ? Carbon::parse($request->start_date)->startOfDay() 
                : Carbon::now()->startOfMonth()->startOfDay();

            // Optional category filter
            $categoryId = $request->category_id;

            $query = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
                ->whereBetween('sales.created_at', [$startDate, $endDate])
                ->where('sales.payment_status', 'paid');
                
            // Apply category filter if specified
            if ($categoryId) {
                $query->where('products.category_id', $categoryId);
            }
            
            $productsData = $query->select(
                'products.id',
                'products.name',
                'products.code',
                'categories.name as category_name',
                DB::raw('SUM(sale_items.quantity) as quantity'),
                DB::raw('SUM(sale_items.subtotal) as total')
            )
            ->groupBy('products.id', 'products.name', 'products.code', 'categories.name')
            ->orderBy('quantity', 'desc')
            ->get();
            
            // Get total sales
            $totalSales = $productsData->sum('total');
            $totalItems = $productsData->sum('quantity');
            
            // Calculate percentages
            $productsData = $productsData->map(function ($item) use ($totalSales, $totalItems) {
                $item->sales_percentage = $totalSales > 0 ? ($item->total / $totalSales) * 100 : 0;
                $item->quantity_percentage = $totalItems > 0 ? ($item->quantity / $totalItems) * 100 : 0;
                return $item;
            });

            return response()->json([
                'status' => 'success',
                'data' => [
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                    'total_sales' => $totalSales,
                    'total_items' => $totalItems,
                    'category_id' => $categoryId,
                    'products' => $productsData,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate product sales report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get sales report by category.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function salesByCategory(Request $request)
    {
        try {
            // Set date range
            $endDate = $request->has('end_date') 
                ? Carbon::parse($request->end_date)->endOfDay() 
                : Carbon::now()->endOfDay();
                
            $startDate = $request->has('start_date') 
                ? Carbon::parse($request->start_date)->startOfDay() 
                : Carbon::now()->startOfMonth()->startOfDay();

            $categoriesData = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
                ->whereBetween('sales.created_at', [$startDate, $endDate])
                ->where('sales.payment_status', 'paid')
                ->select(
                    'categories.id',
                    'categories.name',
                    DB::raw('SUM(sale_items.quantity) as quantity'),
                    DB::raw('SUM(sale_items.subtotal) as total'),
                    DB::raw('COUNT(DISTINCT products.id) as product_count')
                )
                ->groupBy('categories.id', 'categories.name')
                ->orderBy('total', 'desc')
                ->get();
            
            // Handle uncategorized products
            $uncategorized = $categoriesData->firstWhere('id', null);
            if ($uncategorized) {
                $uncategorized->name = 'Uncategorized';
            }
            
            // Get total sales
            $totalSales = $categoriesData->sum('total');
            
            // Calculate percentages
            $categoriesData = $categoriesData->map(function ($item) use ($totalSales) {
                $item->percentage = $totalSales > 0 ? ($item->total / $totalSales) * 100 : 0;
                return $item;
            });

            return response()->json([
                'status' => 'success',
                'data' => [
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                    'total_sales' => $totalSales,
                    'categories' => $categoriesData,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate category sales report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get profit report.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function profit(Request $request)
    {
        try {
            // Set date range
            $endDate = $request->has('end_date') 
                ? Carbon::parse($request->end_date)->endOfDay() 
                : Carbon::now()->endOfDay();
                
            $startDate = $request->has('start_date') 
                ? Carbon::parse($request->start_date)->startOfDay() 
                : Carbon::now()->startOfMonth()->startOfDay();
            
            // Group by parameter (day, week, month, year)
            $groupBy = $request->group_by ?? 'day';

            // Get sales data
            $salesQuery = Sale::whereBetween('created_at', [$startDate, $endDate])
                           ->where('payment_status', 'paid');
            
            // Calculate cost of goods sold and profit
            $profitData = [];
            
            if ($groupBy === 'day') {
                $dates = [];
                $currentDate = $startDate->copy();
                
                while ($currentDate->lte($endDate)) {
                    $dates[] = $currentDate->format('Y-m-d');
                    $currentDate->addDay();
                }
                
                foreach ($dates as $date) {
                    $dayStart = Carbon::parse($date)->startOfDay();
                    $dayEnd = Carbon::parse($date)->endOfDay();
                    
                    $sales = Sale::whereBetween('created_at', [$dayStart, $dayEnd])
                              ->where('payment_status', 'paid')
                              ->with('saleItems.product')
                              ->get();
                    
                    $revenue = $sales->sum('final_amount');
                    $costOfGoods = 0;
                    
                    foreach ($sales as $sale) {
                        foreach ($sale->saleItems as $item) {
                            $costOfGoods += $item->product->buy_price * $item->quantity;
                        }
                    }
                    
                    $profit = $revenue - $costOfGoods;
                    $profitMargin = $revenue > 0 ? ($profit / $revenue) * 100 : 0;
                    
                    $profitData[] = [
                        'date' => $date,
                        'label' => Carbon::parse($date)->format('d M'),
                        'revenue' => $revenue,
                        'cost' => $costOfGoods,
                        'profit' => $profit,
                        'profit_margin' => $profitMargin,
                    ];
                }
            } elseif ($groupBy === 'month') {
                $months = [];
                $currentMonth = $startDate->copy()->startOfMonth();
                
                while ($currentMonth->lte($endDate)) {
                    $months[] = $currentMonth->format('Y-m');
                    $currentMonth->addMonth();
                }
                
                foreach ($months as $month) {
                    $monthStart = Carbon::parse($month . '-01')->startOfMonth();
                    $monthEnd = Carbon::parse($month . '-01')->endOfMonth();
                    
                    $sales = Sale::whereBetween('created_at', [$monthStart, $monthEnd])
                              ->where('payment_status', 'paid')
                              ->with('saleItems.product')
                              ->get();
                    
                    $revenue = $sales->sum('final_amount');
                    $costOfGoods = 0;
                    
                    foreach ($sales as $sale) {
                        foreach ($sale->saleItems as $item) {
                            $costOfGoods += $item->product->buy_price * $item->quantity;
                        }
                    }
                    
                    $profit = $revenue - $costOfGoods;
                    $profitMargin = $revenue > 0 ? ($profit / $revenue) * 100 : 0;
                    
                    $profitData[] = [
                        'date' => $month . '-01',
                        'label' => Carbon::parse($month . '-01')->format('M Y'),
                        'revenue' => $revenue,
                        'cost' => $costOfGoods,
                        'profit' => $profit,
                        'profit_margin' => $profitMargin,
                    ];
                }
            } else { // year
                $years = [];
                $startYear = (int) $startDate->format('Y');
                $endYear = (int) $endDate->format('Y');
                
                for ($year = $startYear; $year <= $endYear; $year++) {
                    $years[] = $year;
                }
                
                foreach ($years as $year) {
                    $yearStart = Carbon::createFromDate($year, 1, 1)->startOfYear();
                    $yearEnd = Carbon::createFromDate($year, 12, 31)->endOfYear();
                    
                    $sales = Sale::whereBetween('created_at', [$yearStart, $yearEnd])
                              ->where('payment_status', 'paid')
                              ->with('saleItems.product')
                              ->get();
                    
                    $revenue = $sales->sum('final_amount');
                    $costOfGoods = 0;
                    
                    foreach ($sales as $sale) {
                        foreach ($sale->saleItems as $item) {
                            $costOfGoods += $item->product->buy_price * $item->quantity;
                        }
                    }
                    
                    $profit = $revenue - $costOfGoods;
                    $profitMargin = $revenue > 0 ? ($profit / $revenue) * 100 : 0;
                    
                    $profitData[] = [
                        'date' => $year . '-01-01',
                        'label' => (string) $year,
                        'revenue' => $revenue,
                        'cost' => $costOfGoods,
                        'profit' => $profit,
                        'profit_margin' => $profitMargin,
                    ];
                }
            }
            
            // Calculate summary
            $totalRevenue = array_sum(array_column($profitData, 'revenue'));
            $totalCost = array_sum(array_column($profitData, 'cost'));
            $totalProfit = array_sum(array_column($profitData, 'profit'));
            $avgProfitMargin = $totalRevenue > 0 ? ($totalProfit / $totalRevenue) * 100 : 0;

            $summary = [
                'total_revenue' => $totalRevenue,
                'total_cost' => $totalCost,
                'total_profit' => $totalProfit,
                'avg_profit_margin' => $avgProfitMargin,
            ];

            return response()->json([
                'status' => 'success',
                'data' => [
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                    'group_by' => $groupBy,
                    'summary' => $summary,
                    'profit_data' => $profitData,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate profit report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get inventory report.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function inventory(Request $request)
    {
        try {
            // Get inventory data
            $query = Product::with('category');
            
            // Filter by category
            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }
            
            // Filter by stock status
            if ($request->has('stock_status')) {
                switch ($request->stock_status) {
                    case 'low':
                        $query->whereRaw('stock <= min_stock');
                        break;
                    case 'out':
                        $query->where('stock', 0);
                        break;
                    case 'in':
                        $query->where('stock', '>', 0);
                        break;
                }
            }
            
            $products = $query->orderBy('name')->get();
            
            // Calculate inventory value
            $totalValue = 0;
            $lowStockCount = 0;
            $outOfStockCount = 0;
            
            foreach ($products as $product) {
                $product->inventory_value = $product->stock * $product->buy_price;
                $totalValue += $product->inventory_value;
                
                if ($product->stock <= $product->min_stock && $product->stock > 0) {
                    $lowStockCount++;
                }
                
                if ($product->stock === 0) {
                    $outOfStockCount++;
                }
            }
            
            // Group by category
            $categoriesData = [];
            $categories = Category::all();
            
            foreach ($categories as $category) {
                $categoryProducts = $products->where('category_id', $category->id);
                $categoryValue = $categoryProducts->sum('inventory_value');
                $categoryStock = $categoryProducts->sum('stock');
                
                if ($categoryProducts->count() > 0) {
                    $categoriesData[] = [
                        'id' => $category->id,
                        'name' => $category->name,
                        'product_count' => $categoryProducts->count(),
                        'stock_count' => $categoryStock,
                        'value' => $categoryValue,
                    ];
                }
            }
            
            // Handle uncategorized products
            $uncategorizedProducts = $products->whereNull('category_id');
            if ($uncategorizedProducts->count() > 0) {
                $uncategorizedValue = $uncategorizedProducts->sum('inventory_value');
                $uncategorizedStock = $uncategorizedProducts->sum('stock');
                
                $categoriesData[] = [
                    'id' => null,
                    'name' => 'Uncategorized',
                    'product_count' => $uncategorizedProducts->count(),
                    'stock_count' => $uncategorizedStock,
                    'value' => $uncategorizedValue,
                ];
            }
            
            // Sort categories by value
            usort($categoriesData, function($a, $b) {
                return $b['value'] <=> $a['value'];
            });
            
            // Summary
            $summary = [
                'total_products' => $products->count(),
                'total_stock' => $products->sum('stock'),
                'total_value' => $totalValue,
                'low_stock_count' => $lowStockCount,
                'out_of_stock_count' => $outOfStockCount,
            ];

            return response()->json([
                'status' => 'success',
                'data' => [
                    'summary' => $summary,
                    'categories' => $categoriesData,
                    'products' => $products
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate inventory report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get customer report.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function customers(Request $request)
    {
        try {
            // Set date range
            $endDate = $request->has('end_date') 
                ? Carbon::parse($request->end_date)->endOfDay() 
                : Carbon::now()->endOfDay();
                
            $startDate = $request->has('start_date') 
                ? Carbon::parse($request->start_date)->startOfDay() 
                : Carbon::now()->subMonths(3)->startOfDay();

            // Get customers with sales stats
            $customersData = DB::table('customers')
                ->leftJoin('sales', 'customers.id', '=', 'sales.customer_id')
                ->whereBetween('sales.created_at', [$startDate, $endDate])
                ->where('sales.payment_status', 'paid')
                ->select(
                    'customers.id',
                    'customers.name',
                    'customers.phone',
                    'customers.email',
                    DB::raw('COUNT(sales.id) as transaction_count'),
                    DB::raw('SUM(sales.final_amount) as total_spent'),
                    DB::raw('AVG(sales.final_amount) as avg_transaction')
                )
                ->groupBy('customers.id', 'customers.name', 'customers.phone', 'customers.email')
                ->orderBy('total_spent', 'desc')
                ->get();
            
            // Get total sales (including those without customer)
            $totalSales = Sale::whereBetween('created_at', [$startDate, $endDate])
                ->where('payment_status', 'paid')
                ->count();
                
            $totalRevenue = Sale::whereBetween('created_at', [$startDate, $endDate])
                ->where('payment_status', 'paid')
                ->sum('final_amount');
            
            // Get walk-in (no customer) sales
            $walkInCount = Sale::whereBetween('created_at', [$startDate, $endDate])
                ->whereNull('customer_id')
                ->where('payment_status', 'paid')
                ->count();
                
            $walkInTotal = Sale::whereBetween('created_at', [$startDate, $endDate])
                ->whereNull('customer_id')
                ->where('payment_status', 'paid')
                ->sum('final_amount');
            
            // Add walk-in to customers data if there are any
            if ($walkInCount > 0) {
                $walkInData = (object) [
                    'id' => null,
                    'name' => 'Walk-in Customers',
                    'phone' => null,
                    'email' => null,
                    'transaction_count' => $walkInCount,
                    'total_spent' => $walkInTotal,
                    'avg_transaction' => $walkInCount > 0 ? $walkInTotal / $walkInCount : 0,
                ];
                
                $customersData->prepend($walkInData);
            }
            
            // Summary
            $summary = [
                'total_customers' => Customer::count(),
                'active_customers' => $customersData->count(),
                'total_sales' => $totalSales,
                'total_revenue' => $totalRevenue,
            ];

            return response()->json([
                'status' => 'success',
                'data' => [
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                    'summary' => $summary,
                    'customers' => $customersData,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate customer report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get tax report.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function tax(Request $request)
    {
        try {
            // Set date range
            $endDate = $request->has('end_date') 
                ? Carbon::parse($request->end_date)->endOfDay() 
                : Carbon::now()->endOfDay();
                
            $startDate = $request->has('start_date') 
                ? Carbon::parse($request->start_date)->startOfDay() 
                : Carbon::now()->startOfMonth()->startOfDay();
            
            // Group by parameter (day, week, month, year)
            $groupBy = $request->group_by ?? 'day';
            $taxData = [];

            if ($groupBy === 'day') {
                $taxData = Sale::whereBetween('created_at', [$startDate, $endDate])
                    ->where('payment_status', 'paid')
                    ->select(
                        DB::raw('DATE(created_at) as date'),
                        DB::raw('SUM(tax_amount) as tax_amount'),
                        DB::raw('SUM(final_amount) as sales_amount')
                    )
                    ->groupBy(DB::raw('DATE(created_at)'))
                    ->orderBy('date')
                    ->get()
                    ->map(function ($item) {
                        return [
                            'date' => $item->date,
                            'label' => Carbon::parse($item->date)->format('d M'),
                            'tax_amount' => $item->tax_amount,
                            'sales_amount' => $item->sales_amount,
                            'percentage' => $item->sales_amount > 0 ? ($item->tax_amount / $item->sales_amount) * 100 : 0,
                        ];
                    });
            } elseif ($groupBy === 'month') {
                $taxData = Sale::whereBetween('created_at', [$startDate, $endDate])
                    ->where('payment_status', 'paid')
                    ->select(
                        DB::raw('YEAR(created_at) as year'),
                        DB::raw('MONTH(created_at) as month'),
                        DB::raw('SUM(tax_amount) as tax_amount'),
                        DB::raw('SUM(final_amount) as sales_amount')
                    )
                    ->groupBy('year', 'month')
                    ->orderBy('year')
                    ->orderBy('month')
                    ->get()
                    ->map(function ($item) {
                        return [
                            'date' => "{$item->year}-{$item->month}-01",
                            'label' => Carbon::createFromDate($item->year, $item->month, 1)->format('M Y'),
                            'tax_amount' => $item->tax_amount,
                            'sales_amount' => $item->sales_amount,
                            'percentage' => $item->sales_amount > 0 ? ($item->tax_amount / $item->sales_amount) * 100 : 0,
                        ];
                    });
            } else { // year
                $taxData = Sale::whereBetween('created_at', [$startDate, $endDate])
                    ->where('payment_status', 'paid')
                    ->select(
                        DB::raw('YEAR(created_at) as year'),
                        DB::raw('SUM(tax_amount) as tax_amount'),
                        DB::raw('SUM(final_amount) as sales_amount')
                    )
                    ->groupBy('year')
                    ->orderBy('year')
                    ->get()
                    ->map(function ($item) {
                        return [
                            'date' => "{$item->year}-01-01",
                            'label' => $item->year,
                            'tax_amount' => $item->tax_amount,
                            'sales_amount' => $item->sales_amount,
                            'percentage' => $item->sales_amount > 0 ? ($item->tax_amount / $item->sales_amount) * 100 : 0,
                        ];
                    });
            }

            $totalTax = array_sum(array_column($taxData->toArray(), 'tax_amount'));
            $totalSales = array_sum(array_column($taxData->toArray(), 'sales_amount'));
            $avgTaxPercentage = $totalSales > 0 ? ($totalTax / $totalSales) * 100 : 0;
            
            $summary = [
                'total_tax' => $totalTax,
                'total_sales' => $totalSales,
                'avg_tax_percentage' => $avgTaxPercentage,
            ];

            return response()->json([
                'status' => 'success',
                'data' => [
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                    'group_by' => $groupBy,
                    'summary' => $summary,
                    'tax_data' => $taxData,
                ]
            ]);
        }
        catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate tax report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function stockAdjustments(Request $request)
    {
        try {
            // Set date range
            $endDate = $request->has('end_date') 
                ? Carbon::parse($request->end_date)->endOfDay() 
                : Carbon::now()->endOfDay();
                
            $startDate = $request->has('start_date') 
                ? Carbon::parse($request->start_date)->startOfDay() 
                : Carbon::now()->startOfMonth()->startOfDay();
            
            // Optional filters
            $productId = $request->product_id;
            $supplierId = $request->supplier_id;
            $adjustmentType = $request->adjustment_type;
            $userId = $request->user_id;
            
            $query = StockAdjustment::with(['product', 'supplier', 'user'])
                ->whereBetween('created_at', [$startDate, $endDate]);
            
            // Apply filters
            if ($productId) {
                $query->where('product_id', $productId);
            }
            
            if ($supplierId) {
                $query->where('supplier_id', $supplierId);
            }
            
            if ($adjustmentType) {
                $query->where('adjustment_type', $adjustmentType);
            }
            
            if ($userId) {
                $query->where('user_id', $userId);
            }
            
            $adjustments = $query->orderBy('created_at', 'desc')->get();
            
            // Group by adjustment type
            $groupedByType = $adjustments->groupBy('adjustment_type')
                ->map(function ($items, $type) {
                    return [
                        'type' => $type,
                        'count' => $items->count(),
                        'total_quantity' => $items->sum('adjustment_quantity'),
                    ];
                })
                ->values();
            
            // Group by product
            $groupedByProduct = $adjustments->groupBy('product_id')
                ->map(function ($items, $productId) {
                    $product = $items->first()->product;
                    return [
                        'product_id' => $productId,
                        'product_name' => $product->name,
                        'product_code' => $product->code,
                        'count' => $items->count(),
                        'total_quantity' => $items->sum('adjustment_quantity'),
                    ];
                })
                ->sortByDesc('total_quantity')
                ->values();
            
            // Group by supplier (only for purchases)
            $purchaseAdjustments = $adjustments->where('adjustment_type', 'purchase');
            $groupedBySupplier = $purchaseAdjustments->groupBy('supplier_id')
                ->map(function ($items, $supplierId) {
                    $supplier = $items->first()->supplier;
                    return [
                        'supplier_id' => $supplierId,
                        'supplier_name' => $supplier ? $supplier->name : 'Unknown',
                        'count' => $items->count(),
                        'total_quantity' => $items->sum('adjustment_quantity'),
                    ];
                })
                ->sortByDesc('total_quantity')
                ->values();
            
            // Summary
            $summary = [
                'total_adjustments' => $adjustments->count(),
                'purchase_count' => $adjustments->where('adjustment_type', 'purchase')->count(),
                'loss_count' => $adjustments->where('adjustment_type', 'loss')->count(),
                'correction_count' => $adjustments->where('adjustment_type', 'correction')->count(),
                'return_count' => $adjustments->where('adjustment_type', 'return')->count(),
                'total_quantity' => $adjustments->sum('adjustment_quantity'),
            ];

            return response()->json([
                'status' => 'success',
                'data' => [
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                    'summary' => $summary,
                    'by_type' => $groupedByType,
                    'by_product' => $groupedByProduct,
                    'by_supplier' => $groupedBySupplier,
                    'adjustments' => $adjustments
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate stock adjustments report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get staff performance report.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function staffPerformance(Request $request)
    {
        try {
            // Set date range
            $endDate = $request->has('end_date') 
                ? Carbon::parse($request->end_date)->endOfDay() 
                : Carbon::now()->endOfDay();
                
            $startDate = $request->has('start_date') 
                ? Carbon::parse($request->start_date)->startOfDay() 
                : Carbon::now()->startOfMonth()->startOfDay();
            
            // Get staff sales data
            $staffData = DB::table('sales')
                ->join('users', 'sales.user_id', '=', 'users.id')
                ->whereBetween('sales.created_at', [$startDate, $endDate])
                ->where('sales.payment_status', 'paid')
                ->select(
                    'users.id',
                    'users.name',
                    'users.role',
                    DB::raw('COUNT(sales.id) as transaction_count'),
                    DB::raw('SUM(sales.final_amount) as total_sales'),
                    DB::raw('AVG(sales.final_amount) as avg_sale_value'),
                    DB::raw('MIN(sales.created_at) as first_sale'),
                    DB::raw('MAX(sales.created_at) as last_sale')
                )
                ->groupBy('users.id', 'users.name', 'users.role')
                ->orderBy('total_sales', 'desc')
                ->get();
                
            // Add additional metrics
            $staffData = $staffData->map(function ($staff) use ($startDate, $endDate) {
                // Calculate working days
                $firstSale = Carbon::parse($staff->first_sale);
                $lastSale = Carbon::parse($staff->last_sale);
                
                $firstDay = $firstSale->startOfDay()->max($startDate);
                $lastDay = $lastSale->endOfDay()->min($endDate);
                
                $workingDays = $firstDay->diffInDays($lastDay) + 1;
                
                // Sales per day
                $salesPerDay = $workingDays > 0 ? $staff->transaction_count / $workingDays : 0;
                $revenuePerDay = $workingDays > 0 ? $staff->total_sales / $workingDays : 0;
                
                return [
                    'id' => $staff->id,
                    'name' => $staff->name,
                    'role' => $staff->role,
                    'transaction_count' => $staff->transaction_count,
                    'total_sales' => $staff->total_sales,
                    'avg_sale_value' => $staff->avg_sale_value,
                    'working_days' => $workingDays,
                    'sales_per_day' => $salesPerDay,
                    'revenue_per_day' => $revenuePerDay,
                    'first_sale' => $staff->first_sale,
                    'last_sale' => $staff->last_sale,
                ];
            });
            
            // Total sales in period
            $totalSales = Sale::whereBetween('created_at', [$startDate, $endDate])
                ->where('payment_status', 'paid')
                ->count();
                
            $totalRevenue = Sale::whereBetween('created_at', [$startDate, $endDate])
                ->where('payment_status', 'paid')
                ->sum('final_amount');
            
            // Summary
            $summary = [
                'total_staff' => $staffData->count(),
                'total_sales' => $totalSales,
                'total_revenue' => $totalRevenue,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'date_range_days' => $startDate->diffInDays($endDate) + 1,
            ];

            return response()->json([
                'status' => 'success',
                'data' => [
                    'summary' => $summary,
                    'staff' => $staffData
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate staff performance report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dashboard overview statistics.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function dashboard(Request $request)
    {
        try {
            // Date ranges
            $today = Carbon::today();
            $yesterday = Carbon::yesterday();
            $startOfWeek = Carbon::now()->startOfWeek();
            $startOfMonth = Carbon::now()->startOfMonth();
            $startOfPrevMonth = Carbon::now()->subMonth()->startOfMonth();
            $endOfPrevMonth = Carbon::now()->subMonth()->endOfMonth();
            
            // Today's sales
            $todaySales = Sale::whereDate('created_at', $today)->where('payment_status', 'paid')->sum('final_amount');
            $todayCount = Sale::whereDate('created_at', $today)->where('payment_status', 'paid')->count();
            
            // Yesterday's sales
            $yesterdaySales = Sale::whereDate('created_at', $yesterday)->where('payment_status', 'paid')->sum('final_amount');
            $yesterdayCount = Sale::whereDate('created_at', $yesterday)->where('payment_status', 'paid')->count();
            
            // This week's sales
            $weekSales = Sale::where('created_at', '>=', $startOfWeek)->where('payment_status', 'paid')->sum('final_amount');
            $weekCount = Sale::where('created_at', '>=', $startOfWeek)->where('payment_status', 'paid')->count();
            
            // This month's sales
            $monthSales = Sale::where('created_at', '>=', $startOfMonth)->where('payment_status', 'paid')->sum('final_amount');
            $monthCount = Sale::where('created_at', '>=', $startOfMonth)->where('payment_status', 'paid')->count();
            
            // Previous month's sales
            $prevMonthSales = Sale::whereBetween('created_at', [$startOfPrevMonth, $endOfPrevMonth])
                ->where('payment_status', 'paid')
                ->sum('final_amount');
            $prevMonthCount = Sale::whereBetween('created_at', [$startOfPrevMonth, $endOfPrevMonth])
                ->where('payment_status', 'paid')
                ->count();
            
            // Month-over-month growth
            $salesGrowth = $prevMonthSales > 0 ? (($monthSales - $prevMonthSales) / $prevMonthSales) * 100 : 0;
            $countGrowth = $prevMonthCount > 0 ? (($monthCount - $prevMonthCount) / $prevMonthCount) * 100 : 0;
            
            // Recent sales for chart (last 14 days)
            $last14Days = Carbon::now()->subDays(13);
            $dailySales = Sale::where('created_at', '>=', $last14Days)
                ->where('payment_status', 'paid')
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('SUM(final_amount) as total')
                )
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('date')
                ->get()
                ->map(function ($item) {
                    return [
                        'date' => $item->date,
                        'label' => Carbon::parse($item->date)->format('d M'),
                        'total' => $item->total,
                    ];
                });
            
            // Fill in any missing days with zero
            $salesByDay = [];
            $checkDate = $last14Days->copy();
            while ($checkDate <= Carbon::now()) {
                $dateStr = $checkDate->format('Y-m-d');
                $found = false;
                
                foreach ($dailySales as $sale) {
                    if ($sale['date'] === $dateStr) {
                        $salesByDay[] = $sale;
                        $found = true;
                        break;
                    }
                }
                
                if (!$found) {
                    $salesByDay[] = [
                        'date' => $dateStr,
                        'label' => $checkDate->format('d M'),
                        'total' => 0,
                    ];
                }
                
                $checkDate->addDay();
            }
            
            // Low stock products
            $lowStockProducts = Product::whereRaw('stock <= min_stock')
                ->where('is_active', true)
                ->orderBy('stock')
                ->limit(5)
                ->get();
            
            // Recent transactions
            $recentTransactions = Sale::with(['user', 'customer', 'paymentMethod'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();
            
            // Top selling products (last 30 days)
            $last30Days = Carbon::now()->subDays(29);
            $topProducts = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->whereBetween('sales.created_at', [$last30Days, Carbon::now()])
                ->where('sales.payment_status', 'paid')
                ->select(
                    'products.id',
                    'products.name',
                    'products.code',
                    DB::raw('SUM(sale_items.quantity) as quantity'),
                    DB::raw('SUM(sale_items.subtotal) as total')
                )
                ->groupBy('products.id', 'products.name', 'products.code')
                ->orderBy('quantity', 'desc')
                ->limit(5)
                ->get();
            
            // Data for summary
            $summary = [
                'today_sales' => $todaySales,
                'today_count' => $todayCount,
                'yesterday_sales' => $yesterdaySales,
                'yesterday_count' => $yesterdayCount,
                'week_sales' => $weekSales,
                'week_count' => $weekCount,
                'month_sales' => $monthSales,
                'month_count' => $monthCount,
                'prev_month_sales' => $prevMonthSales,
                'prev_month_count' => $prevMonthCount,
                'sales_growth' => $salesGrowth,
                'count_growth' => $countGrowth,
                'total_products' => Product::where('is_active', true)->count(),
                'low_stock_count' => Product::whereRaw('stock <= min_stock')->where('is_active', true)->count(),
                'out_of_stock_count' => Product::where('stock', 0)->where('is_active', true)->count(),
                'total_customers' => Customer::count(),
            ];

            return response()->json([
                'status' => 'success',
                'data' => [
                    'summary' => $summary,
                    'sales_by_day' => $salesByDay,
                    'low_stock_products' => $lowStockProducts,
                    'recent_transactions' => $recentTransactions,
                    'top_products' => $topProducts,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate dashboard data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}           