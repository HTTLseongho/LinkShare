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
- 링크 즐겨찾기
- 검색 기능
- 드래그앤드롭 순서 변경

---

## [Phase 2] 그룹 기반 공유 폴더

### 개요
현재 공유 폴더는 모든 로그인 사용자에게 보이지만, 특정 사람들끼리만 공유되는 그룹 단위 공유로 변경한다.

### 가능성 판단
- **가능**: 현재 Firestore 구조에 `groups` 컬렉션 추가 + `folders`에 `groupId` 필드 추가로 구현 가능
- Firebase Auth UID 기반으로 멤버십 관리가 자연스럽게 연동됨
- Firestore Security Rules에서 그룹 멤버 여부 검증 가능

### 새로운 Firestore 구조

#### `groups` 컬렉션 (신규)
```
groups/{groupId}
{
  "name": "디자인팀",
  "ownerId": "uid123",              // 그룹 생성자 (관리자)
  "members": ["uid123", "uid456"],   // 멤버 UID 배열
  "inviteCode": "ABC123",           // 6자리 초대 코드
  "inviteCodeExpiry": timestamp,    // 초대 코드 만료 시간 (24시간)
  "createdAt": timestamp
}
```

#### `folders` 컬렉션 변경
```
folders/{folderId}
{
  ...기존 필드,
  "groupId": "group1"    // 공유 폴더일 때 소속 그룹 (신규 필드)
                         // 개인 폴더는 null
}
```

### 사용자 시나리오

#### 1. 그룹 생성
```
사용자 A → 사이드바 상단 [+ 그룹 만들기] → 이름 입력 → A가 관리자(owner)
```

#### 2. 멤버 초대 (코드 즉시 참여 방식, 별도 승인 불필요)
```
관리자 A → 그룹 설정 → [초대 코드 생성] → 6자리 코드 표시 + 복사 → 메신저로 전달
사용자 B → [그룹 참여] → 코드 입력 → 즉시 참여 완료
```
- 코드 유효기간 24시간, 관리자가 재생성 시 기존 코드 무효화
- 별도 승인 절차 없음 (코드 자체가 비공개 정보이므로 충분)

#### 3. 그룹 나가기
```
일반 멤버 B → 그룹 설정 → [그룹 나가기] → 확인 → 해당 그룹 폴더 사라짐
  - B가 만든 링크/폴더는 그룹에 그대로 남음

관리자 A → 나가기 시도
  - 멤버 남아있으면 → "관리자를 위임한 후 나갈 수 있습니다"
  - 멤버 없으면 → "그룹이 삭제됩니다" 확인 → 그룹+폴더+링크 전부 삭제
```

#### 4. 멤버 강제 퇴장 (관리자 전용)
```
관리자 A → 그룹 설정 → 멤버 목록 → 사용자 C [내보내기] → C 화면에서 그룹 즉시 사라짐
```

#### 5. 관리자 위임
```
관리자 A → 그룹 설정 → 멤버 B [관리자 위임] → A는 일반 멤버, B가 관리자
```

#### 6. 신규 사용자 (그룹 없음)
```
로그인 → 사이드바에 "── 개인 ──"만 표시
상단 안내: "그룹을 만들거나 초대 코드로 참여하세요"
[+ 그룹 만들기] / [그룹 참여] 버튼 표시
```

### 사이드바 구조 변화
```
── 디자인팀 ──          ← 그룹 (접기/펼치기)
  📁 디자인
  📁 개발
── 사이드 프로젝트 ──    ← 다른 그룹
  📁 아이디어
── 개인 ──              ← 기존 그대로
  🔒 내 메모
```

### 그룹 설정 모달
```
관리자:  초대 코드 생성/복사, 멤버 목록, 멤버 내보내기, 관리자 위임
일반 멤버: 멤버 목록 보기, 그룹 나가기
```

