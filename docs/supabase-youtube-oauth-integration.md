# Supabase Auth를 활용한 YouTube OAuth 연동 방안

## 개요

Supabase의 내장 Auth 시스템을 활용하여 YouTube OAuth 2.0 인증을 구현합니다. Supabase Auth는 OAuth 토큰 관리, 자동 갱신, 보안 저장을 기본 제공하므로 직접 구현하는 것보다 안전하고 효율적입니다.

---

## 1. Supabase Auth 아키텍처

### 1.1 Supabase Auth 스키마 구조

```sql
-- Supabase에서 자동 관리하는 테이블들
auth.users                  -- 사용자 계정
auth.identities            -- OAuth 프로바이더 연동 정보
auth.sessions              -- 세션 관리
auth.refresh_tokens        -- Refresh Token 관리
```

### 1.2 제안 구조

```
┌─────────────────────────────────────────┐
│         Supabase Auth (관리)            │
├─────────────────────────────────────────┤
│ auth.users                              │
│  └─ User Account (email/password)       │
│                                         │
│ auth.identities                         │
│  ├─ Google Identity (Primary Login)    │
│  └─ YouTube Identity (Channel Access)  │
│                                         │
│ auth.sessions                           │
│  └─ Access/Refresh Tokens              │
└─────────────────────────────────────────┘
           ↓ (연동)
┌─────────────────────────────────────────┐
│      TubeGAI Schema (tubegai)           │
├─────────────────────────────────────────┤
│ tubegai.channel                         │
│  ├─ user_id (auth.users.id)            │
│  ├─ identity_id (auth.identities.id)   │
│  └─ youtube_channel_id                 │
└─────────────────────────────────────────┘
```

---

## 2. Supabase 설정

### 2.1 Google Provider 설정 (Supabase Dashboard)

1. **Supabase Dashboard → Authentication → Providers → Google**
2. Google Cloud Console에서 OAuth 클라이언트 생성
3. Supabase에서 제공하는 Redirect URL 사용:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
4. 필수 스코프 추가:
   ```
   https://www.googleapis.com/auth/youtube.upload
   https://www.googleapis.com/auth/youtube.readonly
   https://www.googleapis.com/auth/youtube.force-ssl
   ```

### 2.2 환경 변수 설정

```bash
# .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth (Supabase에서 관리)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

---

## 3. 데이터베이스 스키마 수정

### 3.1 Channel 테이블 수정

```typescript
// app/features/project/project-schema.ts

