# LinkShare 설계 문서

## 개요
폴더 구조로 URL 링크를 관리하고, 앱 사용자들과 공유할 수 있는 데스크톱 앱.
Google 로그인으로 사용자를 식별하고, 누가 언제 수정했는지 기록을 남긴다.

## 핵심 기능
1. **Google 로그인** - 사용자 식별 및 권한 관리
2. **폴더 관리** - 생성 / 이름 변경 / 삭제 (계층 구조, 공유/개인 구분)
3. **링크 관리** - 추가 / 수정 / 삭제 (제목 + URL)
4. **링크 미리보기** - OG 메타 태그로 제목/설명/썸네일 자동 추출
5. **링크 열기** - 클릭 시 기본 브라우저로 이동
6. **공유/개인 구분** - 최상위 폴더에서 공유/개인 설정, 하위는 상속
7. **수정 기록** - 누가, 언제, 무엇을 변경했는지 로그 저장

## 기술 스택
- **프론트엔드**: Electron + HTML/CSS/JS
- **백엔드/DB**: Firebase
  - Firebase Authentication (Google 로그인)
  - Cloud Firestore (데이터 저장)
- **배포**: electron-builder (Windows 설치 파일)

## Firebase 구조 (Firestore)

### `folders` 컬렉션
```
folders/{folderId}
{
  "name": "디자인 참고",
  "parentId": null,          // null이면 최상위 폴더, 값이 있으면 하위 폴더
  "type": "shared",          // "shared" = 공유폴더, "private" = 개인폴더
                             // ※ 최상위 폴더에서만 설정, 하위 폴더는 최상위의 type을 상속
  "ownerId": "uid123",       // 개인폴더일 때 소유자 UID (공유폴더는 null)
  "order": 0,
  "createdBy": "user@gmail.com",
  "createdAt": timestamp,
  "updatedBy": "user@gmail.com",
  "updatedAt": timestamp
}
```

#### 폴더 계층 예시
```
{ id: "f1", name: "디자인",   parentId: null, type: "shared"  }  ← 최상위 공유
{ id: "f2", name: "UI 참고",  parentId: "f1", type: "shared"  }  ← 상속
{ id: "f3", name: "모바일",   parentId: "f2", type: "shared"  }  ← 상속
{ id: "f5", name: "내 메모",  parentId: null, type: "private", ownerId: "uid123" }  ← 최상위 개인
{ id: "f6", name: "임시",    parentId: "f5", type: "private", ownerId: "uid123" }  ← 상속

결과 (사용자 uid123 기준):
── 공유 ──
📁 디자인
  📁 UI 참고
    📁 모바일
── 개인 ──
🔒 내 메모
  🔒 임시
```

#### 폴더 삭제 규칙
- 하위 폴더 또는 링크가 있는 폴더는 **삭제 불가**
- "하위 항목이 있어 삭제할 수 없습니다" 알림 표시
- 삭제하려면 하위 항목을 먼저 모두 삭제해야 함

### `links` 컬렉션
```
links/{linkId}
{
  "folderId": "folder1",
  "title": "Dribbble",
  "url": "https://dribbble.com",
  "ogTitle": "Dribbble - Discover the World's Top Designers",
  "ogDescription": "Find Top Designers & Creative Professionals...",
  "ogImage": "https://cdn.dribbble.com/assets/og-default.png",
  "favicon": "https://dribbble.com/favicon.ico",
  "order": 0,
  "createdBy": "user@gmail.com",
  "createdAt": timestamp,
  "updatedBy": "user@gmail.com",
  "updatedAt": timestamp
}
```

### `logs` 컬렉션 (수정 기록)
```
logs/{logId}
{
  "action": "create | update | delete",
  "target": "folder | link",
  "targetId": "folder1",
  "targetName": "Dribbble",
  "folderType": "shared",    // "shared" 또는 "private"
  "userId": "uid123",        // 작성자 UID (개인 로그 필터링용)
  "user": "user@gmail.com",
  "userName": "홍길동",
  "timestamp": timestamp,
  "detail": "링크 추가: Dribbble (https://dribbble.com)"
}
```

#### 수정 기록 노출 규칙
- **공유 폴더 로그** (`folderType: "shared"`): 모든 사용자에게 표시
- **개인 폴더 로그** (`folderType: "private"`): 해당 `userId` 본인에게만 표시

## UI 스타일

### 디자인 컨셉
- **다크 모드** 기본
- **macOS 스타일**: 둥근 모서리, 부드러운 그림자, 넉넉한 여백, 반투명 효과
- 시원시원하고 깔끔한 레이아웃, 답답하지 않은 간격

