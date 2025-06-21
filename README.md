# Voice Manager Monorepo

음성 인식 기반 AI 스케줄러 프로젝트입니다.  
프론트엔드(React)와 백엔드(Express/MongoDB)를 하나의 모노레포로 관리합니다.

---

## 📁 디렉터리 구조

```
/
├─ frontend/      # React 앱
├─ backend/       # Express 서버
└─ README.md      # 프로젝트 설명 및 실행 가이드
```

---

## 🛠️ 사전 준비

- Node.js 버전 14 이상
- MongoDB 서버 (로컬 또는 Atlas 등 외부 호스트 가능)

---

## 📦 설치

루트 디렉터리에서 아래 명령어를 실행하여 전체 워크스페이스 의존성을 설치합니다:

```bash
npm install
```

※ `frontend/`와 `backend/` 디렉터리의 패키지를 동시에 설치합니다.

---

## 🚀 실행 방법

### ✅ 개발 모드 실행

백엔드와 프론트를 동시에 실행하려면:

```bash
npm run dev
```

- 백엔드: http://localhost:3001  
- 프론트엔드: http://localhost:3000 (또는 `frontend/.env`에 지정된 포트)

### ✅ 개별 실행

- 백엔드만 실행:

```bash
npm run start:backend
```

- 프론트엔드만 실행:

```bash
npm run start:frontend
```

---

## ⚙️ 환경 변수 설정

### frontend/.env

```
PORT=3000
```

### backend/.env

```
PORT=3001
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
```

---

## 📦 빌드 & 배포

1. 리포지토리 클론  
2. 의존성 설치

```bash
npm install
```

3. 환경 변수 설정  
4. 프론트엔드 빌드

```bash
npm run build:frontend
```

→ `frontend/build` 디렉터리에 프로덕션 빌드 생성

5. 백엔드 실행

```bash
npm run start:backend
```

→ Express 서버가 `frontend/build`의 정적 파일을 서빙합니다.

---

## 📜 주요 스크립트

| 스크립트               | 설명                                       |
|------------------------|--------------------------------------------|
| `npm install`          | 루트 및 모든 워크스페이스 의존성 설치     |
| `npm run dev`          | 백엔드 + 프론트 개발 서버 동시 실행       |
| `npm run start:backend`| 백엔드(Express) 서버만 실행               |
| `npm run start:frontend`| 프론트엔드(React) 개발 서버만 실행        |
| `npm run build:frontend`| 프론트엔드 프로덕션 빌드 생성             |

---

## 🤝 기여 방법

1. Fork
2. 브랜치 생성:  
   ```bash
   git checkout -b feature/your-feature
   ```
3. 커밋:  
   ```bash
   git commit -m "feat: your feature"
   ```
4. 푸시:  
   ```bash
   git push origin feature/your-feature
   ```
5. Pull Request 생성

---

## 🙏 감사합니다! 🎉