<?php

namespace App\Http\Middleware;

use App\Services\JwtService;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateJwt
{
    public function __construct(private readonly JwtService $jwt) {}

    public function handle(Request $request, Closure $next): Response
    {
        $bearer = $request->bearerToken();
        $user = $bearer !== null ? $this->jwt->authenticate($bearer) : null;

        if ($user === null) {
            return new JsonResponse([
                'message' => 'Authentification requise ou session expirée.',
                'code' => 'unauthenticated',
            ], 401);
        }

        // Laravel Request::user() resolves the verified user for this request.
        $request->setUserResolver(static fn (?string $guard = null) => $user);

        return $next($request);
    }
}
