//go:build tools

// Package tools pins module versions for dependencies that are not yet
// imported by production code. Once a real handler imports each package,
// remove its blank import below.
package tools

import (
	_ "github.com/aws/aws-sdk-go-v2"
	_ "github.com/aws/aws-sdk-go-v2/service/s3"
	_ "github.com/caarlos0/env/v11"
	_ "github.com/jackc/pgx/v5"
	_ "github.com/jackc/pgx/v5/pgxpool"
)
