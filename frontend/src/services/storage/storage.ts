/**
 * Storage Service for MinIO
 * 
 * Handles generating URLs for assets stored in MinIO.
 * Content is now fetched via backend API, not directly from MinIO.
 */

const MINIO_URL = import.meta.env.VITE_MINIO_URL || 'http://localhost:9100';
const MINIO_BUCKET = import.meta.env.VITE_MINIO_BUCKET || 'my-bucket';

/**
 * Generate URL for blog featured image
 */
export function getBlogFeaturedImageUrl(blogId: number): string {
    return `${MINIO_URL}/${MINIO_BUCKET}/blog/bl${blogId}.png`;
}

/**
 * Generate URL for inline blog image
 */
export function getBlogInlineImageUrl(blogId: number, imageNumber: number): string {
    return `${MINIO_URL}/${MINIO_BUCKET}/blog/bl${blogId}_${imageNumber}.png`;
}

/**
 * Transform markdown image references to full MinIO URLs
 * Converts: ![alt](bl_1.png) -> ![alt](http://localhost:9100/my-bucket/blog/bl7_1.png)
 * Also handles: ![alt](bl.png) -> ![alt](http://localhost:9100/my-bucket/blog/bl7.png)
 * 
 * @param content - The markdown content
 * @param blogId - The blog ID to inject into image paths
 */
export function transformMarkdownImages(content: string, blogId: number): string {
    if (!content || !blogId) return content;

    // Pattern 1: ![alt text](bl_{n}.png) - inline images (simplified format)
    const inlineImagePattern = /!\[([^\]]*)\]\((bl_(\d+)\.png)\)/g;
    let transformed = content.replace(inlineImagePattern, (match, alt, filename, imageNumber) => {
        // Convert bl_1.png to bl7_1.png (with actual blog ID)
        const actualFilename = `bl${blogId}_${imageNumber}.png`;
        const fullUrl = `${MINIO_URL}/${MINIO_BUCKET}/blog/${actualFilename}`;
        return `![${alt}](${fullUrl})`;
    });

    // Pattern 2: ![alt text](bl.png) - featured image (simplified format)
    const featuredImagePattern = /!\[([^\]]*)\]\((bl\.png)\)/g;
    transformed = transformed.replace(featuredImagePattern, (match, alt) => {
        const fullUrl = getBlogFeaturedImageUrl(blogId);
        return `![${alt}](${fullUrl})`;
    });

    return transformed;
}

/**
 * Transform a single image URL from simplified format to full MinIO URL
 * Converts: bl_1.png -> http://localhost:9100/my-bucket/blog/bl7_1.png
 * 
 * @param src - The image source (can be simplified or already full URL)
 * @param blogId - The blog ID to inject into image paths
 */
export function transformImageUrl(src: string, blogId?: number): string {
    if (!src) return src;

    // If already a full URL, return as is
    if (src.startsWith('http://') || src.startsWith('https://')) {
        return src;
    }

    // If no blogId, return as is (can't transform)
    if (!blogId) {
        return src;
    }

    // Pattern: bl_{n}.png (simplified format - needs blogId injection)
    const simplifiedMatch = src.match(/^bl_(\d+)\.png$/);
    if (simplifiedMatch) {
        const imageNumber = simplifiedMatch[1];
        return `${MINIO_URL}/${MINIO_BUCKET}/blog/bl${blogId}_${imageNumber}.png`;
    }

    // Pattern: bl.png (featured image - simplified)
    if (src === 'bl.png') {
        return getBlogFeaturedImageUrl(blogId);
    }

    // Pattern: bl{id}_{n}.png (already has ID, but might need full URL)
    const withIdMatch = src.match(/^bl(\d+)_(\d+)\.png$/);
    if (withIdMatch) {
        const existingBlogId = withIdMatch[1];
        const imageNumber = withIdMatch[2];
        // Use the blogId from parameter (might be different, so use provided one)
        return `${MINIO_URL}/${MINIO_BUCKET}/blog/bl${blogId}_${imageNumber}.png`;
    }

    // Pattern: bl{id}.png (featured image with ID)
    const featuredWithIdMatch = src.match(/^bl(\d+)\.png$/);
    if (featuredWithIdMatch) {
        return getBlogFeaturedImageUrl(blogId);
    }

    // Otherwise return as is (might be an external image or relative path)
    return src;
}
