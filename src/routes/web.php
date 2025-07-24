<?php
use Illuminate\Support\Facades\Route;

Route::get('/logger-data', function () {
    $json = storage_path('app/public/logger.json');
    return file_exists($json) ? response()->file($json) : response()->json(['error' => 'Arquivo não encontrado'], 404);
});
