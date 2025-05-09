<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\StockAdjustment;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class StockController extends Controller
{
    /**
     * Display a listing of the stock adjustments.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $query = StockAdjustment::with(['product', 'supplier', 'user']);

            // Filter by adjustment type
            if ($request->has('type') && in_array($request->type, ['purchase', 'loss', 'correction', 'return'])) {
                $query->where('adjustment_type', $request->type);
            }

            // Filter by product
            if ($request->has('product_id')) {
                $query->where('product_id', $request->product_id);
            }

            // Filter by supplier
            if ($request->has('supplier_id')) {
                $query->where('supplier_id', $request->supplier_id);
            }

            // Filter by user
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            // Filter by date range
            if ($request->has('start_date') && $request->has('end_date')) {
                $startDate = Carbon::parse($request->start_date)->startOfDay();
                $endDate = Carbon::parse($request->end_date)->endOfDay();
                $query->whereBetween('created_at', [$startDate, $endDate]);
            } elseif ($request->has('start_date')) {
                $startDate = Carbon::parse($request->start_date)->startOfDay();
                $query->where('created_at', '>=', $startDate);
            } elseif ($request->has('end_date')) {
                $endDate = Carbon::parse($request->end_date)->endOfDay();
                $query->where('created_at', '<=', $endDate);
            }

            // Set default ordering to latest first
            $query->orderBy('created_at', 'desc');

            // Pagination
            $perPage = $request->per_page ?? 15;
            $adjustments = $query->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $adjustments
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve stock adjustments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created stock adjustment in storage.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            // Validation rules
            $validationRules = [
                'product_id' => 'required|exists:products,id',
                'adjustment_quantity' => 'required|integer|not_in:0',
                'adjustment_type' => 'required|in:purchase,loss,correction,return',
                'notes' => 'nullable|string',
            ];

            // Add supplier validation only for purchase
            if ($request->adjustment_type === 'purchase') {
                $validationRules['supplier_id'] = 'required|exists:suppliers,id';
                
                // Ensure quantity is positive for purchases
                $validationRules['adjustment_quantity'] = 'required|integer|min:1';
            } elseif ($request->adjustment_type === 'loss' || $request->adjustment_type === 'return') {
                // Ensure quantity is negative for losses and returns
                $validationRules['adjustment_quantity'] = 'required|integer|max:-1';
            }

            $validator = Validator::make($request->all(), $validationRules);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Retrieve the product
            $product = Product::findOrFail($request->product_id);
            
            // Calculate the new stock level
            $previousStock = $product->stock;
            $newStock = $previousStock + $request->adjustment_quantity;
            
            // Prevent negative stock
            if ($newStock < 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'The adjustment would result in negative stock',
                    'current_stock' => $previousStock,
                    'adjustment' => $request->adjustment_quantity,
                    'result' => $newStock
                ], 422);
            }

            // Start a database transaction
            DB::beginTransaction();
            
            try {
                // Create the stock adjustment record
                $adjustment = StockAdjustment::create([
                    'product_id' => $request->product_id,
                    'previous_stock' => $previousStock,
                    'adjustment_quantity' => $request->adjustment_quantity,
                    'new_stock' => $newStock,
                    'adjustment_type' => $request->adjustment_type,
                    'supplier_id' => $request->has('supplier_id') ? $request->supplier_id : null,
                    'notes' => $request->notes,
                    'user_id' => Auth::id(),
                    'created_at' => now(),
                ]);
                
                // Update the product stock
                $product->stock = $newStock;
                $product->save();
                
                // Commit the transaction
                DB::commit();
                
                // Load relationships
                $adjustment->load(['product', 'supplier', 'user']);
                
                return response()->json([
                    'status' => 'success',
                    'message' => 'Stock adjustment created successfully',
                    'data' => $adjustment
                ], 201);
            } catch (\Exception $e) {
                // Roll back the transaction if an error occurs
                DB::rollback();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create stock adjustment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified stock adjustment.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $adjustment = StockAdjustment::with(['product', 'supplier', 'user'])->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'data' => $adjustment
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Stock adjustment not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Display stock adjustments for a specific product.
     *
     * @param int $productId
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function productAdjustments($productId, Request $request)
    {
        try {
            // Check if product exists
            if (!Product::where('id', $productId)->exists()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Product not found'
                ], 404);
            }

            $query = StockAdjustment::with(['supplier', 'user'])
                      ->where('product_id', $productId);

            // Filter by adjustment type
            if ($request->has('type') && in_array($request->type, ['purchase', 'loss', 'correction', 'return'])) {
                $query->where('adjustment_type', $request->type);
            }

            // Filter by date range
            if ($request->has('start_date') && $request->has('end_date')) {
                $startDate = Carbon::parse($request->start_date)->startOfDay();
                $endDate = Carbon::parse($request->end_date)->endOfDay();
                $query->whereBetween('created_at', [$startDate, $endDate]);
            }

            // Set default ordering to latest first
            $query->orderBy('created_at', 'desc');

            // Pagination
            $perPage = $request->per_page ?? 15;
            $adjustments = $query->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $adjustments
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve product stock adjustments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get monthly statistics for purchases, losses, and returns.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function monthlyStats()
    {
        try {
            $startOfMonth = Carbon::now()->startOfMonth();
            $endOfMonth = Carbon::now()->endOfMonth();

            // Get monthly purchase count
            $purchases = StockAdjustment::where('adjustment_type', 'purchase')
                           ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                           ->count();

            // Get monthly loss count
            $losses = StockAdjustment::where('adjustment_type', 'loss')
                        ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                        ->count();

            // Get monthly return count
            $returns = StockAdjustment::where('adjustment_type', 'return')
                         ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                         ->count();

            // Get monthly correction count
            $corrections = StockAdjustment::where('adjustment_type', 'correction')
                             ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                             ->count();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'month' => Carbon::now()->format('F Y'),
                    'purchases' => $purchases,
                    'losses' => $losses,
                    'returns' => $returns,
                    'corrections' => $corrections,
                    'total' => $purchases + $losses + $returns + $corrections
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve monthly statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get stock movement history data for a specific period.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function movementHistory(Request $request)
    {
        try {
            // Default to last 30 days if no date range provided
            $endDate = $request->has('end_date') 
                ? Carbon::parse($request->end_date)->endOfDay() 
                : Carbon::now()->endOfDay();
                
            $startDate = $request->has('start_date') 
                ? Carbon::parse($request->start_date)->startOfDay() 
                : Carbon::now()->subDays(30)->startOfDay();

            // Get adjustments grouped by type and date
            $movements = StockAdjustment::select(
                DB::raw('DATE(created_at) as date'),
                'adjustment_type',
                DB::raw('SUM(adjustment_quantity) as total_quantity'),
                DB::raw('COUNT(*) as count')
            )
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('date', 'adjustment_type')
            ->orderBy('date', 'asc')
            ->get();

            // Format the data for easier frontend consumption
            $formattedData = [];
            $dateRange = [];
            
            // Create date range array
            for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
                $dateString = $date->format('Y-m-d');
                $dateRange[$dateString] = [
                    'date' => $dateString,
                    'formatted_date' => $date->format('d M Y'),
                    'purchase' => 0,
                    'loss' => 0,
                    'return' => 0,
                    'correction' => 0,
                ];
            }
            
            // Fill in the actual data
            foreach ($movements as $movement) {
                $dateString = $movement->date;
                if (isset($dateRange[$dateString])) {
                    $dateRange[$dateString][$movement->adjustment_type] = $movement->total_quantity;
                }
            }
            
            // Convert to indexed array
            $formattedData = array_values($dateRange);

            return response()->json([
                'status' => 'success',
                'data' => $formattedData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve stock movement history',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}