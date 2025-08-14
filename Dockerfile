# syntax=docker/dockerfile:1.7

########## Build Stage ##########
FROM node:20-alpine AS builder
WORKDIR /app

# ติดตั้ง dependencies สำหรับ build (sharp, native addons)
RUN apk add --no-cache libc6-compat python3 make g++

# ใช้ corepack เพื่อใช้ pnpm เวอร์ชันตาม package.json
RUN corepack enable

# Copy ไฟล์ dependencies และติดตั้ง
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy โค้ดทั้งหมด
COPY . .

# ปิด telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js
RUN pnpm build

# ตัด devDependencies ออก
RUN pnpm prune --prod


########## Runtime Stage ##########
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3400
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# ติดตั้ง runtime deps ที่จำเป็น (sharp)
RUN apk add --no-cache libc6-compat

# ใช้ corepack สำหรับ pnpm CLI
RUN corepack enable

# Copy ไฟล์จาก builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3400

# รันแอป
CMD ["pnpm", "start"]
