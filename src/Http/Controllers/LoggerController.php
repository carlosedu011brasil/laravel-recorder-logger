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

    public function store(Request $request)
    {
        $data = $request->all();

        $directory = storage_path('app/public');
        $jsonPath = $directory . '/logger.json';

        // Garante que a pasta existe
        if (!file_exists($directory)) {
            mkdir($directory, 0755, true);
        }

        // Salva o JSON (cria se não existir, sobrescreve se já existir)
        file_put_contents($jsonPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return response()->json(['status' => 'salvo']);
    }
}
