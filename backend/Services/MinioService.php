<?php

namespace App\Services;

/**
 * MinIO Service
 * 
 * Handles file operations with MinIO S3-compatible storage using cURL.
 * Implements S3 Signature V4 for authentication.
 */
class MinioService
{
    private string $endpoint;
    private string $accessKey;
    private string $secretKey;
    private string $bucket;
    private string $region = 'us-east-1'; // MinIO default region

    public function __construct()
    {
        $this->endpoint = $_ENV['MINIO_ENDPOINT'] ?? 'http://minioalt:9000';
        $this->accessKey = $_ENV['MINIO_ACCESS_KEY'] ?? 'minioadmin';
        $this->secretKey = $_ENV['MINIO_SECRET_KEY'] ?? 'minioadmin123';
        $this->bucket = $_ENV['MINIO_BUCKET'] ?? 'my-bucket';
    }

    /**
     * Upload text content to MinIO
     */
    public function uploadContent(string $path, string $content, string $contentType = 'text/plain'): bool
    {
        $url = $this->getObjectUrl($path);
        
        $headers = $this->signRequest('PUT', $path, $content, $contentType);
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => 'PUT',
            CURLOPT_POSTFIELDS => $content,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            error_log("MinIO upload error: $error");
            return false;
        }
        
        if ($httpCode !== 200) {
            error_log("MinIO upload failed with HTTP $httpCode: $response");
            return false;
        }
        
        return true;
    }

    /**
     * Get text content from MinIO
     */
    public function getContent(string $path): ?string
    {
        $url = $this->getObjectUrl($path);
        
        $headers = $this->signRequest('GET', $path);
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            error_log("MinIO get error: $error");
            return null;
        }
        
        if ($httpCode === 404) {
            return null; // Object not found
        }
        
        if ($httpCode !== 200) {
            error_log("MinIO get failed with HTTP $httpCode: $response");
            return null;
        }
        
        return $response;
    }

    /**
     * Delete content from MinIO
     */
    public function deleteContent(string $path): bool
    {
        $url = $this->getObjectUrl($path);
        
        $headers = $this->signRequest('DELETE', $path);
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => 'DELETE',
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return $httpCode === 204 || $httpCode === 200;
    }

    /**
     * Check if object exists
     */
    public function exists(string $path): bool
    {
        $url = $this->getObjectUrl($path);
        
        $headers = $this->signRequest('HEAD', $path);
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => 'HEAD',
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_NOBODY => true,
            CURLOPT_TIMEOUT => 10,
        ]);
        
        curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return $httpCode === 200;
    }

    /**
     * Get public URL for an object
     */
    public function getPublicUrl(string $path): string
    {
        // Use the external URL (localhost:9100) for frontend access
        $externalEndpoint = $_ENV['MINIO_PUBLIC_URL'] ?? 'http://localhost:9100';
        return "{$externalEndpoint}/{$this->bucket}/{$path}";
    }

    /**
     * Get the full URL for an object (internal)
     */
    private function getObjectUrl(string $path): string
    {
        return "{$this->endpoint}/{$this->bucket}/{$path}";
    }

    /**
     * Sign request with S3 Signature V4
     */
    private function signRequest(string $method, string $path, string $payload = '', string $contentType = ''): array
    {
        $now = new \DateTime('now', new \DateTimeZone('UTC'));
        $amzDate = $now->format('Ymd\THis\Z');
        $dateStamp = $now->format('Ymd');
        
        $host = parse_url($this->endpoint, PHP_URL_HOST);
        $port = parse_url($this->endpoint, PHP_URL_PORT);
        if ($port && $port != 80 && $port != 443) {
            $host .= ':' . $port;
        }
        
        $payloadHash = hash('sha256', $payload);
        
        // Canonical headers
        $canonicalHeaders = "host:{$host}\n";
        $canonicalHeaders .= "x-amz-content-sha256:{$payloadHash}\n";
        $canonicalHeaders .= "x-amz-date:{$amzDate}\n";
        
        $signedHeaders = "host;x-amz-content-sha256;x-amz-date";
        
        // Canonical request
        $canonicalUri = "/{$this->bucket}/{$path}";
        $canonicalQueryString = '';
        
        $canonicalRequest = "{$method}\n{$canonicalUri}\n{$canonicalQueryString}\n{$canonicalHeaders}\n{$signedHeaders}\n{$payloadHash}";
        
        // String to sign
        $algorithm = 'AWS4-HMAC-SHA256';
        $credentialScope = "{$dateStamp}/{$this->region}/s3/aws4_request";
        $stringToSign = "{$algorithm}\n{$amzDate}\n{$credentialScope}\n" . hash('sha256', $canonicalRequest);
        
        // Signing key
        $kDate = hash_hmac('sha256', $dateStamp, "AWS4{$this->secretKey}", true);
        $kRegion = hash_hmac('sha256', $this->region, $kDate, true);
        $kService = hash_hmac('sha256', 's3', $kRegion, true);
        $kSigning = hash_hmac('sha256', 'aws4_request', $kService, true);
        
        // Signature
        $signature = hash_hmac('sha256', $stringToSign, $kSigning);
        
        // Authorization header
        $authorization = "{$algorithm} Credential={$this->accessKey}/{$credentialScope}, SignedHeaders={$signedHeaders}, Signature={$signature}";
        
        $headers = [
            "Host: {$host}",
            "x-amz-date: {$amzDate}",
            "x-amz-content-sha256: {$payloadHash}",
            "Authorization: {$authorization}",
        ];
        
        if ($contentType) {
            $headers[] = "Content-Type: {$contentType}";
        }
        
        return $headers;
    }

    /**
     * Get blog content path
     */
    public static function getBlogContentPath(int $blogId): string
    {
        return "blog/{$blogId}.md";
    }

    /**
     * Get blog featured image path
     */
    public static function getBlogImagePath(int $blogId): string
    {
        return "blog/bl{$blogId}.png";
    }
}
