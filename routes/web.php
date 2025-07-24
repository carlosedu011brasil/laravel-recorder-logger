<?php

use Illuminate\Support\Facades\Route;

Route::get('/recorder/log', function () {
    $path = storage_path('app/recorder-log.json');

    if (!file_exists($path)) {
        return response()->json(['message' => 'Nenhum log disponível'], 404);
    }

    $data = json_decode(file_get_contents($path), true);
    return response()->json($data);
})->name('getRecorderLog');
 