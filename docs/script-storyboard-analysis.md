# 스크립트 → 스토리보드 연계 분석 및 개선 보고서

> 최종 업데이트: 완전한 대본 생성 기능 추가

## 1. 분석 개요

### 1.1 현재 데이터 흐름
```
Script → Storyboard → Scene → Video
```

### 1.2 기존 문제점

| 단계 | 입력 | 필요한 출력 | 문제 |
|------|------|------------|------|
| Script → Storyboard | content, duration | description, visualPrompt, imageUrl, sceneNumber | 시각적 정보 부재 |
| Storyboard → Scene | visual data | thumbnailUrl, videoParts | 영상 생성 파이프라인 미구현 |

#### 주요 갭 분석:

1. **시각적 메타데이터 부재**: 스크립트는 텍스트 콘텐츠만 제공, 스토리보드 생성에 필요한 시각적 지시사항 없음
2. **씬 분할 정보 없음**: 각 세그먼트를 어떻게 씬으로 분할할지에 대한 힌트 없음
3. **B-roll 키워드 부재**: 스톡 영상 검색에 사용할 키워드 없음
4. **감정/톤 정보 부재**: 영상의 분위기 설정에 필요한 정보 없음

## 2. 구현된 개선 사항

### 2.1 ScriptSegment 타입 확장

**파일**: `app/common/types/studio.types.ts`

```typescript
// 새로 추가된 타입
interface SceneHint {
  description: string;      // 씬 설명
  visualPrompt: string;     // AI 이미지/영상 생성 프롬프트
  duration: number;         // 씬 길이 (초)
  cameraAngle?: string;     // 카메라 앵글
}

// 확장된 ScriptSegment
type ScriptSegment = {
  id: string;
  type: "hook" | "intro" | "body" | "cta" | "outro";
  content: string;
  duration: number;

  // 새로 추가된 필드
  visualNotes?: string;      // 전체적인 영상 연출 방향
  sceneHints?: SceneHint[];  // 스토리보드용 씬 분할 제안
  keywords?: string[];       // B-roll 검색 키워드
  emotionalTone?: string;    // 감정적 톤
};
```

### 2.2 AI 프롬프트 개선

**파일**: `app/lib/ai-script.server.ts`

시스템 프롬프트에 다음 요구사항 추가:
- `visualNotes`: 영상 연출 방향
- `emotionalTone`: 감정적 톤 (exciting, calm, dramatic, informative, humorous)
- `keywords`: B-roll 검색용 키워드 (3-5개)
- `sceneHints`: 스토리보드용 씬 분할 배열
  - `description`: 씬 설명
  - `visualPrompt`: AI 이미지/영상 생성 프롬프트 (영어, 상세)
  - `duration`: 씬 길이
  - `cameraAngle`: 카메라 앵글 (wide, close-up, medium, pov, aerial)

**씬 분할 원칙**:
- 각 세그먼트를 2-4개의 씬으로 분할
- 각 씬은 3-10초 길이
- visualPrompt는 영어로 작성, 구체적 시각적 요소 포함

### 2.3 스크립트 페이지 UI 업데이트

**파일**: `app/features/studio/pages/studio-script-page.tsx`

각 세그먼트 카드에 시각적 메타데이터 표시 영역 추가:
- 영상 노트 (visualNotes)
- 감정 톤 (emotionalTone) - Badge로 표시
- 키워드 (keywords) - Badge 목록으로 표시
- 씬 분할 (sceneHints) - 씬 번호, 설명, 길이, 카메라 앵글 표시

## 3. 스토리보드 생성 연계 방안

### 3.1 데이터 변환 흐름

```
ScriptSegment.sceneHints → StoryboardScene
```

| ScriptSegment 필드 | StoryboardScene 필드 | 변환 방법 |
|-------------------|---------------------|----------|
| sceneHints[].description | description | 직접 사용 |
| sceneHints[].visualPrompt | visualPrompt | 직접 사용 |
| sceneHints[].duration | duration | 직접 사용 |
| segment.id | scriptSegmentId | FK 연결 |
| - | sceneNumber | 자동 생성 |
| - | imageUrl | AI 이미지 생성 후 저장 |

### 3.2 향후 구현 필요 사항

