# Voice Manager Monorepo

음성 인식 기반 AI 스케줄러 프로젝트입니다.  
프론트엔드(React)와 백엔드(Express/MongoDB)를 하나의 모노레포로 관리합니다.

## 디렉터리 구조

/
├─ frontend/      # React 앱
├─ backend/       # Express 서버
└─ README.md      # 프로젝트 설명 및 실행 가이드

## 사전 준비

- Node.js ≥14
- MongoDB 서버 (로컬 또는 Atlas)

## 설치

루트 디렉터리에서 한 번만 실행:

```bash
npm install

	•	frontend/와 backend/ 워크스페이스의 의존성을 한꺼번에 설치합니다.

실행

개발 모드

백엔드와 프론트를 동시에 실행하려면:

npm run dev

	•	백엔드: http://localhost:3000
	•	프론트엔드: http://localhost:3001 (또는 frontend/.env에 지정한 포트)

개별 실행
	•	백엔드만 실행:

npm run start:backend


	•	프론트엔드만 실행:

npm run start:frontend



환경 변수
	•	프론트엔드 (frontend/.env)

PORT=3001


	•	백엔드 (backend/.env)

MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>



빌드 & 배포
	1.	리포지토리 클론
	2.	npm install
	3.	환경 변수 설정
	4.	프론트엔드 빌드:

npm run build:frontend

→ frontend/build 디렉터리에 프로덕션 빌드 생성

	5.	백엔드 시작:

npm run start:backend

→ Express 서버에서 frontend/build 정적 파일 제공

주요 스크립트

스크립트	설명
npm install	루트 및 모든 워크스페이스 의존성 설치
npm run dev	백엔드 + 프론트 개발 서버 동시 실행
npm run start:backend	백엔드(Express) 서버만 실행
npm run start:frontend	프론트엔드(React) 개발 서버만 실행
npm run build:frontend	프론트엔드 프로덕션 빌드

감사합니다! 🎉