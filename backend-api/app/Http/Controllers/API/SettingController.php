<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class SettingController extends Controller
{
    /**
     * Get all store settings.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $settings = Setting::first();
            
            if (!$settings) {
                // Create default settings if none exist
                $settings = Setting::create([
                    'store_name' => 'My Store',
                    'address' => '',
                    'phone' => '',
                    'email' => '',
                    'tax_percentage' => 0,
                    'receipt_footer' => 'Thank you for shopping with us!',
                    'currency' => 'IDR',
                    'logo_path' => null,
                ]);
            }
            
            // Format settings response
            $response = $settings->toArray();
            
            // Add logo URL if logo exists
            if ($settings->logo_path) {
                $response['logo_url'] = url(Storage::url($settings->logo_path));
            } else {
                $response['logo_url'] = null;
            }
            
            return response()->json([
                'status' => 'success',
                'data' => $response
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update store settings.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request)
    {
        try {
            // Validate input
            $validator = Validator::make($request->all(), [
                'store_name' => 'required|string|max:100',
                'address' => 'nullable|string',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:100',
                'tax_percentage' => 'nullable|numeric|min:0|max:100',
                'receipt_footer' => 'nullable|string',
                'currency' => 'nullable|string|max:10',
                'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get settings
            $settings = Setting::first();
            
            if (!$settings) {
                $settings = new Setting();
            }
            
            // Update basic settings
            $settings->store_name = $request->store_name;
            $settings->address = $request->address ?? $settings->address;
            $settings->phone = $request->phone ?? $settings->phone;
            $settings->email = $request->email ?? $settings->email;
            $settings->tax_percentage = $request->tax_percentage ?? $settings->tax_percentage;
            $settings->receipt_footer = $request->receipt_footer ?? $settings->receipt_footer;
            $settings->currency = $request->currency ?? $settings->currency;
            
            // Handle logo upload if provided
            if ($request->hasFile('logo')) {
                // Delete old logo if exists
                if ($settings->logo_path) {
                    Storage::delete($settings->logo_path);
                }
                
                // Store new logo
                $path = $request->file('logo')->store('logos', 'public');
                $settings->logo_path = $path;
            }
            
            // Save settings
            $settings->save();
            
            // Prepare response with logo URL
            $response = $settings->toArray();
            if ($settings->logo_path) {
                $response['logo_url'] = url(Storage::url($settings->logo_path));
            } else {
                $response['logo_url'] = null;
            }
            
            return response()->json([
                'status' => 'success',
                'message' => 'Settings updated successfully',
                'data' => $response
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete the logo.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteLogo()
    {
        try {
            $settings = Setting::first();
            
            if (!$settings || !$settings->logo_path) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No logo found'
                ], 404);
            }
            
            // Delete logo file
            Storage::delete($settings->logo_path);
            
            // Update settings
            $settings->logo_path = null;
            $settings->save();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Logo deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete logo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset settings to default.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function reset()
    {
        try {
            $settings = Setting::first();
            
            if ($settings) {
                // Delete logo if exists
                if ($settings->logo_path) {
                    Storage::delete($settings->logo_path);
                }
                
                // Update with default values
                $settings->update([
                    'store_name' => 'My Store',
                    'address' => '',
                    'phone' => '',
                    'email' => '',
                    'tax_percentage' => 0,
                    'receipt_footer' => 'Thank you for shopping with us!',
                    'currency' => 'IDR',
                    'logo_path' => null,
                ]);
            } else {
                // Create default settings
                $settings = Setting::create([
                    'store_name' => 'My Store',
                    'address' => '',
                    'phone' => '',
                    'email' => '',
                    'tax_percentage' => 0,
                    'receipt_footer' => 'Thank you for shopping with us!',
                    'currency' => 'IDR',
                    'logo_path' => null,
                ]);
            }
            
            return response()->json([
                'status' => 'success',
                'message' => 'Settings reset to default',
                'data' => $settings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to reset settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get store logo.
     *
     * @return \Illuminate\Http\Response|\Illuminate\Http\JsonResponse
     */
    public function getLogo()
    {
        try {
            $settings = Setting::first();
            
            if (!$settings || !$settings->logo_path) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No logo found'
                ], 404);
            }
            
            // Check if file exists
            if (!Storage::exists($settings->logo_path)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Logo file not found'
                ], 404);
            }
            
            // Return the file
            return response()->file(Storage::path($settings->logo_path));
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve logo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload store logo.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadLogo(Request $request)
    {
        try {
            // Validate input
            $validator = Validator::make($request->all(), [
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            // Get settings
            $settings = Setting::first();
            
            if (!$settings) {
                $settings = new Setting();
                $settings->store_name = 'My Store';
                $settings->currency = 'IDR';
                $settings->receipt_footer = 'Thank you for shopping with us!';
            }
            
            // Delete old logo if exists
            if ($settings->logo_path) {
                Storage::delete($settings->logo_path);
            }
            
            // Store new logo
            $path = $request->file('logo')->store('logos', 'public');
            $settings->logo_path = $path;
            $settings->save();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Logo uploaded successfully',
                'data' => [
                    'logo_path' => $settings->logo_path,
                    'logo_url' => url(Storage::url($settings->logo_path))
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to upload logo',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}