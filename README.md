# Voice Manager 

🌐 **현재 운영 중**: https://yes2310.xyz

음성 인식 기반 AI 스케줄러 프로젝트입니다.  
사용자가 음성으로 일정을 등록하면 OpenAI GPT를 통해 자동으로 파싱하여 캘린더에 추가합니다.

## ✨ 주요 기능

- 🎤 **음성 인식**: 한국어 음성으로 일정 등록
- 🤖 **AI 파싱**: OpenAI GPT를 활용한 자연어 처리
- 📅 **캘린더 관리**: 드래그앤드롭으로 일정 이동/수정
- 🔐 **사용자 인증**: JWT 기반 로그인/회원가입
- 📱 **반응형 UI**: 모든 디바이스에서 사용 가능
- 📊 **일정 요약**: AI가 생성하는 스마트 브리핑

## 🛠️ 기술 스택

### Frontend
- **React** + **JavaScript**
- **React Big Calendar** - 캘린더 UI
- **Tailwind CSS** - 스타일링
- **Web Speech API** - 음성 인식

### Backend  
- **Node.js** + **Express**
- **MongoDB** + **Mongoose** - 데이터베이스
- **OpenAI GPT-3.5** - 자연어 처리
- **JWT** - 인증
- **HTTPS** - 보안 연결

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

- **Node.js** 버전 16 이상
- **MongoDB** 서버 (로컬 또는 Atlas 등 외부 호스트)
- **OpenAI API 키** ([platform.openai.com](https://platform.openai.com/api-keys)에서 발급)

---

## 📦 설치

루트 디렉터리에서 아래 명령어를 실행하여 전체 워크스페이스 의존성을 설치합니다:

```bash
npm install
```

※ `frontend/`와 `backend/` 디렉터리의 패키지를 동시에 설치합니다.

---

## 🚀 실행 방법

### ✅ 프로덕션 모드 실행

이 프로젝트는 HTTPS 클라우드플레어 도메인으로 배포되도록 설계되었습니다.

1. **프론트엔드 빌드**:
```bash
npm run build:frontend
```

2. **백엔드 서버 실행**:
```bash
cd backend
node server.js
```

### 📍 접속 주소

- **온라인 접속**: https://yes2310.xyz
- **로컬 접속**: https://localhost:443

### ⚠️ 개발 모드 관련 주의사항

클라우드플레어 Origin Certificate를 사용하는 HTTPS 환경에서는 `npm run dev` 명령어로 개발 서버를 실행하면 브라우저에서 인증서 오류가 발생합니다. 반드시 위의 프로덕션 모드로 실행해주세요.

---

## ⚙️ 환경 변수 설정

### 1. 백엔드 환경 변수 설정

`backend/.env.example` 파일을 참고하여 `backend/.env` 파일을 생성하세요:

```bash
# backend 디렉터리에서
cp .env.example .env
```

그리고 **OpenAI API 키만** 실제 값으로 변경하세요:

```env
# 서버 설정 - HOST를 비워두면 자동으로 감지됩니다
PORT=3000
HOST=

# 데이터베이스 (이미 설정됨)
MONGODB_URI=mongodb://yes2310.duckdns.org:27017/scheduleApp

# OpenAI API 키 (https://platform.openai.com/api-keys 에서 발급)
OPENAI_API_KEY=your_openai_api_key_here

# 프론트엔드 포트
FRONTEND_PORT=3001
```

**💡 참고**: 
- MongoDB는 이미 공개 서버로 설정되어 있어 별도 설정이 불필요합니다
- OpenAI API 키만 발급받아서 입력하면 됩니다

**📍 현재 운영 중인 서비스**: https://yes2310.xyz

### 2. 프론트엔드 환경 변수 (선택사항)

필요시 `frontend/.env` 파일을 생성하여 포트를 설정할 수 있습니다:

```
PORT=3001
```

---

## 🔧 네트워크 설정 (포트포워딩 & 방화벽)

### 1. 포트 설정 개요

이 프로젝트는 다음 포트들을 사용합니다:

- **포트 80**: HTTP → HTTPS 리다이렉션
- **포트 443 (또는 3000)**: HTTPS 메인 서버
- **포트 27017**: MongoDB (외부 접속 시)

### 2. Windows 방화벽 설정

Windows Defender 방화벽에서 다음 포트들을 허용해야 합니다:

```bash
# 관리자 권한으로 PowerShell 실행 후

# HTTP 포트 (80) 허용
netsh advfirewall firewall add rule name="Voice Manager HTTP" dir=in action=allow protocol=TCP localport=80

# HTTPS 포트 (443) 허용  
netsh advfirewall firewall add rule name="Voice Manager HTTPS" dir=in action=allow protocol=TCP localport=443

# 개발용 포트 (3000) 허용 (선택사항)
netsh advfirewall firewall add rule name="Voice Manager Dev" dir=in action=allow protocol=TCP localport=3000
```

### 3. 라우터 포트포워딩 설정

외부에서 접속할 수 있도록 라우터에서 포트포워딩을 설정하세요:

- **외부 포트 80** → **내부 IP:80**
- **외부 포트 443** → **내부 IP:443** (또는 3000)

### 4. 클라우드플레어 설정 (현재 구성)

현재 `yes2310.xyz` 도메인은 클라우드플레어를 통해 다음과 같이 설정되어 있습니다:

- **DNS A 레코드**: `yes2310.xyz` → 서버 IP
- **SSL/TLS**: Full (strict) 모드
- **Origin Certificate**: 서버에 설치됨
- **포트**: 443 (HTTPS)

### 5. 네트워크 확인 명령어

설정이 올바른지 확인하려면:

```bash
# 포트 사용 상태 확인
netstat -an | findstr ":80 :443 :3000"

# 방화벽 규칙 확인
netsh advfirewall firewall show rule name="Voice Manager HTTP"
netsh advfirewall firewall show rule name="Voice Manager HTTPS"
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
| `npm run build:frontend`| 프론트엔드 프로덕션 빌드 생성             |
| `cd backend && node server.js`| 백엔드 프로덕션 서버 실행      |

### 개발용 스크립트 (참고용)
| 스크립트               | 설명                                       |
|------------------------|--------------------------------------------|
| `npm run dev`          | ⚠️ HTTPS 환경에서는 인증서 오류 발생      |
| `npm run start:backend`| 백엔드 개발 서버 실행                     |
| `npm run start:frontend`| 프론트엔드 개발 서버 실행                |

---

## 🙏 감사합니다! 🎉