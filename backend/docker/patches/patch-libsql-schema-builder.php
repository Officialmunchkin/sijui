<?php

/**
 * FAM VAULT — build-time patch for tursodatabase/turso-driver-laravel.
 *
 * Why: LibSQLSchemaBuilder::getColumns() wrapped every non-null column
 * default in `new Expression(Str::wrap($dflt, '(', ')'))`. Laravel's
 * BlueprintState (Illuminate\Database\Schema\BlueprintState, line 85) then
 * wraps that default AGAIN:
 *
 *     new Expression(Str::wrap($column['default'], '(', ')'))
 *
 * Str::wrap() concatenates its argument, and an Expression has no __toString,
 * so any Schema operation that reads columns of a table having a column
 * DEFAULT (members.color, members.is_admin, members.is_guest, ...) died with:
 *
 *     Object of class Illuminate\Database\Query\Expression could not be
 *     converted to string   (In Str.php line 462)
 *
 * That took down deploy dep-dbbij0bm8hqs738vmpgg when migration
 * 2026_10_20_000004 tried to drop members.password_secret. Nothing inside
 * the package consumes ['default'] itself (BlueprintState does), so keeping
 * the raw pragma value as a string restores the contract the rest of
 * Laravel expects — BlueprintState then parenthesises it exactly once.
 *
 * Self-verifying: if the upstream line is not found (package bumped / code
 * moved) this exits non-zero and the Docker build fails loudly instead of
 * silently reintroducing the fatal.
 */

$schemaFile = __DIR__.'/../../vendor/tursodatabase/turso-driver-laravel/src/Database/LibSQLSchemaBuilder.php';

$marker = '[famvault] default kept as a plain string';

if (! is_file($schemaFile)) {
    fwrite(STDERR, "libsql-schema-builder-patch: file not found: {$schemaFile}\n");
    exit(1);
}

$source = file_get_contents($schemaFile);

if (str_contains($source, $marker)) {
    echo "libsql-schema-builder-patch: already applied\n";
    exit(0);
}

// The exact Expression-wrapping line that BlueprintState cannot re-wrap.
$needle = "                    : new Expression(Str::wrap(\$delctypes[\$key]['dflt_value'], '(', ')'));";

$replacement = "                    // {$marker}: BlueprintState calls Str::wrap() on it, which fatals on an Expression.\n"
    ."                    : (string) \$delctypes[\$key]['dflt_value'];";

$patched = str_replace($needle, $replacement, $source, $count);

if ($count !== 1) {
    fwrite(STDERR, "libsql-schema-builder-patch: expected line not found in {$schemaFile} ({$count} matches, upstream changed?)\n");
    exit(1);
}

file_put_contents($schemaFile, $patched);

echo "libsql-schema-builder-patch: applied\n";
