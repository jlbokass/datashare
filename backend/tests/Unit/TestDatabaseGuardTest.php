<?php

declare(strict_types=1);

namespace Tests\Unit;

use Illuminate\Config\Repository;
use Illuminate\Database\Connection;
use Illuminate\Database\DatabaseManager;
use Illuminate\Foundation\Application;
use LogicException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use RuntimeException;
use Tests\TestCase as ApplicationTestCase;

final class TestDatabaseGuardTest extends TestCase
{
    #[DataProvider('databaseConfigurations')]
    public function test_only_uncached_testing_with_resolved_memory_sqlite_is_accepted(
        array $overrides,
        bool $accepted,
        bool $resolvesConnection,
    ): void {
        $memory = ['driver' => 'sqlite', 'database' => ':memory:', 'url' => ''];
        $settings = array_replace([
            'environment' => 'testing',
            'configEnvironment' => 'testing',
            'cached' => false,
            'loadedFromCache' => false,
            'configured' => $memory,
            'resolved' => $memory,
        ], $overrides);

        // No application bootstrap, environment files, real connector or PDO.
        // Even a broken guard cannot connect to a database from these fixtures.
        $connection = new Connection(
            fn () => throw new LogicException('This fixture must never open PDO.'),
            $settings['resolved']['database'],
            '',
            $settings['resolved'],
        );
        $database = $this->createMock(DatabaseManager::class);
        $database->expects($resolvesConnection ? $this->once() : $this->never())
            ->method('connection')->with('sqlite')->willReturn($connection);

        $app = $this->createStub(Application::class);
        $app->method('environment')
            ->willReturn($settings['environment'] === 'testing');
        $app->method('configurationIsCached')->willReturn($settings['cached']);
        $app->method('offsetGet')->willReturnMap([
            ['config_loaded_from_cache', $settings['loadedFromCache']],
            ['config', new Repository([
                'app' => ['env' => $settings['configEnvironment']],
                'database' => ['default' => 'sqlite', 'connections' => ['sqlite' => $settings['configured']]],
            ])],
            ['db', $database],
        ]);

        $testCase = new class('guard') extends ApplicationTestCase
        {
            public function check(Application $app): void
            {
                $this->assertSafeTestDatabase($app);
            }
        };

        if (! $accepted) {
            $this->expectException(RuntimeException::class);
        }

        $testCase->check($app);
        if ($accepted) {
            $this->addToAssertionCount(1);
        }
    }

    public static function databaseConfigurations(): array
    {
        return [
            'memory SQLite' => [[], true, true],
            'not testing' => [['environment' => 'local'], false, false],
            'config not testing' => [['configEnvironment' => 'local'], false, false],
            'cache file present' => [['cached' => true], false, false],
            'configuration loaded from cache' => [['loadedFromCache' => true], false, false],
            'missing connection' => [['configured' => null], false, false],
            'PostgreSQL driver' => [['configured' => ['driver' => 'pgsql', 'database' => ':memory:']], false, false],
            'SQLite file' => [['configured' => ['driver' => 'sqlite', 'database' => 'fixture.sqlite']], false, false],
            'URL overrides driver' => [['configured' => ['driver' => 'sqlite', 'database' => ':memory:', 'url' => 'postgres://invalid/fixture']], false, false],
            'URL overrides database' => [['configured' => ['driver' => 'sqlite', 'database' => ':memory:', 'url' => 'sqlite:///fixture.sqlite']], false, false],
            'read override' => [['configured' => ['driver' => 'sqlite', 'database' => ':memory:', 'read' => []]], false, false],
            'write override' => [['configured' => ['driver' => 'sqlite', 'database' => ':memory:', 'write' => []]], false, false],
            'direct override' => [['configured' => ['driver' => 'sqlite', 'database' => ':memory:', 'direct' => []]], false, false],
            'resolved driver differs' => [['resolved' => ['driver' => 'pgsql', 'database' => ':memory:']], false, true],
            'resolved database differs' => [['resolved' => ['driver' => 'sqlite', 'database' => 'fixture.sqlite']], false, true],
        ];
    }
}
