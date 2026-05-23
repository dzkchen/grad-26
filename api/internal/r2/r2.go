// Package r2 wraps the aws-sdk-go-v2 S3 client and points it at Cloudflare R2.
// R2 is S3-compatible — region is always "auto", and we use path-style addressing
// against the account-scoped endpoint.
package r2

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// Config holds the env-supplied R2 connection details.
type Config struct {
	Endpoint        string `env:"R2_ENDPOINT"`
	AccessKeyID     string `env:"R2_ACCESS_KEY_ID"`
	SecretAccessKey string `env:"R2_SECRET_ACCESS_KEY"`
	Bucket          string `env:"R2_BUCKET"`
}

// Client is a thin wrapper around s3.Client + s3.PresignClient bound to a single bucket.
type Client struct {
	s3        *s3.Client
	presigner *s3.PresignClient
	bucket    string
}

// New returns a Client configured for Cloudflare R2. All four fields on cfg must be set.
func New(cfg Config) (*Client, error) {
	if cfg.Endpoint == "" || cfg.AccessKeyID == "" || cfg.SecretAccessKey == "" || cfg.Bucket == "" {
		return nil, errors.New("r2: endpoint, access key, secret key, and bucket are all required")
	}

	s3client := s3.New(s3.Options{
		Region:       "auto",
		BaseEndpoint: aws.String(cfg.Endpoint),
		UsePathStyle: true,
		Credentials: aws.NewCredentialsCache(
			credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretAccessKey, ""),
		),
		// aws-sdk-go-v2 service/s3 ≥ v1.81 adds a default CRC32 checksum to
		// every PutObject and signs it into the URL. R2 (and any browser
		// upload, since the browser can't send x-amz-checksum-* headers) then
		// returns 400 SignatureDoesNotMatch. Switch to "when required" so the
		// checksum is only added if we explicitly opt in.
		RequestChecksumCalculation: aws.RequestChecksumCalculationWhenRequired,
		ResponseChecksumValidation: aws.ResponseChecksumValidationWhenRequired,
	})

	return &Client{
		s3:        s3client,
		presigner: s3.NewPresignClient(s3client),
		bucket:    cfg.Bucket,
	}, nil
}

// Bucket returns the bound bucket name.
func (c *Client) Bucket() string { return c.bucket }

// PresignPut returns a signed URL that the browser can PUT the file to.
// Only `host` is bound into the V4 query signature (X-Amz-SignedHeaders=host)
// — `Content-Type` is set on the request as a header but isn't part of the
// signed-headers list, and `Content-Length` is intentionally omitted because
// the SDK signing it produces 400s on browser PUTs. Size enforcement happens
// server-side: POST /survey HEADs the object and rejects > 5 MB before
// committing the DB row. contentLength is accepted for API symmetry.
//
// The exact signing behavior here is not unit-tested — it's verified by the
// `cmd/diag-r2` integration tool, which round-trips through real R2. Changes
// to the s3.Options or this function should be re-verified by running that.
func (c *Client) PresignPut(ctx context.Context, key, contentType string, contentLength int64, ttl time.Duration) (string, error) {
	_ = contentLength
	req, err := c.presigner.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(c.bucket),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	}, s3.WithPresignExpires(ttl))
	if err != nil {
		return "", fmt.Errorf("r2: presign put: %w", err)
	}
	return req.URL, nil
}

// HeadObject returns the size of the object, or an error if it doesn't exist.
// Used by POST /survey to confirm the client actually uploaded the file before we
// commit the DB row.
func (c *Client) HeadObject(ctx context.Context, key string) (int64, error) {
	out, err := c.s3.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return 0, fmt.Errorf("r2: head %s: %w", key, err)
	}
	if out.ContentLength == nil {
		return 0, fmt.Errorf("r2: head %s: nil content-length", key)
	}
	return *out.ContentLength, nil
}

// DeleteObject removes an object from the bucket. Used by /admin/surveys/:id delete.
func (c *Client) DeleteObject(ctx context.Context, key string) error {
	_, err := c.s3.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("r2: delete %s: %w", key, err)
	}
	return nil
}
