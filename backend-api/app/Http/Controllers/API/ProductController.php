<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    /**
     * Display a listing of the products.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $query = Product::with('category');

            // Search by name, code, or barcode
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%")
                      ->orWhere('barcode', 'like', "%{$search}%");
                });
            }

            // Filter by category
            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            // Filter by active status
            if ($request->has('is_active')) {
                $active = $request->is_active === 'true' || $request->is_active === '1';
                $query->where('is_active', $active);
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

            // Sorting
            $sortField = $request->sort_by ?? 'name';
            $sortDirection = $request->sort_direction ?? 'asc';
            
            // Validate sort field to prevent SQL injection
            $allowedSortFields = ['name', 'code', 'barcode', 'sell_price', 'buy_price', 'stock', 'created_at', 'updated_at'];
            if (!in_array($sortField, $allowedSortFields)) {
                $sortField = 'name';
            }
            
            $query->orderBy($sortField, $sortDirection === 'desc' ? 'desc' : 'asc');

            // Pagination
            $perPage = $request->per_page ?? 15;
            $products = $query->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $products
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created product in storage.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:100',
                'code' => 'required|string|max:50|unique:products',
                'barcode' => 'nullable|string|max:100|unique:products',
                'description' => 'nullable|string',
                'category_id' => 'required|exists:categories,id',
                'buy_price' => 'required|numeric|min:0',
                'sell_price' => 'required|numeric|min:0',
                'stock' => 'required|integer|min:0',
                'min_stock' => 'required|integer|min:0',
                'is_active' => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Generate code if not provided
            if (empty($request->code)) {
                $prefix = 'P';
                $count = Product::count() + 1;
                $request->merge(['code' => $prefix . str_pad($count, 4, '0', STR_PAD_LEFT)]);
            }

            $product = Product::create([
                'name' => $request->name,
                'code' => $request->code,
                'barcode' => $request->barcode,
                'description' => $request->description,
                'category_id' => $request->category_id,
                'buy_price' => $request->buy_price,
                'sell_price' => $request->sell_price,
                'stock' => $request->stock,
                'min_stock' => $request->min_stock,
                'is_active' => $request->has('is_active') ? $request->is_active : true,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Product created successfully',
                'data' => $product->load('category')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified product.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $product = Product::with('category')->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'data' => $product
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Product not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified product in storage.
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $product = Product::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:100',
                'code' => "sometimes|required|string|max:50|unique:products,code,{$id}",
                'barcode' => "nullable|string|max:100|unique:products,barcode,{$id}",
                'description' => 'nullable|string',
                'category_id' => 'sometimes|required|exists:categories,id',
                'buy_price' => 'sometimes|required|numeric|min:0',
                'sell_price' => 'sometimes|required|numeric|min:0',
                'min_stock' => 'sometimes|required|integer|min:0',
                'is_active' => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update product fields
            if ($request->has('name')) {
                $product->name = $request->name;
            }
            
            if ($request->has('code')) {
                $product->code = $request->code;
            }
            
            if ($request->has('barcode')) {
                $product->barcode = $request->barcode;
            }
            
            if ($request->has('description')) {
                $product->description = $request->description;
            }
            
            if ($request->has('category_id')) {
                $product->category_id = $request->category_id;
            }
            
            if ($request->has('buy_price')) {
                $product->buy_price = $request->buy_price;
            }
            
            if ($request->has('sell_price')) {
                $product->sell_price = $request->sell_price;
            }
            
            if ($request->has('min_stock')) {
                $product->min_stock = $request->min_stock;
            }
            
            if ($request->has('is_active')) {
                $product->is_active = $request->is_active;
            }

            $product->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Product updated successfully',
                'data' => $product->fresh(['category'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update product',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }

    /**
     * Remove the specified product from storage.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $product = Product::findOrFail($id);

            // Check if product has been used in sales or stock adjustments
            if ($product->saleItems()->exists() || $product->stockAdjustments()->exists()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot delete product that has been used in transactions'
                ], 422);
            }

            $product->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Product deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete product',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }

    /**
     * Display a listing of the products with low stock.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function lowStock()
    {
        try {
            $products = Product::with('category')
                        ->whereRaw('stock <= min_stock')
                        ->where('is_active', true)
                        ->orderBy('stock', 'asc')
                        ->get();

            return response()->json([
                'status' => 'success',
                'data' => $products
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve low stock products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search for products by name, code or barcode.
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

            $products = Product::with('category')
                        ->where('is_active', true)
                        ->where(function($q) use ($query) {
                            $q->where('name', 'like', "%{$query}%")
                              ->orWhere('code', 'like', "%{$query}%")
                              ->orWhere('barcode', 'like', "%{$query}%");
                        })
                        ->orderBy('name', 'asc')
                        ->take(10)
                        ->get();

            return response()->json([
                'status' => 'success',
                'data' => $products
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to search products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get product by barcode.
     *
     * @param string $barcode
     * @return \Illuminate\Http\JsonResponse
     */
    public function getByBarcode($barcode)
    {
        try {
            $product = Product::with('category')
                       ->where('barcode', $barcode)
                       ->where('is_active', true)
                       ->first();

            if (!$product) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Product not found with the provided barcode'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => $product
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve product',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}