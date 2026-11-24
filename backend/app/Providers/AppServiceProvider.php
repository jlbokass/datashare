<?php

namespace App\Providers;

use App\Documentation\DataShareOperationTransformer;
use App\Http\Middleware\AuthenticateJwt;
use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\SecurityDocumentation\MiddlewareAuthSecurityStrategy;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Scramble is a development dependency; normal application boot must not require it.
        if (class_exists(Scramble::class)) {
            Scramble::configure()
                ->config(array_replace(config('scramble'), [
                    'security_strategy' => [MiddlewareAuthSecurityStrategy::class, [
                        'middleware' => [AuthenticateJwt::class],
                        'scheme' => SecurityScheme::http('bearer', 'JWT')->as('bearerAuth'),
                    ]],
                ]))
                ->withOperationTransformers(DataShareOperationTransformer::class);
        }
    }
}
