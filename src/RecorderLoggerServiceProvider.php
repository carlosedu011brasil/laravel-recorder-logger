<?php

namespace RecorderLogger;

use Illuminate\Support\ServiceProvider;

class RecorderLoggerServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->loadRoutesFrom(__DIR__.'/routes/web.php');
        $this->publishes([
            __DIR__.'/../resources/js/Components' => resource_path('js/Components/RecorderLogger',
            __DIR__.'/../resources/js/plugins' => resource_path('js/plugins'))
        ], 'recorder-components');
    }
}
