<?php

namespace RecorderLogger;

use Illuminate\Support\ServiceProvider;

class RecorderLoggerServiceProvider extends ServiceProvider
{
    public function boot()
    {

        // Carregar as rotas do pacote
        $this->loadRoutesForm(__DIR__.'/../routes/web.php')

        // publicar componente
        $this->publishes([
            __DIR__.'/../resources/js/Components' => resource_path('js/Components/RecorderLogger'),
        ], 'recorder-components');

    }
}