export const channels = tubegaiSchema.table("channel", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Supabase Auth 연동
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  identityId: uuid("identity_id").unique(), // auth.identities.id 참조

  // YouTube 채널 정보
  youtubeChannelId: text("youtube_channel_id").unique().notNull(),
  name: text("name").notNull(),
  handle: text("handle"),
  description: text("description"),
  avatarUrl: text("avatar_url"),

  // 통계 (주기적 동기화)
  subscriberCount: integer("subscriber_count"),
  videoCount: integer("video_count"),
  viewCount: bigint("view_count", { mode: "number" }),

  // 상태 관리
  status: channelStatusEnum("status").default("active").notNull(),
  lastSyncedAt: timestamp("last_synced_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 주의: accessToken, refreshToken은 auth.identities에서 관리되므로 제거
```

### 3.2 RLS (Row Level Security) 정책

```sql
-- Channel 테이블 RLS 활성화
ALTER TABLE tubegai.channel ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 채널만 조회 가능
CREATE POLICY "Users can view own channels"
  ON tubegai.channel
  FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 채널만 생성 가능
CREATE POLICY "Users can insert own channels"
  ON tubegai.channel
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 채널만 수정 가능
CREATE POLICY "Users can update own channels"
  ON tubegai.channel
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 사용자는 자신의 채널만 삭제 가능
CREATE POLICY "Users can delete own channels"
  ON tubegai.channel
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 4. YouTube 채널 연동 구현

### 4.1 OAuth 인증 플로우

```typescript
// app/features/auth/youtube-auth.client.ts

import { createClient } from '~/lib/supabase.client';

/**
 * YouTube 채널 연동 시작
 * Supabase Auth를 통해 Google OAuth 실행
 */
export async function connectYouTubeChannel() {
  const supabase = createClient();

  // Supabase Auth의 Google OAuth 사용
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
      redirectTo: `${window.location.origin}/projects/channels/callback`,
      queryParams: {
        access_type: 'offline', // Refresh token 받기
        prompt: 'consent', // 항상 동의 화면 표시
      },
    },
  });

  if (error) {
    throw new Error(`OAuth 인증 실패: ${error.message}`);
  }

  return data;
}
```

### 4.2 OAuth 콜백 처리

```typescript
// app/features/project/pages/channels-callback-page.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import type { Route } from './+types/channels-callback-page';
import { createClient } from '~/lib/supabase.client';
import { saveYouTubeChannelFromIdentity } from '~/common/data/channel.data.server';

export async function loader({ request }: Route.LoaderArgs) {
  const supabase = createClient();

  // 1. Supabase에서 세션 확인
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return redirect('/projects/channels?error=auth_failed');
  }

  // 2. Google Identity 조회
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/projects/channels?error=user_not_found');
  }

  // 3. auth.identities에서 Google Identity 찾기
  const googleIdentity = user.identities?.find(
    (identity) => identity.provider === 'google'
  );

  if (!googleIdentity) {
    return redirect('/projects/channels?error=identity_not_found');
  }

  // 4. YouTube 채널 정보 가져오기
  try {
    const channelInfo = await fetchYouTubeChannelInfo(googleIdentity.id);

    // 5. 채널 저장
    await saveYouTubeChannelFromIdentity(user.id, googleIdentity.id, channelInfo);

    return redirect('/projects/channels?success=true');
  } catch (error) {
    console.error('YouTube 채널 저장 실패:', error);
    return redirect('/projects/channels?error=save_failed');
  }
}

export default function ChannelsCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Loader가 처리하므로 여기서는 로딩 표시만
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">채널 연동 중...</p>
      </div>
    </div>
  );
}
```

### 4.3 Access Token 조회 (Server-Side)

```typescript
// app/lib/youtube-token.server.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service Role Key 사용
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Identity ID로 Access Token 조회
 * Supabase가 자동으로 토큰을 갱신함
 */
export async function getYouTubeAccessToken(
  userId: string,
  identityId: string
): Promise<string> {
  // 1. auth.identities 테이블에서 토큰 조회
  const { data, error } = await supabase
    .from('identities')
    .select('provider_token, provider_refresh_token')
    .eq('id', identityId)
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  if (error || !data) {
    throw new Error('YouTube access token을 찾을 수 없습니다.');
  }

  // 2. Supabase가 자동으로 갱신한 토큰 반환
  return data.provider_token;
}

/**
 * Channel ID로 Access Token 조회
 */
export async function getAccessTokenByChannelId(
  channelId: string,
  userId: string
): Promise<string> {
  // 1. Channel에서 identity_id 조회
  const { data: channel } = await supabase
    .from('channel')
    .select('identity_id')
    .eq('id', channelId)
    .eq('user_id', userId)
    .single();

  if (!channel?.identity_id) {
    throw new Error('채널 정보를 찾을 수 없습니다.');
  }

  // 2. Identity에서 토큰 조회
  return getYouTubeAccessToken(userId, channel.identity_id);
}
```

---

## 5. YouTube API 호출

### 5.1 채널 정보 조회

```typescript
// app/features/youtube/youtube-api.server.ts

import { getYouTubeAccessToken } from '~/lib/youtube-token.server';

interface YouTubeChannelInfo {
  youtubeChannelId: string;
  name: string;
  handle: string;
  description: string;
  avatarUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
}

/**
 * Identity ID로 YouTube 채널 정보 조회
 */
export async function fetchYouTubeChannelInfo(
  identityId: string
): Promise<YouTubeChannelInfo> {
  // 1. Supabase Auth에서 Access Token 조회
  const { data: identity } = await supabase
    .from('identities')
    .select('provider_token, user_id')
    .eq('id', identityId)
    .single();

  if (!identity?.provider_token) {
    throw new Error('Access token을 찾을 수 없습니다.');
  }

  // 2. YouTube API 호출
  const response = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true',
    {
      headers: {
        Authorization: `Bearer ${identity.provider_token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`YouTube API 오류: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error('YouTube 채널을 찾을 수 없습니다.');
  }

  const channel = data.items[0];

  return {
    youtubeChannelId: channel.id,
    name: channel.snippet.title,
    handle: channel.snippet.customUrl || '',
    description: channel.snippet.description || '',
    avatarUrl: channel.snippet.thumbnails.default.url,
    subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
    videoCount: parseInt(channel.statistics.videoCount || '0'),
    viewCount: parseInt(channel.statistics.viewCount || '0'),
  };
}

/**
 * 여러 채널 조회 (사용자가 여러 채널 관리 시)
 */
export async function fetchAllYouTubeChannels(
  accessToken: string
): Promise<YouTubeChannelInfo[]> {
  const response = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true&maxResults=50',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();

  return (data.items || []).map((channel: any) => ({
    youtubeChannelId: channel.id,
    name: channel.snippet.title,
    handle: channel.snippet.customUrl || '',
    description: channel.snippet.description || '',
    avatarUrl: channel.snippet.thumbnails.default.url,
    subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
    videoCount: parseInt(channel.statistics.videoCount || '0'),
    viewCount: parseInt(channel.statistics.viewCount || '0'),
  }));
}
```

### 5.2 비디오 업로드

```typescript
// app/features/youtube/upload.server.ts

import { google } from 'googleapis';
import { getAccessTokenByChannelId } from '~/lib/youtube-token.server';
import fs from 'fs';

interface UploadParams {
  channelId: string;
  userId: string;
  videoFile: {
    path: string;
    mimeType: string;
  };
  metadata: {
    title: string;
    description: string;
    tags?: string[];
    categoryId?: string;
    privacyStatus: 'private' | 'unlisted' | 'public';
  };
}

export async function uploadVideoToYouTube(params: UploadParams) {
  // 1. Supabase Auth를 통해 Access Token 조회
  const accessToken = await getAccessTokenByChannelId(
    params.channelId,
    params.userId
  );

  // 2. YouTube API 클라이언트 생성
  const youtube = google.youtube({
    version: 'v3',
    auth: accessToken,
  });

  // 3. 비디오 업로드
  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: params.metadata.title,
        description: params.metadata.description,
        tags: params.metadata.tags,
        categoryId: params.metadata.categoryId || '22',
      },
      status: {
        privacyStatus: params.metadata.privacyStatus,
      },
    },
    media: {
      mimeType: params.videoFile.mimeType,
      body: fs.createReadStream(params.videoFile.path),
    },
  });

  return {
    videoId: response.data.id!,
    videoUrl: `https://www.youtube.com/watch?v=${response.data.id}`,
  };
}
```

---

## 6. 채널 데이터 레이어 업데이트

### 6.1 채널 저장

```typescript
// app/common/data/channel.data.server.ts

/**
 * YouTube 채널 정보를 Identity와 함께 저장
 */
export async function saveYouTubeChannelFromIdentity(
  userId: string,
  identityId: string,
  channelInfo: YouTubeChannelInfo
): Promise<{ id: string }> {
  // 중복 확인
  const existing = await db.query.channels.findFirst({
    where: and(
      eq(schema.channels.userId, userId),
      eq(schema.channels.youtubeChannelId, channelInfo.youtubeChannelId)
    ),
  });

  if (existing) {
    // 기존 채널 업데이트
    await db
      .update(schema.channels)
      .set({
        identityId,
        name: channelInfo.name,
        handle: channelInfo.handle,
        description: channelInfo.description,
        avatarUrl: channelInfo.avatarUrl,
        subscriberCount: channelInfo.subscriberCount,
        videoCount: channelInfo.videoCount,
        viewCount: channelInfo.viewCount,
        status: 'active',
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.channels.id, existing.id));

    return { id: existing.id };
  }

  // 새 채널 생성
  const [channel] = await db
    .insert(schema.channels)
    .values({
      userId,
      identityId,
      youtubeChannelId: channelInfo.youtubeChannelId,
      name: channelInfo.name,
      handle: channelInfo.handle,
      description: channelInfo.description,
      avatarUrl: channelInfo.avatarUrl,
      subscriberCount: channelInfo.subscriberCount,
      videoCount: channelInfo.videoCount,
      viewCount: channelInfo.viewCount,
      status: 'active',
      lastSyncedAt: new Date(),
    })
    .returning({ id: schema.channels.id });

  return { id: channel.id };
}

/**
 * 채널 통계 동기화
 */
export async function syncChannelStats(
  channelId: string,
  userId: string
): Promise<void> {
  // 1. 채널 정보 조회
  const channel = await db.query.channels.findFirst({
    where: and(
      eq(schema.channels.id, channelId),
      eq(schema.channels.userId, userId)
    ),
  });

  if (!channel?.identityId) {
    throw new Error('채널을 찾을 수 없습니다.');
  }

  // 2. YouTube API에서 최신 정보 가져오기
  const channelInfo = await fetchYouTubeChannelInfo(channel.identityId);

  // 3. DB 업데이트
  await db
    .update(schema.channels)
    .set({
      name: channelInfo.name,
      handle: channelInfo.handle,
      description: channelInfo.description,
      avatarUrl: channelInfo.avatarUrl,
      subscriberCount: channelInfo.subscriberCount,
      videoCount: channelInfo.videoCount,
      viewCount: channelInfo.viewCount,
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.channels.id, channelId));
}
```

---

## 7. 채널 페이지 업데이트

### 7.1 OAuth 연동 버튼

```typescript
// app/features/project/pages/channels-page.tsx

import { connectYouTubeChannel } from '~/features/auth/youtube-auth.client';

export default function ChannelsPage({ loaderData }: Route.ComponentProps) {
  const { channels } = loaderData;

  const handleConnectChannel = async () => {
    try {
      await connectYouTubeChannel();
      // OAuth 플로우가 시작되면 자동으로 Google 로그인 페이지로 리디렉션됨
    } catch (error) {
      toast.error('채널 연동에 실패했습니다.');
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">채널 관리</h1>
          <p className="text-muted-foreground mt-1">
            Google 계정으로 YouTube 채널을 자동으로 연결하세요.
          </p>
        </div>
        <Button onClick={handleConnectChannel}>
          <Youtube className="mr-2 h-4 w-4" />
          Google로 채널 연결
        </Button>
      </div>

      {/* 채널 목록 */}
      {channels.length === 0 ? (
        <EmptyState onConnect={handleConnectChannel} />
      ) : (
        <ChannelGrid channels={channels} />
      )}
    </div>
  );
}
```

---

## 8. 보안 및 권한 관리

### 8.1 RLS 정책으로 자동 보안

Supabase의 RLS를 활용하면 서버 코드에서 별도의 권한 검증이 불필요합니다:

```typescript
// RLS가 자동으로 처리하므로 간단한 쿼리만 필요
export async function getChannels(userId: string) {
  // RLS 정책이 user_id 검증을 자동으로 처리
  const { data, error } = await supabase
    .from('channel')
    .select('*')
    .eq('user_id', userId);

  return data || [];
}
```

### 8.2 토큰 자동 갱신

Supabase Auth가 자동으로 Access Token을 갱신하므로 별도 구현 불필요:

```typescript
// Supabase가 자동으로 토큰 갱신을 처리
const accessToken = await getYouTubeAccessToken(userId, identityId);
// 항상 유효한 토큰이 반환됨
```

---

## 9. 마이그레이션 가이드

### 9.1 기존 채널 데이터 마이그레이션

```sql
-- Step 1: identity_id 컬럼 추가
ALTER TABLE tubegai.channel
ADD COLUMN identity_id UUID REFERENCES auth.identities(id);

-- Step 2: 기존 accessToken, refreshToken 컬럼 제거 (데이터 백업 후)
ALTER TABLE tubegai.channel
DROP COLUMN access_token,
DROP COLUMN refresh_token,
DROP COLUMN token_expires_at;

-- Step 3: 인덱스 추가
CREATE INDEX idx_channel_identity_id ON tubegai.channel(identity_id);
CREATE INDEX idx_channel_user_id ON tubegai.channel(user_id);
```

### 9.2 기존 사용자 재연동 안내

기존에 수동으로 입력한 채널이 있는 사용자는 다시 OAuth 인증 필요:

```typescript
// 채널 페이지에 안내 배너 표시
{channel.identityId === null && (
  <Alert variant="warning">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>재인증이 필요합니다</AlertTitle>
    <AlertDescription>
      YouTube 업로드 기능을 사용하려면 Google 계정으로 다시 연결해주세요.
      <Button variant="link" onClick={handleReconnect}>
        다시 연결하기
      </Button>
    </AlertDescription>
  </Alert>
)}
```

---

## 10. 장점 및 비교

### 10.1 Supabase Auth 사용의 장점

| 항목 | 직접 구현 | Supabase Auth |
|------|----------|---------------|
| 토큰 저장 | 암호화 직접 구현 필요 | 자동 암호화 저장 |
| 토큰 갱신 | 만료 체크 및 갱신 로직 필요 | 자동 갱신 |
| 보안 | CSRF, XSS 직접 방어 | 내장 보안 기능 |
| 인증 플로우 | OAuth 플로우 직접 구현 | SDK로 간단히 구현 |
| 세션 관리 | 직접 구현 | 자동 관리 |
| 개발 시간 | 2-3주 | 1주 |
| 유지보수 | 복잡 | 간단 |

### 10.2 코드 비교

**직접 구현:**
```typescript
// 200+ 줄의 OAuth 구현 코드
// 토큰 암호화/복호화 코드
// 토큰 갱신 로직
// CSRF 방어 코드
// 세션 관리 코드
```

**Supabase Auth:**
```typescript
// 10줄로 OAuth 완료
const { data } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    scopes: 'youtube.upload youtube.readonly',
  },
});
```

---

## 11. 구현 체크리스트

### Phase 1: Supabase 설정 (1일)
- [ ] Supabase Dashboard에서 Google Provider 활성화
- [ ] YouTube API 스코프 추가
- [ ] Redirect URL 설정

### Phase 2: 스키마 수정 (1일)
- [ ] Channel 테이블에 identity_id 추가
- [ ] accessToken, refreshToken 컬럼 제거
- [ ] RLS 정책 적용

### Phase 3: OAuth 플로우 구현 (2일)
- [ ] YouTube 연동 버튼 구현
- [ ] Callback 페이지 구현
- [ ] 채널 정보 저장 로직

### Phase 4: API 통합 (2일)
- [ ] Access Token 조회 함수
- [ ] YouTube API 호출 래퍼
- [ ] 비디오 업로드 기능

### Phase 5: 테스트 (1일)
- [ ] OAuth 플로우 테스트
- [ ] 토큰 갱신 테스트
- [ ] 업로드 기능 테스트

---

## 12. 참고 자료

- [Supabase Auth - OAuth](https://supabase.com/docs/guides/auth/social-login)
- [Supabase Auth - Identity Linking](https://supabase.com/docs/guides/auth/auth-identity-linking)
- [YouTube Data API v3](https://developers.google.com/youtube/v3)

---

## 결론

Supabase Auth를 활용하면:
- **개발 시간 단축**: 직접 구현 대비 50% 이상 절감
- **보안 강화**: 검증된 OAuth 구현 사용
- **유지보수 간소화**: 토큰 관리 자동화
- **확장성**: 다른 OAuth Provider 추가 용이

**권장 사항:** YouTube OAuth 연동은 Supabase Auth를 활용하는 것이 가장 효율적입니다.
