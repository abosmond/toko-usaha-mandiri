<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'store_name',
        'address',
        'phone',
        'email',
        'tax_percentage',
        'receipt_footer',
        'currency',
        'logo_path',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'tax_percentage' => 'decimal:2',
        'updated_at' => 'datetime',
    ];

    /**
     * Get settings as a key-value pair
     *
     * @return array
     */
    public static function getSettings(): array
    {
        $settings = self::first();
        
        if (!$settings) {
            return [];
        }
        
        return $settings->toArray();
    }

    /**
     * Get a specific setting by key
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function getSetting(string $key, $default = null)
    {
        $settings = self::first();
        
        if (!$settings || !isset($settings->$key)) {
            return $default;
        }
        
        return $settings->$key;
    }

    /**
     * Update settings
     *
     * @param array $data
     * @return bool
     */
    public static function updateSettings(array $data): bool
    {
        $settings = self::first();
        
        if (!$settings) {
            // Create settings if not exists
            return (bool) self::create($data);
        }
        
        return $settings->update($data);
    }
}