<?php

declare(strict_types=1);

namespace Tests;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\ConfigurationUrlParser;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    public function createApplication(): Application
    {
        $app = parent::createApplication();

        // Configuration is loaded; Laravel has not called setUpTraits() yet.
        $this->assertSafeTestDatabase($app);

        return $app;
    }

    final protected function assertSafeTestDatabase(Application $app): void
    {
        if (! $app->environment('testing') || $app['config']->get('app.env') !== 'testing'
            || $app->configurationIsCached() || $app['config_loaded_from_cache']) {
            throw new RuntimeException('Tests require the testing environment without cached configuration. Use bash scripts/qa.sh backend.');
        }

        $name = $app['config']->get('database.default');

        if (! is_string($name) || $name === '') {
            throw new RuntimeException('Tests require a configured SQLite in-memory connection.');
        }

        $configuration = $app['config']->get("database.connections.{$name}");

        if (! is_array($configuration)) {
            throw new RuntimeException('Tests require a configured SQLite in-memory connection.');
        }

        // Resolve URL overrides before asking the database manager for a connection.
        $this->assertMemorySqlite((new ConfigurationUrlParser)->parseConfiguration($configuration));

        // Laravel creates a lazy PDO resolver here; do not call getPdo() or query.
        $this->assertMemorySqlite($app['db']->connection($name)->getConfig());
    }

    private function assertMemorySqlite(array $configuration): void
    {
        if (($configuration['driver'] ?? null) !== 'sqlite'
            || ($configuration['database'] ?? null) !== ':memory:'
            || array_key_exists('read', $configuration)
            || array_key_exists('write', $configuration)
            || array_key_exists('direct', $configuration)) {
            throw new RuntimeException('Tests refuse any database other than SQLite :memory: without connection overrides.');
        }
    }
}
