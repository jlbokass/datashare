<?php

declare(strict_types=1);

namespace App\Documentation;

use Attribute;
use Dedoc\Scramble\Attributes\Group;

/** Scramble 0.13.55 reads Group subclasses, but Group itself excludes functions. */
#[Attribute(Attribute::TARGET_FUNCTION)]
final class ClosureGroup extends Group {}
