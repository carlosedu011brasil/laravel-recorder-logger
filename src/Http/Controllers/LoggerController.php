<?php

namespace RecorderLogger\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class LoggerController extends Controller
{
    public function __invoke(Request $request)
    {
        $jsonPath = storage_path('app/public/logger.json');

        if (!file_exists($jsonPath)) {
            return response()->json(['error' => 'Arquivo não encontrado'], 404);
        }

        $content = file_get_contents($jsonPath);
        return response($content, 200)->header('Content-Type', 'application/json');
    }
}