### CSS 프레임워크
- **Tailwind CSS** (CDN으로 로드)

### 색상 팔레트
```
배경 (메인):     #0f0f0f (거의 블랙)
배경 (사이드바):  #1a1a1a (약간 밝은 다크)
배경 (카드):     #222222 (카드/패널)
배경 (호버):     #2a2a2a
테두리:         #333333
텍스트 (기본):   #e5e5e5
텍스트 (보조):   #888888
텍스트 (비활성):  #555555
포인트 (파랑):   #3b82f6 (선택, 버튼, 링크)
포인트 (초록):   #22c55e (성공, 온라인)
포인트 (빨강):   #ef4444 (삭제, 에러)
```

### 스타일 가이드
- **모서리**: `rounded-xl` (12px) 기본, 버튼/입력은 `rounded-lg` (8px)
- **폰트**: 시스템 폰트 (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)
- **그림자**: `shadow-lg shadow-black/20` (은은한 그림자)
- **여백**: 넉넉하게 (`p-4` ~ `p-6`), 요소 간 `gap-3` ~ `gap-4`
- **전환 효과**: `transition-all duration-200` (호버, 클릭 시 부드러운 전환)
- **사이드바**: 반투명 느낌 (`bg-white/5` 또는 `backdrop-blur`)
- **카드**: 미세한 테두리 + 호버 시 밝아지는 효과
- **스크롤바**: 얇고 어두운 커스텀 스크롤바

## UI 구성

### 로그인 화면
```
┌─────────────────────────────────┐
│                                 │
│           LinkShare             │
│                                 │
│     [ Google로 로그인 ]          │
│                                 │
└─────────────────────────────────┘
```