### 초대 코드 방식
1. 그룹 관리자가 "초대 코드 생성" 클릭
2. 6자리 랜덤 코드 생성 (예: `A3F8K2`), 24시간 유효
3. 코드를 카카오톡/메신저 등으로 전달
4. 초대받은 사용자가 앱에서 "그룹 참여" → 코드 입력
5. 코드 유효성 확인 → `groups.members` 배열에 UID 추가

#### UI 추가 요소
- 사이드바 상단: 그룹 선택 드롭다운 또는 탭
- 설정 모달: 그룹 생성 / 멤버 관리 / 초대 코드 생성
- 그룹 참여 모달: 초대 코드 입력

### 데이터 접근 규칙 변경
```
// 공유 폴더: 해당 그룹 멤버만 읽기/쓰기
// 개인 폴더: 소유자만 (기존과 동일)
match /folders/{folderId} {
  allow read, write: if request.auth != null && (
    resource.data.type == 'private' && resource.data.ownerId == request.auth.uid ||
    resource.data.type == 'shared' && request.auth.uid in
      get(/databases/$(database)/documents/groups/$(resource.data.groupId)).data.members
  );
}
```

### 개발 순서
1. `groups` 컬렉션 및 CRUD 구현
2. 초대 코드 생성/검증 로직
3. `folders`에 `groupId` 필드 추가 및 쿼리 수정
4. UI: 그룹 선택, 그룹 관리, 초대 코드 모달
5. Firestore Security Rules 업데이트
6. 기존 공유 폴더 마이그레이션 (기본 그룹으로 이동)

---

## [Phase 3] Android / iOS 앱 배포

### 개요
현재 웹 기반(HTML/JS + Firebase)으로 되어있어 네이티브 앱 전환이 가능하다.

### 선택지 비교

| 방법 | 수정량 | 스토어 배포 | 네이티브 기능 | 추천도 |
|------|--------|------------|-------------|--------|
| **PWA (현재)** | 없음 | X (홈 화면 추가만) | 제한적 | 이미 완료 |
| **Capacitor** | 최소 | O (Play Store, App Store) | 가능 (카메라, 푸시 등) | ★★★ 추천 |
| **Flutter** | 전체 재작성 | O | 최고 | 공수 큼 |
| **React Native** | 전체 재작성 | O | 최고 | 공수 큼 |

### 추천: Capacitor (Ionic)

#### 이유
- 현재 `index.html` 코드를 **거의 그대로** 사용 가능
- 웹뷰 기반이지만 네이티브 플러그인(푸시 알림, 딥링크 등) 사용 가능
- 하나의 코드베이스로 **Web + Android + iOS** 동시 배포
- Firebase SDK도 웹 버전 그대로 동작

#### Capacitor 적용 순서
1. Capacitor 초기화
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init LinkShare com.linkshare.app --web-dir .
   ```
2. 플랫폼 추가
   ```bash
   npx cap add android
   npx cap add ios
   ```
3. 빌드 및 동기화
   ```bash
   npx cap sync
   ```
4. 네이티브 프로젝트 열기
   ```bash
   npx cap open android   # Android Studio
   npx cap open ios        # Xcode (macOS 필요)
   ```
5. 스토어 배포
   - Android: Google Play Console에서 APK/AAB 업로드
   - iOS: Apple Developer 계정 + Xcode에서 Archive → App Store Connect

#### 주의사항
- iOS 빌드는 **macOS + Xcode** 필요
- App Store 배포는 **Apple Developer 계정** 필요 (연 $99)
- Google Play 배포는 **Google Play Console 계정** 필요 (일회성 $25)

### 파일 구조 변경 (Capacitor 적용 후)
```
LinkShare/
├── main.js              # Electron 메인 프로세스
├── preload.js           # Electron IPC 브릿지
├── index.html           # UI (공용: Web + Electron + 모바일)
├── manifest.json        # PWA 매니페스트
├── sw.js                # 서비스워커
├── capacitor.config.ts  # Capacitor 설정 (신규)
├── android/             # Android 네이티브 프로젝트 (신규)
├── ios/                 # iOS 네이티브 프로젝트 (신규)
├── firebase.json
├── .firebaserc
├── package.json
└── DESIGN.md
```
