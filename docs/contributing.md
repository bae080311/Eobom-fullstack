# 기여 가이드

## 개발 환경 설정

### 사전 요구사항

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker Desktop

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/bae080311/Eobom-fullstack.git
cd Eobom-fullstack

# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에서 필요한 값 수정

# 데이터베이스 기동
docker compose up -d

# Prisma 마이그레이션
pnpm db:migrate

# 개발 서버 실행
pnpm dev
```

## CI 파이프라인

`.github/workflows/ci.yml`에서 정의한 CI는 모든 PR에서 자동 실행된다.

### CI 단계

1. **pnpm install** - 의존성 설치 (`--frozen-lockfile`)
2. **typecheck** - TypeScript 타입 검사 (`turbo typecheck`)
3. **lint** - ESLint 검사 (`turbo lint`)
4. **build** - 전체 빌드 (`turbo build`)
5. **test** - 단위 테스트 (`turbo test`)

### CI 통과 요건

PR을 머지하려면 모든 CI 단계가 통과해야 한다.

## 브랜치 전략

```
main        # 프로덕션 배포 브랜치
develop     # 개발 통합 브랜치
feat/*      # 기능 개발
fix/*       # 버그 수정
chore/*     # 기타 작업
docs/*      # 문서 수정
```

## 커밋 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경 (기능 변경 없음)
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드, 설정 변경
```

예시:
```
feat: 치료사 아동 등록 API 구현
fix: 초대 코드 만료 시간 계산 오류 수정
docs: API 문서 업데이트
```

## PR 규칙

1. PR 제목은 커밋 컨벤션을 따른다.
2. PR 본문은 PR 템플릿을 사용한다.
3. 셀프 리뷰 후 리뷰어를 지정한다.
4. CI 통과 후 머지한다.

## 로컬 검증

PR 생성 전 로컬에서 검증한다:

```bash
pnpm typecheck   # 타입 검사
pnpm lint        # 린트
pnpm build       # 빌드
pnpm test        # 테스트
```