### 메인 화면 (상단 콘텐츠 + 하단 액션 바)
```
┌──────────────────────────────────────────────────────────┐
│  LinkShare                         홍길동   [기록] [로그아웃] │
├══════════════════════════════════════════════════════════╡
│                                                          │
│  ┌─ 디렉토리 ──────┐  ┌─ 링크 목록 ────────────────────┐  │
│  │                 │  │                               │  │
│  │  ── 공유 ──     │  │  ┌──────┐  Dribbble           │  │
│  │  📁 디자인       │  │  │ 썸네일 │  세계 최고의...      │  │
│  │    📁 UI참고  ◀  │  │  └──────┘  dribbble.com      │  │
│  │      📁 모바일   │  │                               │  │
│  │    📁 아이콘     │  │  ┌──────┐  Behance            │  │
│  │  📁 개발        │  │  │ 썸네일 │  Creative...        │  │
│  │    📁 프론트     │  │  └──────┘  behance.net        │  │
│  │    📁 백엔드     │  │                               │  │
│  │                 │  │  ┌──────┐  Figma              │  │
│  │  ── 개인 ──     │  │  │ 썸네일 │  디자인 툴...        │  │
│  │  🔒 내 메모      │  │  └──────┘  figma.com          │  │
│  │  🔒 임시저장     │  │                               │  │
│  │                 │  │                               │  │
│  └─────────────────┘  └───────────────────────────────┘  │
│                                                          │
├══════════════════════════════════════════════════════════╡
│                                                          │
│  선택: 📁 UI참고                                          │
│                                                          │
│  [+ 폴더 추가]  [+ 링크 추가]  [✏️ 이름 변경]  [🗑 삭제]    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### 상단 콘텐츠 영역
- **왼쪽 (디렉토리)**: 트리 구조로 전체 폴더 표시, 클릭으로 선택 (◀ 표시)
- **오른쪽 (링크 목록)**: 선택된 폴더의 링크 카드 (썸네일 + 제목 + 설명 + URL)
- **링크 더블클릭**: 기본 브라우저로 해당 URL 열기 (`shell.openExternal`)
- **링크 단일클릭**: 선택 상태 (하단 액션 바에서 수정/삭제 가능)

#### 하단 액션 바
- 현재 선택된 항목에 따라 버튼 활성화/비활성화
- **폴더 선택 시**: [+ 폴더 추가] [+ 링크 추가] [이름 변경] [삭제]
- **링크 선택 시**: [수정] [삭제]
- **최상위에서 폴더 추가**: 공유/개인 선택 표시
- **하위 폴더 추가**: 상위 폴더의 type 자동 상속 (선택 없음)

### 수정 기록 화면 (모달 또는 패널)
```
┌─────────────────────────────────────┐
│  수정 기록                     [닫기] │
├─────────────────────────────────────┤
│  홍길동  링크 추가: Dribbble   1분 전  │
│  김철수  폴더 생성: 디자인      5분 전  │
│  홍길동  링크 삭제: Naver     10분 전  │
└─────────────────────────────────────┘
```
- 공유 폴더 로그: 모든 사용자에게 표시
- 개인 폴더 로그: 본인에게만 표시

## 파일 구조
```
LinkShare/
├── main.js           # Electron 메인 프로세스
├── preload.js        # IPC 브릿지 (보안: renderer에서 Node.js 접근 차단)
├── index.html        # UI (로그인 + 메인 화면)
├── firebase-config.js # Firebase 프로젝트 설정값
├── package.json
└── DESIGN.md
```

## 동작 흐름

### 1. 앱 실행
1. 인터넷 연결 확인
2. 오프라인이면 "인터넷 연결이 필요합니다" 알림 표시, 기능 비활성화
3. 온라인이면 로그인 화면 표시

### 2. 로그인
1. 앱 실행 시 Firebase Auth 상태 확인 (`onAuthStateChanged`)
2. 이미 로그인된 상태면 → 바로 메인 화면 전환 (재로그인 불필요)
3. 로그인 안 된 상태면 → 로그인 화면 표시
4. "Google로 로그인" 클릭 → Google OAuth 팝업
5. 로그인 성공 → 메인 화면 전환
- **세션은 영구 유지**: 로그아웃 버튼을 누르지 않는 한 앱을 껐다 켜도 로그인 상태 유지
- Firebase가 내부적으로 인증 토큰을 자동 갱신

### 3. 데이터 조회
1. Firestore에서 `folders` + `links` 실시간 구독 (onSnapshot)
2. 공유 폴더: 전체 표시
3. 개인 폴더: `ownerId == 현재 사용자 UID`인 것만 표시
4. 다른 사용자가 수정하면 자동 반영 (실시간 동기화)

### 4. 추가/수정/삭제
1. UI에서 편집 조작
2. Firestore에 데이터 write
3. `logs` 컬렉션에 수정 기록 추가 (`folderType`, `userId` 포함)
4. 실시간 구독으로 모든 사용자 화면 자동 갱신

### 5. 폴더 삭제
1. 하위 폴더 존재 여부 확인 (`parentId == 해당 폴더`)
2. 하위 링크 존재 여부 확인 (`folderId == 해당 폴더`)
3. 하위 항목이 있으면 삭제 차단 + 알림
4. 비어있으면 삭제 진행

### 6. 링크 추가 시 메타 정보 자동 추출
1. 사용자가 URL 입력
2. 메인 프로세스에서 해당 URL의 HTML fetch
3. OG 메타 태그 파싱 (fallback 순서):
   - **제목**: `og:title` → `<title>` → URL 도메인명
   - **설명**: `og:description` → `<meta name="description">` → 빈 값
   - **썸네일**: `og:image` → favicon → 기본 아이콘 (🔗)
4. 추출한 정보를 Firestore에 저장
5. 링크 카드에 썸네일 + 제목 + 설명 표시

### 7. 링크 열기
1. 링크 카드 더블클릭
2. Electron `shell.openExternal(url)` → 기본 브라우저 실행

## Firebase 설정 순서 (구현 전 필요)
1. Firebase 콘솔(https://console.firebase.google.com)에서 프로젝트 생성
2. Authentication → Google 로그인 활성화
3. Firestore Database 생성
4. 웹 앱 추가 → Firebase config 값 복사
5. `firebase-config.js`에 설정값 입력

## 보안 규칙 (Firestore)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 공유 폴더: 로그인한 모든 사용자 읽기/쓰기
    // 개인 폴더: 소유자만 읽기/쓰기
    match /folders/{folderId} {
      allow read, write: if request.auth != null &&
        (resource.data.type == 'shared' ||
         resource.data.ownerId == request.auth.uid);
      allow create: if request.auth != null;
    }

    // 링크: 로그인한 사용자 읽기/쓰기
    // 앱 레벨에서 폴더 type에 따라 개인 링크 필터링
    match /links/{linkId} {
      allow read, write: if request.auth != null;
    }

    // 수정 기록: 로그인한 사용자 읽기/쓰기
    // 앱 레벨에서 folderType + userId로 개인 로그 필터링
    match /logs/{logId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 오프라인 처리
- 앱 실행 시 인터넷 연결 확인 (`navigator.onLine`)
- 오프라인이면 화면 중앙에 "인터넷 연결이 필요합니다" 메시지 표시
- 모든 편집 기능 비활성화
- 온라인 복귀 시 자동으로 정상 동작

## 향후 확장 가능
- 폴더별 권한 관리 (읽기전용 사용자)
- 링크 즐겨찾기
- 검색 기능
- 드래그앤드롭 순서 변경
