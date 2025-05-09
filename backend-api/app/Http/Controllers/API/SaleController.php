<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class SaleController extends Controller
{
    /**
     * Display a listing of the sales.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $query = Sale::with(['user', 'customer', 'paymentMethod']);

            // Search by invoice number
            if ($request->has('search')) {
                $search = $request->search;
                $query->where('invoice_number', 'like', "%{$search}%");
            }

            // Filter by customer
            if ($request->has('customer_id')) {
                $query->where('customer_id', $request->customer_id);
            }

            // Filter by payment method
            if ($request->has('payment_method_id')) {
                $query->where('payment_method_id', $request->payment_method_id);
            }

            // Filter by payment status
            if ($request->has('payment_status')) {
                $query->where('payment_status', $request->payment_status);
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

            // Include sale items if requested
            if ($request->has('with_items') && $request->with_items) {
                $query->with('saleItems.product');
            }

            // Set default ordering to latest first
            $query->orderBy('created_at', 'desc');

            // Pagination
            $perPage = $request->per_page ?? 15;
            $sales = $query->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $sales
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve sales',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created sale in storage.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|exists:products,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.discount_percent' => 'nullable|numeric|min:0|max:100',
                'customer_id' => 'nullable|exists:customers,id',
                'payment_method_id' => 'required|exists:payment_methods,id',
                'payment_status' => 'required|in:paid,pending,cancelled',
                'discount_amount' => 'nullable|numeric|min:0',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Start transaction
            DB::beginTransaction();

            try {
                // Generate invoice number
                $lastSale = Sale::latest()->first();
                $lastInvoiceNumber = $lastSale ? $lastSale->invoice_number : 'INV-0000';
                $lastNumber = (int) substr($lastInvoiceNumber, 4);
                $invoiceNumber = 'INV-' . str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);

                // Calculate tax
                $settings = Setting::first();
                $taxPercentage = $settings ? $settings->tax_percentage : 0;

                // Create sale
                $sale = new Sale();
                $sale->invoice_number = $invoiceNumber;
                $sale->customer_id = $request->customer_id;
                $sale->payment_method_id = $request->payment_method_id;
                $sale->payment_status = $request->payment_status;
                $sale->notes = $request->notes;
                $sale->user_id = Auth::id();

                // Initialize totals
                $totalAmount = 0;
                $discountAmount = $request->discount_amount ?? 0;
                $taxAmount = 0;

                // Save sale first to get ID
                $sale->save();

                // Process items
                foreach ($request->items as $item) {
                    $product = Product::findOrFail($item['product_id']);
                    
                    // Check stock availability
                    if ($product->stock < $item['quantity']) {
                        DB::rollBack();
                        return response()->json([
                            'status' => 'error',
                            'message' => "Insufficient stock for product {$product->name}. Available: {$product->stock}",
                        ], 422);
                    }

                    // Calculate item subtotal
                    $discountPercent = isset($item['discount_percent']) ? $item['discount_percent'] : 0;
                    $unitPrice = $product->sell_price;
                    $subtotal = $unitPrice * $item['quantity'] * (1 - $discountPercent / 100);
                    
                    // Add to total
                    $totalAmount += $subtotal;

                    // Create sale item
                    $saleItem = new SaleItem();
                    $saleItem->sale_id = $sale->id;
                    $saleItem->product_id = $product->id;
                    $saleItem->quantity = $item['quantity'];
                    $saleItem->unit_price = $unitPrice;
                    $saleItem->discount_percent = $discountPercent;
                    $saleItem->subtotal = $subtotal;
                    $saleItem->save();

                    // Update product stock
                    $product->stock -= $item['quantity'];
                    $product->save();
                }

                // Calculate tax amount
                $taxAmount = ($totalAmount - $discountAmount) * ($taxPercentage / 100);
                
                // Calculate final amount
                $finalAmount = $totalAmount - $discountAmount + $taxAmount;

                // Update sale with totals
                $sale->total_amount = $totalAmount;
                $sale->discount_amount = $discountAmount;
                $sale->tax_amount = $taxAmount;
                $sale->final_amount = $finalAmount;
                $sale->save();

                // Commit transaction
                DB::commit();

                // Load relationships for response
                $sale->load(['customer', 'paymentMethod', 'user', 'saleItems.product']);

                return response()->json([
                    'status' => 'success',
                    'message' => 'Sale created successfully',
                    'data' => $sale
                ], 201);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create sale',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified sale.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $sale = Sale::with(['customer', 'paymentMethod', 'user', 'saleItems.product'])->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'data' => $sale
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Sale not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified sale in storage.
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $sale = Sale::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'customer_id' => 'nullable|exists:customers,id',
                'payment_method_id' => 'sometimes|exists:payment_methods,id',
                'payment_status' => 'sometimes|in:paid,pending,cancelled',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Only allow updating customer, payment method, payment status, and notes
            if ($request->has('customer_id')) {
                $sale->customer_id = $request->customer_id;
            }
            
            if ($request->has('payment_method_id')) {
                $sale->payment_method_id = $request->payment_method_id;
            }
            
            if ($request->has('payment_status')) {
                $sale->payment_status = $request->payment_status;
            }
            
            if ($request->has('notes')) {
                $sale->notes = $request->notes;
            }

            $sale->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Sale updated successfully',
                'data' => $sale->load(['customer', 'paymentMethod', 'user', 'saleItems.product'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update sale',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }

    /**
     * Mark a sale as cancelled and return inventory.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function cancel($id)
    {
        try {
            $sale = Sale::with('saleItems.product')->findOrFail($id);

            // Check if already cancelled
            if ($sale->payment_status === 'cancelled') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Sale is already cancelled'
                ], 422);
            }

            // Start transaction
            DB::beginTransaction();

            try {
                // Update sale status
                $sale->payment_status = 'cancelled';
                $sale->save();

                // Return inventory
                foreach ($sale->saleItems as $item) {
                    $product = $item->product;
                    $product->stock += $item->quantity;
                    $product->save();
                }

                // Commit transaction
                DB::commit();

                return response()->json([
                    'status' => 'success',
                    'message' => 'Sale cancelled successfully',
                    'data' => $sale->load(['customer', 'paymentMethod', 'user'])
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to cancel sale',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }

    /**
     * Get daily sales totals.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function daily(Request $request)
    {
        try {
            // Get date, default to today
            $date = $request->has('date') ? Carbon::parse($request->date) : Carbon::today();
            $startOfDay = $date->copy()->startOfDay();
            $endOfDay = $date->copy()->endOfDay();

            // Get sales for the day
            $sales = Sale::whereBetween('created_at', [$startOfDay, $endOfDay])
                      ->where('payment_status', 'paid')
                      ->get();

            // Calculate totals
            $totalSales = $sales->count();
            $totalAmount = $sales->sum('final_amount');
            $totalItems = 0;

            foreach ($sales as $sale) {
                $totalItems += $sale->saleItems->sum('quantity');
            }

            // Get payment method breakdown
            $paymentMethodBreakdown = Sale::whereBetween('created_at', [$startOfDay, $endOfDay])
                                   ->where('payment_status', 'paid')
                                   ->select('payment_method_id', DB::raw('count(*) as count'), DB::raw('sum(final_amount) as total'))
                                   ->groupBy('payment_method_id')
                                   ->get()
                                   ->map(function ($item) {
                                       $paymentMethod = PaymentMethod::find($item->payment_method_id);
                                       return [
                                           'payment_method' => $paymentMethod ? $paymentMethod->name : 'Unknown',
                                           'payment_method_id' => $item->payment_method_id,
                                           'count' => $item->count,
                                           'total' => $item->total,
                                       ];
                                   });

            // Get hourly sales count
            $hourlySales = [];
            for ($hour = 0; $hour < 24; $hour++) {
                $startHour = $date->copy()->startOfDay()->addHours($hour);
                $endHour = $startHour->copy()->addHour();
                
                $count = Sale::whereBetween('created_at', [$startHour, $endHour])
                         ->where('payment_status', 'paid')
                         ->count();
                         
                $amount = Sale::whereBetween('created_at', [$startHour, $endHour])
                          ->where('payment_status', 'paid')
                          ->sum('final_amount');
                
                $hourlySales[] = [
                    'hour' => $hour,
                    'time' => $startHour->format('H:i'),
                    'count' => $count,
                    'amount' => $amount
                ];
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'date' => $date->format('Y-m-d'),
                    'total_sales' => $totalSales,
                    'total_amount' => $totalAmount,
                    'total_items' => $totalItems,
                    'payment_methods' => $paymentMethodBreakdown,
                    'hourly_sales' => $hourlySales
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve daily sales',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get payment methods.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function paymentMethods()
    {
        try {
            $paymentMethods = PaymentMethod::where('is_active', true)->get();

            return response()->json([
                'status' => 'success',
                'data' => $paymentMethods
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve payment methods',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get latest sales.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function latest(Request $request)
    {
        try {
            $limit = $request->limit ?? 10;
            $sales = Sale::with(['customer', 'paymentMethod', 'saleItems.product'])
                      ->orderBy('created_at', 'desc')
                      ->limit($limit)
                      ->get();

            return response()->json([
                'status' => 'success',
                'data' => $sales
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve latest sales',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate receipt data for a sale.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function receipt($id)
    {
        try {
            $sale = Sale::with(['customer', 'paymentMethod', 'user', 'saleItems.product'])->findOrFail($id);
            
            // Get store settings
            $settings = Setting::first();
            
            // Format receipt data
            $receipt = [
                'store' => [
                    'name' => $settings ? $settings->store_name : 'POS Store',
                    'address' => $settings ? $settings->address : '',
                    'phone' => $settings ? $settings->phone : '',
                    'email' => $settings ? $settings->email : '',
                ],
                'sale' => [
                    'invoice_number' => $sale->invoice_number,
                    'date' => $sale->created_at->format('Y-m-d H:i:s'),
                    'cashier' => $sale->user->name,
                    'customer' => $sale->customer ? $sale->customer->name : 'Walk-in Customer',
                    'payment_method' => $sale->paymentMethod->name,
                    'payment_status' => $sale->payment_status,
                ],
                'items' => $sale->saleItems->map(function ($item) {
                    return [
                        'name' => $item->product->name,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'discount_percent' => $item->discount_percent,
                        'subtotal' => $item->subtotal,
                    ];
                }),
                'totals' => [
                    'subtotal' => $sale->total_amount,
                    'discount' => $sale->discount_amount,
                    'tax' => $sale->tax_amount,
                    'total' => $sale->final_amount,
                ],
                'footer' => $settings ? $settings->receipt_footer : 'Thank you for your purchase!',
            ];

            return response()->json([
                'status' => 'success',
                'data' => $receipt
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate receipt',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }
}