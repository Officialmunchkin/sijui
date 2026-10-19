<?php

/**
 * FAM VAULT — build-time patch for tursodatabase/turso-driver-laravel.
 *
 * Why: LibSQLPDOStatement::decodeDoubleBase64() runs on every SELECT result
 * and, for any string that merely *looks* like base64 (valid base64 pattern,
 * strict-decodes, and the decoded bytes are printable), replaces it with
 * base64_decode(base64_decode($value)). Laravel's Crypt::encryptString()
 * output IS exactly such a string, so members.password_secret was mangled
 * into ~90 bytes of binary on every read and the ADMIN "view password"
 * feature (GET /api/members/passwords) always returned null.
 *
 * This app ran on plain SQLite/PDO on Fly before moving to Turso, and PDO
 * never rewrites values like that — so we drop the heuristic to restore
 * PDO-faithful reads. The underlying bug is upstream's; the workaround lives
 * here so it is visible and verifiable.
 *
 * Self-verifying: if the upstream block is not found (e.g. the package was
 * bumped and the code moved), this exits non-zero and the Docker build fails
 * loudly rather than silently shipping the corruption again.
 */

$driverFile = __DIR__.'/../../vendor/tursodatabase/turso-driver-laravel/src/Database/LibSQLPDOStatement.php';

$marker = '[famvault] base64 double-decode disabled';

if (! is_file($driverFile)) {
    fwrite(STDERR, "libsql-driver-patch: file not found: {$driverFile}\n");
    exit(1);
}

$source = file_get_contents($driverFile);

if (str_contains($source, $marker)) {
    echo "libsql-driver-patch: already applied\n";
    exit(0);
}

// The exact `if` block that performs base64_decode(base64_decode($value)).
$pattern = '/\n[ \t]*if \(is_string\(\$value\) && \$this->is_base64_encoded\(\$value\)\) \{\n'
    .'[ \t]*\$value = base64_decode\(base64_decode\(\$value\)\);\n'
    .'[ \t]*\}/';

$replacement = "\n                    // {$marker}: it corrupted Crypt::encryptString() payloads.";

$patched = preg_replace($pattern, $replacement, $source, 1, $count);

if ($patched === null || $count !== 1) {
    fwrite(STDERR, "libsql-driver-patch: expected block not found in {$driverFile} (upstream changed?)\n");
    exit(1);
}

file_put_contents($driverFile, $patched);

echo "libsql-driver-patch: applied\n";
