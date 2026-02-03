// =============================================================================
// Supabase Storage Server Utilities
// =============================================================================
// Server-side utilities for uploading files to Supabase Storage
//
// Cache-Control 전략:
// - 업로드 시 cacheControl 설정 → Supabase가 객체 메타데이터로 저장
// - 다운로드(파일 접근) 시 해당 Cache-Control 헤더가 자동으로 반환됨
// - timestamp 기반 경로 사용으로 immutable 캐시 안전하게 적용 가능
// =============================================================================

import { createClient } from "@supabase/supabase-js";

// Create admin client with service role key for server-side uploads
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET_NAME = "media";

// Cache-Control 헤더 설정 (업로드 시 설정 → 다운로드 시 자동 적용)
// - public: CDN/프록시 캐시 허용
// - max-age=31536000: 1년 캐시
// - immutable: 브라우저가 재검증 요청 생략 (egress 비용 절감)
const CACHE_CONTROL_IMMUTABLE = "public, max-age=31536000, immutable";

/**
 * Upload a storyboard scene image to Supabase Storage
 */
export async function uploadStoryboardImage(
  projectId: string,
  sceneId: string,
  imageBuffer: Buffer,
  mimeType: string = "image/png"
): Promise<{ storageKey: string; publicUrl: string }> {
  const timestamp = Date.now();
  const extension = mimeType === "image/jpeg" ? "jpg" : "png";
  const storageKey = `storyboard-images/${projectId}/${sceneId}/${timestamp}.${extension}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(storageKey, imageBuffer, {
      contentType: mimeType,
      cacheControl: CACHE_CONTROL_IMMUTABLE,
      upsert: true,
    });

  if (error) {
    console.error("Supabase storage upload error:", error);
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storageKey);

  return {
    storageKey,
    publicUrl: urlData.publicUrl,
  };
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteStorageFile(storageKey: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .remove([storageKey]);

  if (error) {
    console.error("Supabase storage delete error:", error);
    throw new Error(`파일 삭제 실패: ${error.message}`);
  }
}

/**
 * Get public URL for a storage key
 * 참고: 반환된 URL로 파일 접근 시 업로드 때 설정한 Cache-Control 헤더가 적용됨
 */
export function getPublicUrl(storageKey: string): string {
  const { data } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storageKey);

  return data.publicUrl;
}
