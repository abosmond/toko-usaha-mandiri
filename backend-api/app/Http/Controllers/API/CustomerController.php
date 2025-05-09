<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CustomerController extends Controller
{
    /**
     * Display a listing of the customers.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $query = Customer::query();

            // Search by name, phone, or email
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Include sales count if requested
            if ($request->has('with_sales_count') && $request->with_sales_count) {
                $query->withCount('sales');
            }

            // Pagination
            $perPage = $request->per_page ?? 15;
            $customers = $query->orderBy('name', 'asc')->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $customers
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve customers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created customer in storage.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:100',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:100|unique:customers',
                'address' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $customer = Customer::create([
                'name' => $request->name,
                'phone' => $request->phone,
                'email' => $request->email,
                'address' => $request->address,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Customer created successfully',
                'data' => $customer
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create customer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified customer.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $customer = Customer::withCount('sales')->findOrFail($id);

            // Get additional stats
            $customer->total_spent = $customer->totalSpent();
            $customer->transaction_count = $customer->transactionCount();

            return response()->json([
                'status' => 'success',
                'data' => $customer
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Customer not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified customer in storage.
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $customer = Customer::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:100',
                'phone' => 'nullable|string|max:20',
                'email' => "nullable|email|max:100|unique:customers,email,{$id}",
                'address' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update customer data
            if ($request->has('name')) {
                $customer->name = $request->name;
            }
            
            if ($request->has('phone')) {
                $customer->phone = $request->phone;
            }
            
            if ($request->has('email')) {
                $customer->email = $request->email;
            }
            
            if ($request->has('address')) {
                $customer->address = $request->address;
            }

            $customer->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Customer updated successfully',
                'data' => $customer
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update customer',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }

    /**
     * Remove the specified customer from storage.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $customer = Customer::findOrFail($id);

            // Check if the customer has sales
            if ($customer->sales()->exists()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot delete customer with associated sales'
                ], 422);
            }

            $customer->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Customer deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete customer',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }

    /**
     * Get sales for a specific customer
     *
     * @param int $id
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sales($id, Request $request)
    {
        try {
            $customer = Customer::findOrFail($id);
            
            $query = $customer->sales()->with(['user', 'paymentMethod', 'saleItems.product']);
            
            // Apply date range filter
            if ($request->has('start_date') && $request->has('end_date')) {
                $startDate = $request->start_date . ' 00:00:00';
                $endDate = $request->end_date . ' 23:59:59';
                $query->whereBetween('created_at', [$startDate, $endDate]);
            }
            
            // Apply payment status filter
            if ($request->has('payment_status')) {
                $query->where('payment_status', $request->payment_status);
            }
            
            // Pagination
            $perPage = $request->per_page ?? 15;
            $sales = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'customer' => $customer,
                    'sales' => $sales
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve customer sales',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }

    /**
     * Search for customers by name, phone or email.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function search(Request $request)
    {
        try {
            $query = $request->q;
            
            if (empty($query)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Search query is required'
                ], 422);
            }

            $customers = Customer::where(function($q) use ($query) {
                            $q->where('name', 'like', "%{$query}%")
                              ->orWhere('phone', 'like', "%{$query}%")
                              ->orWhere('email', 'like', "%{$query}%");
                        })
                        ->orderBy('name', 'asc')
                        ->take(10)
                        ->get();

            return response()->json([
                'status' => 'success',
                'data' => $customers
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to search customers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get customer spending statistics
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function statistics($id)
    {
        try {
            $customer = Customer::findOrFail($id);
            
            // Total spent
            $totalSpent = $customer->totalSpent();
            
            // Transaction count
            $transactionCount = $customer->transactionCount();
            
            // Average transaction amount
            $averageTransaction = $transactionCount > 0 ? $totalSpent / $transactionCount : 0;
            
            // First purchase date
            $firstPurchase = $customer->sales()->orderBy('created_at', 'asc')->first();
            $firstPurchaseDate = $firstPurchase ? $firstPurchase->created_at : null;
            
            // Last purchase date
            $lastPurchase = $customer->sales()->orderBy('created_at', 'desc')->first();
            $lastPurchaseDate = $lastPurchase ? $lastPurchase->created_at : null;
            
            // Most purchased product
            $mostPurchasedProduct = null;
            $productCounts = [];
            
            foreach ($customer->sales as $sale) {
                foreach ($sale->saleItems as $item) {
                    $productId = $item->product_id;
                    if (!isset($productCounts[$productId])) {
                        $productCounts[$productId] = [
                            'product' => $item->product,
                            'quantity' => 0
                        ];
                    }
                    $productCounts[$productId]['quantity'] += $item->quantity;
                }
            }
            
            if (!empty($productCounts)) {
                usort($productCounts, function($a, $b) {
                    return $b['quantity'] - $a['quantity'];
                });
                $mostPurchasedProduct = $productCounts[0];
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'customer' => [
                        'id' => $customer->id,
                        'name' => $customer->name
                    ],
                    'statistics' => [
                        'total_spent' => $totalSpent,
                        'transaction_count' => $transactionCount,
                        'average_transaction' => $averageTransaction,
                        'first_purchase_date' => $firstPurchaseDate,
                        'last_purchase_date' => $lastPurchaseDate,
                        'most_purchased_product' => $mostPurchasedProduct
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve customer statistics',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }
}