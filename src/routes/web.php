<?php

use Illuminate\Support\Facades\Route;
use RecorderLogger\Http\Controllers\LoggerController;

Route::get('/logger-data', LoggerController::class);