<?php

use Tests\TestCase;

// Feature tests run inside the Laravel app (Tests\TestCase), so they can call
// routes and use the database. Unit tests run on plain PHP.
pest()->extend(TestCase::class)->in('Feature');
