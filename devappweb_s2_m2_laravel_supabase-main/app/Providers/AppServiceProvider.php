<?php
namespace App\Providers;

use App\Repositories\CuentaRepository;
use App\Services\CuentaService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(CuentaRepository::class, function () {
            return new CuentaRepository();
        });

        $this->app->singleton(CuentaService::class, function ($app) {
            return new CuentaService($app->make(CuentaRepository::class));
        });
    }

    public function boot(): void
    {
        //
    }
}