1. **스토리보드 생성 API**
   - 엔드포인트: `POST /api/studio/generate-storyboard`
   - 입력: `ScriptSegment[]`
   - 처리: sceneHints → StoryboardScene 변환 + 이미지 생성
   - 저장: `studio_storyboard` 테이블

2. **씬 영상 생성 API**
   - 엔드포인트: `POST /api/studio/generate-scenes`
   - 입력: `StoryboardScene[]`
   - 처리: 이미지 → 영상 생성 (AI 영상 생성 서비스 연동)
   - 저장: `studio_video`, `studio_video_part` 테이블

3. **데이터 레이어 함수**
   - `generateStoryboardFromScript(projectId, segments)`: 스토리보드 자동 생성
   - `generateVideoFromStoryboard(projectId, storyboardIds)`: 영상 자동 생성

## 4. 예상 출력 예시

### 4.1 AI 생성 스크립트 예시 (새 형식)

```json
[
  {
    "type": "hook",
    "content": "지금 당장 이 영상을 보지 않으면 후회할 겁니다!",
    "duration": 5,
    "visualNotes": "강렬한 텍스트 애니메이션과 함께 시작",
    "emotionalTone": "dramatic",
    "keywords": ["attention", "urgency", "hook"],
    "sceneHints": [
      {
        "description": "화면 중앙에 큰 텍스트가 나타나며 시청자의 관심을 끈다",
        "visualPrompt": "Bold white text animation on dark background, dramatic lighting, zoom effect, 4K quality",
        "duration": 3,
        "cameraAngle": "close-up"
      },
      {
        "description": "발표자가 카메라를 향해 진지하게 말한다",
        "visualPrompt": "Professional presenter looking directly at camera, serious expression, studio lighting, medium shot",
        "duration": 2,
        "cameraAngle": "medium"
      }
    ]
  }
]
```

## 5. 완전한 대본 생성 개선 (최신)

### 5.1 문제점
기존 구현에서 AI가 생성하는 스크립트가 세그먼트 제목 수준의 짧은 내용만 포함하는 경우가 있었습니다.

### 5.2 개선 사항

**시스템 프롬프트 강화**:
- "완전한 대본" 작성 요구사항 명시
- 세그먼트별 분량 가이드라인 추가
- 스토리 흐름 및 연결성 강조

**분량 가이드라인**:
| 세그먼트 | 분량 |
|----------|------|
| Hook | 2-4문장 (강렬한 질문/놀라운 사실) |
| Intro | 4-8문장 (영상 소개 + 시청 이유) |
| Body | 각 10-20문장 이상 (상세 설명, 예시 포함) |
| CTA | 3-5문장 (구체적 행동 유도) |
| Outro | 3-5문장 (마무리 + 다음 영상 예고) |

**영상 길이별 Body 세그먼트 수**:
- 짧게 (1-2분): Body 1-2개
- 중간 (5-10분): Body 3-4개
- 길게 (10-20분): Body 5-7개

**중요 지침 (프롬프트에 포함)**:
1. 각 세그먼트 content는 실제로 말할 완전한 대본
2. 제목/요약이 아닌 발표자가 읽을 전체 스크립트
3. Body는 구체적 소주제 + 예시/설명 포함
4. 세그먼트 간 자연스러운 연결
5. 끝까지 보고 싶어지는 내러티브 구축

**기술적 변경**:
- `maxOutputTokens`: 4096 → 8192 (더 긴 대본 생성 지원)

## 6. 결론

이번 개선으로 스크립트 생성 시:
1. **완전한 대본**: 제목 수준이 아닌 실제 발표할 전체 스크립트 생성
2. **시각적 메타데이터**: 스토리보드/씬 생성에 필요한 모든 정보 포함

이를 통해:

1. **자동화된 파이프라인 구축 가능**: 스크립트 → 스토리보드 → 씬 자동 생성
2. **B-roll 검색 효율화**: 키워드 기반 스톡 영상 자동 검색
3. **일관된 영상 톤 유지**: emotionalTone 기반 영상 분위기 설정
4. **작업 시간 단축**: 수동 씬 분할 작업 불필요

다음 단계로 스토리보드 자동 생성 API를 구현하면 전체 영상 제작 파이프라인이 완성됩니다.
