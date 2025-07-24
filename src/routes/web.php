<?php

use Illuminate\Support\Facades\Route;
use Vendor\Pacote\Http\Controllers\LoggerController;

Route::get('/logger-data', LoggerController::class);