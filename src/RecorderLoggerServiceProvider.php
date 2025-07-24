<?php

namespace RecorderLogger;

use Illuminate\Support\ServiceProvider;

class RecorderLoggerServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->publishes([
            __DIR__.'/../resources/js/Components' => resource_path('js/Components/RecorderLogger'),
        ], 'recorder-components');
    }
}
