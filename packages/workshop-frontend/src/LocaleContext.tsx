import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type Locale = 'en' | 'vi' | 'ko'

const STORAGE_KEY = 'tcg-office-locale'

export type Messages = {
  home: string
  workspaces: string
  blueprints: string
  outputs: string
  explore: string
  providers: string
  profile: string
  admin: string
  signOut: string
  language: string
  search: string
  systemPaths: string
  login: string
  signup: string
  username: string
  password: string
  workspaceDescription: string
  homeTitle: string
  homeSubtitle: string
  startConversation: string
  getStarted: string
  createWorkspace: string
  yourWorkspaces: string
  noWorkspaces: string
  searchWorkspaces: string
  loadingWorkspacesError: string
  tryAgain: string
  noWorkspacesFound: string
  rename: string
  favorite: string
  unfavorite: string
  information: string
  share: string
  delete: string
  removeFromList: string
  justNow: string
  minutesAgo: (minutes: number) => string
  hoursAgo: (hours: number) => string
  daysAgo: (days: number) => string
  taskSuggestions: {
    oneOnOne: { label: string; description: string }
    teamMeeting: { label: string; description: string }
    insights: { label: string; description: string }
    workflow: { label: string; description: string }
    app: { label: string; description: string }
  }
}

const messages: Record<Locale, Messages> = {
  en: {
    home: 'Home', workspaces: 'Workspaces', blueprints: 'Blueprints', outputs: 'Outputs', explore: 'Explore',
    providers: 'Providers', profile: 'Profile', admin: 'Admin', signOut: 'Sign out', language: 'Language',
    search: 'Search', systemPaths: 'System Paths', login: 'Sign in', signup: 'Create account', username: 'Username', password: 'Password',
    workspaceDescription: 'Each workspace is an isolated environment with its own conversations, gatekeepers, and outputs.',
    homeTitle: 'What are we working on?', homeSubtitle: 'Ask a question, create an output, or create an app that works with your tools and data.', startConversation: 'Start a new conversation…', getStarted: 'Get started', createWorkspace: 'Create workspace', yourWorkspaces: 'Your workspaces', noWorkspaces: 'You haven\'t created any workspaces yet', searchWorkspaces: 'Search workspaces…', loadingWorkspacesError: 'Something went wrong loading your workspaces.', tryAgain: 'Try again', noWorkspacesFound: 'No workspaces found', rename: 'Rename', favorite: 'Favorite', unfavorite: 'Unfavorite', information: 'Information', share: 'Share', delete: 'Delete', removeFromList: 'Remove', justNow: 'just now', minutesAgo: (n) => `${n}m ago`, hoursAgo: (n) => `${n}h ago`, daysAgo: (n) => `${n}d ago`,
    taskSuggestions: {
      oneOnOne: { label: 'Write a 1:1 pre-read', description: 'A doc with a snapshot, things to inspect, and one ask' },
      teamMeeting: { label: 'Build a team meeting deck', description: 'Slides with progress, risks, and what needs a decision' },
      insights: { label: 'Find insights in my data', description: 'Turn a spreadsheet or CSV into trends and recommendations' },
      workflow: { label: 'Automate a workflow', description: 'Trigger an agent when a new email arrives' },
      app: { label: 'Build a quick tool', description: 'A small interactive app, calculator, or dashboard' },
    },
  },
  vi: {
    home: 'Trang chủ', workspaces: 'Không gian làm việc', blueprints: 'Bản thiết kế', outputs: 'Kết quả', explore: 'Khám phá',
    providers: 'Nhà cung cấp', profile: 'Hồ sơ', admin: 'Quản trị', signOut: 'Đăng xuất', language: 'Ngôn ngữ',
    search: 'Tìm kiếm', systemPaths: 'Đường dẫn hệ thống', login: 'Đăng nhập', signup: 'Tạo tài khoản', username: 'Tên người dùng', password: 'Mật khẩu',
    workspaceDescription: 'Mỗi không gian làm việc là một môi trường riêng với các cuộc trò chuyện, trình kết nối và kết quả của riêng mình.',
    homeTitle: 'Hôm nay chúng ta làm gì?', homeSubtitle: 'Đặt câu hỏi, tạo kết quả, hoặc tạo ứng dụng với công cụ và dữ liệu của bạn.', startConversation: 'Bắt đầu cuộc trò chuyện mới…', getStarted: 'Bắt đầu', createWorkspace: 'Tạo không gian làm việc', yourWorkspaces: 'Không gian làm việc của tôi', noWorkspaces: 'Bạn chưa tạo không gian làm việc nào', searchWorkspaces: 'Tìm kiếm không gian làm việc…', loadingWorkspacesError: 'Đã xảy ra lỗi khi tải không gian làm việc.', tryAgain: 'Thử lại', noWorkspacesFound: 'Không tìm thấy không gian làm việc', rename: 'Đổi tên', favorite: 'Thêm yêu thích', unfavorite: 'Bỏ yêu thích', information: 'Thông tin', share: 'Chia sẻ', delete: 'Xóa', removeFromList: 'Xóa khỏi danh sách', justNow: 'vừa xong', minutesAgo: (n) => `${n} phút trước`, hoursAgo: (n) => `${n} giờ trước`, daysAgo: (n) => `${n} ngày trước`,
    taskSuggestions: {
      oneOnOne: { label: 'Chuẩn bị tài liệu 1:1', description: 'Tài liệu gồm hiện trạng, điểm cần xem xét và một đề xuất' },
      teamMeeting: { label: 'Tạo tài liệu họp nhóm', description: 'Slide về tiến độ, rủi ro và các quyết định cần đưa ra' },
      insights: { label: 'Tìm insight từ dữ liệu', description: 'Biến bảng tính thành xu hướng và đề xuất' },
      workflow: { label: 'Tự động hóa quy trình', description: 'Kích hoạt agent khi có email mới' },
      app: { label: 'Tạo công cụ nhanh', description: 'Ứng dụng tương tác, máy tính hoặc bảng điều khiển nhỏ' },
    },
  },
  ko: {
    home: '홈', workspaces: '워크스페이스', blueprints: '청사진', outputs: '결과물', explore: '탐색',
    providers: '제공자', profile: '프로필', admin: '관리자', signOut: '로그아웃', language: '언어',
    search: '검색', systemPaths: '시스템 경로', login: '로그인', signup: '계정 만들기', username: '사용자 이름', password: '비밀번호',
    workspaceDescription: '각 워크스페이스는 대화, 게이트키퍼, 결과물을 독립적으로 관리하는 환경입니다.',
    homeTitle: '오늘은 무엇을 만들까요?', homeSubtitle: '질문하거나, 결과물을 만들거나, 도구와 데이터로 앱을 만들어 보세요.', startConversation: '새 대화 시작하기…', getStarted: '시작하기', createWorkspace: '워크스페이스 만들기', yourWorkspaces: '내 워크스페이스', noWorkspaces: '아직 만든 워크스페이스가 없습니다', searchWorkspaces: '워크스페이스 검색…', loadingWorkspacesError: '워크스페이스를 불러오는 중 문제가 발생했습니다.', tryAgain: '다시 시도', noWorkspacesFound: '워크스페이스를 찾을 수 없습니다', rename: '이름 변경', favorite: '즐겨찾기 추가', unfavorite: '즐겨찾기 해제', information: '정보', share: '공유', delete: '삭제', removeFromList: '목록에서 삭제', justNow: '방금 전', minutesAgo: (n) => `${n}분 전`, hoursAgo: (n) => `${n}시간 전`, daysAgo: (n) => `${n}일 전`,
    taskSuggestions: {
      oneOnOne: { label: '1:1 사전 자료', description: '현황·점검·요청을 담은 문서' },
      teamMeeting: { label: '팀 회의 자료 만들기', description: '진행·리스크·결정 사항 슬라이드' },
      insights: { label: '데이터에서 인사이트 찾기', description: '스프레드시트를 트렌드·제안으로' },
      workflow: { label: '워크플로 자동화', description: '새 메일 수신 시 에이전트 실행' },
      app: { label: '간단한 도구 만들기', description: '인터랙티브 앱·계산기·대시보드' },
    },
  },
}

type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: Messages }
const LocaleContext = createContext<LocaleContextValue | null>(null)

function initialLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'vi' || stored === 'ko') return stored
  const browser = navigator.language.toLowerCase()
  return browser.startsWith('vi') ? 'vi' : browser.startsWith('ko') ? 'ko' : 'en'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const setLocale = (next: Locale) => {
    setLocaleState(next)
    localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.lang = next
  }
  const value = useMemo(() => ({ locale, setLocale, t: messages[locale] }), [locale])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used within LocaleProvider')
  return context
}
