# syntax=docker/dockerfile:1
#
# API 운영 이미지. 저장소 루트를 빌드 컨텍스트로 잡아야 한다 (pnpm 워크스페이스):
#   docker build -f apps/api/Dockerfile -t eobom-api .

# ==================== builder ====================
FROM node:20-alpine AS builder

RUN corepack enable
WORKDIR /repo

# 루트 package.json의 prepare 스크립트가 husky를 부르는데
# .git이 없는 컨테이너에서는 실패한다.
ENV HUSKY=0

COPY . .

RUN pnpm install --frozen-lockfile

# Prisma Client는 스키마에서 생성되는 코드다. 빌드 시점에 구워 둔다.
RUN pnpm db:generate

# shared를 api보다 먼저, 그리고 --force로 빌드한다.
# nest CLI는 @eobom/shared가 node_modules에서 실제로 해석되면 bare specifier를
# 그대로 두지만, 해석에 실패하면 tsconfig paths 타깃(.../src/index.ts)으로
# 경로를 다시 써 버린다. 즉 shared/dist가 없는 채로 api를 빌드하면 런타임에만
# 터지는 `.ts` import가 조용히 구워진다.
# --force는 stale한 tsbuildinfo 때문에 tsc가 빌드를 건너뛰는 경우를 막는다.
RUN pnpm --filter @eobom/shared exec tsc --build --force
RUN test -f packages/shared/dist/index.js \
  || (echo "packages/shared/dist/index.js가 없습니다 — api 빌드가 깨진 경로로 구워집니다." && exit 1)

RUN pnpm --filter @eobom/api build

# 위 실패 모드는 런타임에만 드러나므로 빌드 단계에서 직접 확인한다.
RUN if grep -rq "packages/shared/src" apps/api/dist/apps/api/src; then \
      echo "빌드 산출물이 @eobom/shared를 소스 경로로 가리키고 있습니다 (nest CLI alias 재작성)."; \
      exit 1; \
    fi

# ==================== runner ====================
FROM node:20-alpine AS runner

WORKDIR /repo
ENV NODE_ENV=production

# pnpm의 node_modules는 .pnpm 스토어를 가리키는 심링크 구조다.
# 루트와 앱의 node_modules를 함께 옮겨야 링크가 끊기지 않는다.
COPY --from=builder /repo/package.json /repo/pnpm-workspace.yaml ./
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/prisma ./prisma
COPY --from=builder /repo/apps/api/package.json ./apps/api/package.json
COPY --from=builder /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /repo/apps/api/dist ./apps/api/dist

# 마이그레이션은 이미지에 굽되 자동 실행하지 않는다 — 레이어 7 §7.5의
# "프로덕션 마이그레이션은 수동 승인 + prisma migrate deploy" 원칙.
# 배포 파이프라인에서 별도 단계로 `pnpm db:migrate:prod`를 돌린다.

USER node
EXPOSE 3001

WORKDIR /repo/apps/api

# --import로 instrument.js를 preload한다. ESM에서는 main.js의 정적 import만으로는
# Sentry의 로더 훅이 의존 모듈보다 먼저 등록되지 않아 자동 계측이 일부 누락된다.
# 같은 파일이 preload와 정적 import로 두 번 지정되지만 ESM 모듈 캐시가 같은
# URL을 한 번만 평가하므로 Sentry.init은 한 번만 돈다.
CMD ["node", "--import", "./dist/apps/api/src/instrument.js", "dist/apps/api/src/main.js"]
