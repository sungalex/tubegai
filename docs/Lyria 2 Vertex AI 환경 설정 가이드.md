# Lyria 2 (Vertex AI) 환경 설정 가이드

Lyria 2는 Vertex AI 전용 API라서 Gemini API 키로는 사용할 수 없습니다. 별도의 Google Cloud 프로젝트 설정이 필요합니다.

## 1. 필요 환경변수

GOOGLE_CLOUD_PROJECT_ID=your-project-id # 필수
GOOGLE_CLOUD_LOCATION=us-central1 # 선택 (기본값: us-central1)

## 2. 설정 순서

### A. Google Cloud 프로젝트 생성/확인

```bash
# 기존 프로젝트 목록 확인
gcloud projects list

# 또는 새 프로젝트 생성
gcloud projects create your-project-id
gcloud config set project your-project-id
```

### B. Vertex AI API 활성화

```bash
gcloud services enable aiplatform.googleapis.com
```

### C. 로컬 인증 설정 (개발 환경)

```bash
# Application Default Credentials 로그인
gcloud auth application-default login
현재 코드의 getAccessToken()(ai-lyria.server.ts:147)은 다음 순서로 인증 시도합니다:

GCP 메타데이터 서버 (Cloud Run/GCE 배포 시 자동)
gcloud auth print-access-token (로컬 개발 시)
```

### D. .env에 추가

```txt
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

## 3. 확인 방법

```bash
# gcloud CLI가 정상 작동하는지 확인
gcloud auth print-access-token

# 프로젝트 ID 확인
gcloud config get-value project
```

## 4. 비용 참고

Lyria 2는 Vertex AI 유료 API입니다
Vertex AI 가격 페이지에서 Music Generation 요금 확인
API 키 미설정 시 파이프라인은 음악 없이 정상 진행됩니다 (placeholder 반환)

## 5. 배포 환경 (Cloud Run 등)

배포 시에는 gcloud CLI 대신 서비스 계정이 자동으로 인증됩니다:

```bash
# 서비스 계정에 Vertex AI 권한 부여
gcloud projects add-iam-policy-binding your-project-id \
  --member="serviceAccount:YOUR_SA@your-project-id.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```
