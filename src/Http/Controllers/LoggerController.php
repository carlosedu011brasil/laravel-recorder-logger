<?php

namespace RecorderLogger\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class LoggerController extends Controller
{
    public function __invoke(Request $request)
    {
        $jsonPath = storage_path('app/public/support/recorders/logger.json');

        if (!file_exists($jsonPath)) {
            return response()->json(['error' => 'Arquivo não encontrado'], 404);
        }

        $content = file_get_contents($jsonPath);
        return response($content, 200)->header('Content-Type', 'application/json');
    }

    public function store(Request $request)
    {
        $data = $request->all();

        $directory = storage_path('app/public/support/recorders');
        $jsonPath = $directory . '/logger.json';

        // Garante que a pasta existe
        if (!file_exists($directory)) {
            mkdir($directory, 0755, true);
        }

        // Carrega logs existentes (ou inicia um array vazio)
        $logs = file_exists($jsonPath) ? json_decode(file_get_contents($jsonPath), true) : [];

        // Adiciona novo log com a data atual no topo
        $timestamp = now()->format('Y-m-d H:i:s');
        $newLog = [$timestamp => $data];

        // Junta novo log com os anteriores (novo no topo)
        // $logs = $newLog + ($logs ?? []);
        $logs = array_merge($newLog, is_array($logs) ? $logs : []);


        $request->validate([
            'descricao' => 'required|string',
            'logs' => 'required|array',
        ]);


        // Salva o JSON final
        file_put_contents($jsonPath, json_encode($logs, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return response()->json(['status' => 'salvo']);
    }
}
