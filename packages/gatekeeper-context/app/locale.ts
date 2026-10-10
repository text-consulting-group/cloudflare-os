import { useMemo, useSyncExternalStore } from "react";

/** Shared with workshop-frontend's LocaleContext so one choice covers every UI. */
export type Locale = "en" | "vi" | "ko";

const STORAGE_KEY = "tcg-office-locale";

export type Messages = {
  // Page chrome
  pageTitle: string;
  pageSubtitle: string;
  collectionOverview: string;
  collectionOptions: string;
  documents: string;
  editableDocuments: string;
  access: string;
  visibility: string;
  source: string;
  options: string;
  view: string;
  close: string;
  cancel: string;
  save: string;
  saved: string;
  add: string;
  delete: string;
  editDetails: string;
  // Collections
  collectionsDescription: string;
  searchCollections: string;
  newCollection: string;
  createCollection: string;
  editCollection: string;
  deleteCollection: string;
  collectionCreated: string;
  collectionUpdated: string;
  collectionDeleted: string;
  collectionRefreshed: string;
  collectionType: string;
  nameEmpty: string;
  shortNameHint: string;
  visibilityEveryone: string;
  visibilityOnlyMe: string;
  visibilityPrivate: string;
  visibilityPublic: string;
  // Files
  newFile: string;
  newFolder: string;
  addFileOrFolder: string;
  uploadFiles: string;
  uploadFolder: string;
  deleteDocument: string;
  fileNameHint: string;
  fileNameInvalid: string;
  exampleFileName: string;
  describeDocument: string;
  noDescription: string;
  noDescriptionInFile: string;
  definedInFile: string;
  emptyDocument: string;
  noFiles: string;
  skillDetected: string;
  chooseIcon: string;
  // Errors
  failedToCreateCollection: string;
  failedToUpdateCollection: string;
  failedToDeleteCollection: string;
  failedToCreateFile: string;
  failedToSave: string;
  unavailable: string;
  maybeDeleted: string;
  // Git mirror
  gitMirror: string;
  gitReadOnly: string;
  gitBranch: string;
  gitBranchHint: string;
  remoteUrl: string;
  createToken: string;
  createTokenHint: string;
  gitTokenCreated: string;
  gitTokenRevoked: string;
  manageGitTokens: string;
  noGitTokens: string;
  loadingTokens: string;
  gitSyncUnavailable: string;
  configureGitlab: string;
  setMirrorDirection: string;
  setRepoUrl: string;
  setAuthMethod: string;
  setUsername: string;
  setPassword: string;
  clickAddNew: string;
  clickMirror: string;
  clickUpdateNow: string;
  // Source labels
  sourceWeb: string;
  sourceGit: string;
  sourcePrivate: string;
  sourcePublic: string;
};

const messages: Record<Locale, Messages> = {
  en: {
    pageTitle: "Context Library",
    pageSubtitle: "Collections of documents, skills, and other files your agents can use.",
    collectionOverview: "Collection overview",
    collectionOptions: "Collection options",
    documents: "Documents",
    editableDocuments: "Editable documents",
    access: "Access",
    visibility: "Visibility",
    source: "Source",
    options: "Options",
    view: "View",
    close: "Close",
    cancel: "Cancel",
    save: "Save",
    saved: "Saved",
    add: "Add",
    delete: "Delete",
    editDetails: "Edit details",
    collectionsDescription: "A collection of documents, skills, and other files your agents can use.",
    searchCollections: "Search collections…",
    newCollection: "New collection",
    createCollection: "Create collection",
    editCollection: "Edit collection",
    deleteCollection: "Delete collection",
    collectionCreated: "Collection created",
    collectionUpdated: "Collection updated",
    collectionDeleted: "Collection deleted",
    collectionRefreshed: "Collection refreshed",
    collectionType: "Collection type",
    nameEmpty: "Name can't be empty",
    shortNameHint: "A short name, e.g., Brand guidelines",
    visibilityEveryone: "Everyone",
    visibilityOnlyMe: "Only me",
    visibilityPrivate: "private",
    visibilityPublic: "public",
    newFile: "New file",
    newFolder: "New folder",
    addFileOrFolder: "Add file or folder",
    uploadFiles: "Upload files",
    uploadFolder: "Upload folder",
    deleteDocument: "Delete document",
    fileNameHint: "File name — edit to rename (the extension sets the type)",
    fileNameInvalid: "File name can't contain '/'",
    exampleFileName: "file-name.md",
    describeDocument: "Describe what this document contains and when an agent should use it…",
    noDescription: "No description yet.",
    noDescriptionInFile: "No description in this file yet.",
    definedInFile: "Defined in this file; edit it in the document below.",
    emptyDocument: "This document is empty.",
    noFiles: "No files in this collection",
    skillDetected: "Contains a valid Agent Skill",
    chooseIcon: "Choose an icon",
    failedToCreateCollection: "Failed to create collection",
    failedToUpdateCollection: "Failed to update collection",
    failedToDeleteCollection: "Failed to delete collection",
    failedToCreateFile: "Failed to create file",
    failedToSave: "Failed to save",
    unavailable: "This collection is no longer available",
    maybeDeleted: "It may have been deleted.",
    gitMirror: "Git mirror",
    gitReadOnly: "Git content is read-only and shows its most recently cached version.",
    gitBranch: "Git branch",
    gitBranchHint: "This branch to pull from when refreshing the collection.",
    remoteUrl: "Remote URL",
    createToken: "Create token",
    createTokenHint: "Create a token to mirror content from an external git repository.",
    gitTokenCreated: "Git token created",
    gitTokenRevoked: "Git token revoked",
    manageGitTokens: "Manage git tokens",
    noGitTokens: "No Git tokens yet.",
    loadingTokens: "Loading tokens...",
    gitSyncUnavailable: "Git synchronization unavailable",
    configureGitlab: "Configure GitLab mirroring",
    setMirrorDirection: 'Set Mirror direction to Push',
    setRepoUrl: "Set Git repository URL to the remote URL above",
    setAuthMethod: "Set Authentication method to Username and Password",
    setUsername: 'Set Username to "gitlab"',
    setPassword: "Set Password to the password above",
    clickAddNew: 'Click "Add new" button to open setup flow',
    clickMirror: 'Click "Mirror repository" button to finish',
    clickUpdateNow: 'Click "Update now" button to trigger an initial push',
    sourceWeb: "web",
    sourceGit: "git",
    sourcePrivate: "private",
    sourcePublic: "public",
  },
  vi: {
    pageTitle: "Thư viện ngữ cảnh",
    pageSubtitle: "Các bộ sưu tập tài liệu, kỹ năng và tệp khác mà agent của bạn có thể sử dụng.",
    collectionOverview: "Tổng quan bộ sưu tập",
    collectionOptions: "Tùy chọn bộ sưu tập",
    documents: "Tài liệu",
    editableDocuments: "Tài liệu có thể chỉnh sửa",
    access: "Quyền truy cập",
    visibility: "Hiển thị",
    source: "Nguồn",
    options: "Tùy chọn",
    view: "Xem",
    close: "Đóng",
    cancel: "Hủy",
    save: "Lưu",
    saved: "Đã lưu",
    add: "Thêm",
    delete: "Xóa",
    editDetails: "Sửa chi tiết",
    collectionsDescription: "Bộ sưu tập tài liệu, kỹ năng và tệp khác mà agent của bạn có thể sử dụng.",
    searchCollections: "Tìm bộ sưu tập…",
    newCollection: "Bộ sưu tập mới",
    createCollection: "Tạo bộ sưu tập",
    editCollection: "Sửa bộ sưu tập",
    deleteCollection: "Xóa bộ sưu tập",
    collectionCreated: "Đã tạo bộ sưu tập",
    collectionUpdated: "Đã cập nhật bộ sưu tập",
    collectionDeleted: "Đã xóa bộ sưu tập",
    collectionRefreshed: "Đã làm mới bộ sưu tập",
    collectionType: "Loại bộ sưu tập",
    nameEmpty: "Tên không được để trống",
    shortNameHint: "Tên ngắn, ví dụ: Hướng dẫn thương hiệu",
    visibilityEveryone: "Mọi người",
    visibilityOnlyMe: "Chỉ mình tôi",
    visibilityPrivate: "riêng tư",
    visibilityPublic: "công khai",
    newFile: "Tệp mới",
    newFolder: "Thư mục mới",
    addFileOrFolder: "Thêm tệp hoặc thư mục",
    uploadFiles: "Tải tệp lên",
    uploadFolder: "Tải thư mục lên",
    deleteDocument: "Xóa tài liệu",
    fileNameHint: "Tên tệp — sửa để đổi tên (phần mở rộng quyết định loại)",
    fileNameInvalid: "Tên tệp không được chứa '/'",
    exampleFileName: "ten-tep.md",
    describeDocument: "Mô tả tài liệu này chứa gì và khi nào agent nên sử dụng…",
    noDescription: "Chưa có mô tả.",
    noDescriptionInFile: "Tệp này chưa có mô tả.",
    definedInFile: "Được định nghĩa trong tệp này; sửa trong tài liệu bên dưới.",
    emptyDocument: "Tài liệu này trống.",
    noFiles: "Không có tệp nào trong bộ sưu tập này",
    skillDetected: "Chứa Agent Skill hợp lệ",
    chooseIcon: "Chọn biểu tượng",
    failedToCreateCollection: "Không thể tạo bộ sưu tập",
    failedToUpdateCollection: "Không thể cập nhật bộ sưu tập",
    failedToDeleteCollection: "Không thể xóa bộ sưu tập",
    failedToCreateFile: "Không thể tạo tệp",
    failedToSave: "Không thể lưu",
    unavailable: "Bộ sưu tập này không còn khả dụng",
    maybeDeleted: "Có thể đã bị xóa.",
    gitMirror: "Gương Git",
    gitReadOnly: "Nội dung Git chỉ đọc và hiển thị phiên bản cache gần nhất.",
    gitBranch: "Nhánh Git",
    gitBranchHint: "Nhánh này sẽ được kéo khi làm mới bộ sưu tập.",
    remoteUrl: "URL từ xa",
    createToken: "Tạo token",
    createTokenHint: "Tạo token để phản chiếu nội dung từ kho git bên ngoài.",
    gitTokenCreated: "Đã tạo token Git",
    gitTokenRevoked: "Đã thu hồi token Git",
    manageGitTokens: "Quản lý token git",
    noGitTokens: "Chưa có token Git nào.",
    loadingTokens: "Đang tải token...",
    gitSyncUnavailable: "Đồng bộ Git không khả dụng",
    configureGitlab: "Cấu hình gương GitLab",
    setMirrorDirection: "Đặt hướng Mirror thành Push",
    setRepoUrl: "Đặt URL kho Git thành URL từ xa ở trên",
    setAuthMethod: "Đặt phương thức xác thực thành Username and Password",
    setUsername: 'Đặt Username thành "gitlab"',
    setPassword: "Đặt Password thành mật khẩu ở trên",
    clickAddNew: 'Nhấn nút "Add new" để mở luồng thiết lập',
    clickMirror: 'Nhấn nút "Mirror repository" để hoàn tất',
    clickUpdateNow: 'Nhấn nút "Update now" để bắt đầu đẩy lần đầu',
    sourceWeb: "web",
    sourceGit: "git",
    sourcePrivate: "riêng tư",
    sourcePublic: "công khai",
  },
  ko: {
    pageTitle: "컨텍스트 라이브러리",
    pageSubtitle: "에이전트가 사용할 수 있는 문서, 스킬 및 기타 파일 모음입니다.",
    collectionOverview: "컬렉션 개요",
    collectionOptions: "컬렉션 옵션",
    documents: "문서",
    editableDocuments: "편집 가능한 문서",
    access: "접근",
    visibility: "공개 범위",
    source: "소스",
    options: "옵션",
    view: "보기",
    close: "닫기",
    cancel: "취소",
    save: "저장",
    saved: "저장됨",
    add: "추가",
    delete: "삭제",
    editDetails: "세부 정보 편집",
    collectionsDescription: "에이전트가 사용할 수 있는 문서, 스킬 및 기타 파일 모음입니다.",
    searchCollections: "컬렉션 검색…",
    newCollection: "새 컬렉션",
    createCollection: "컬렉션 만들기",
    editCollection: "컬렉션 편집",
    deleteCollection: "컬렉션 삭제",
    collectionCreated: "컬렉션이 생성되었습니다",
    collectionUpdated: "컬렉션이 업데이트되었습니다",
    collectionDeleted: "컬렉션이 삭제되었습니다",
    collectionRefreshed: "컬렉션이 새로고침되었습니다",
    collectionType: "컬렉션 유형",
    nameEmpty: "이름은 비워둘 수 없습니다",
    shortNameHint: "짧은 이름, 예: 브랜드 가이드라인",
    visibilityEveryone: "모든 사람",
    visibilityOnlyMe: "나만",
    visibilityPrivate: "비공개",
    visibilityPublic: "공개",
    newFile: "새 파일",
    newFolder: "새 폴더",
    addFileOrFolder: "파일 또는 폴더 추가",
    uploadFiles: "파일 업로드",
    uploadFolder: "폴더 업로드",
    deleteDocument: "문서 삭제",
    fileNameHint: "파일 이름 — 편집하여 이름 변경 (확장자가 유형 결정)",
    fileNameInvalid: "파일 이름에 '/'를 포함할 수 없습니다",
    exampleFileName: "파일-이름.md",
    describeDocument: "이 문서의 내용과 에이전트가 사용할 시점을 설명하세요…",
    noDescription: "아직 설명이 없습니다.",
    noDescriptionInFile: "이 파일에는 아직 설명이 없습니다.",
    definedInFile: "이 파일에 정의되어 있습니다. 아래 문서에서 편집하세요.",
    emptyDocument: "이 문서가 비어 있습니다.",
    noFiles: "이 컬렉션에 파일이 없습니다",
    skillDetected: "유효한 Agent Skill이 포함되어 있습니다",
    chooseIcon: "아이콘 선택",
    failedToCreateCollection: "컬렉션을 만들지 못했습니다",
    failedToUpdateCollection: "컬렉션을 업데이트하지 못했습니다",
    failedToDeleteCollection: "컬렉션을 삭제하지 못했습니다",
    failedToCreateFile: "파일을 만들지 못했습니다",
    failedToSave: "저장하지 못했습니다",
    unavailable: "이 컬렉션은 더 이상 사용할 수 없습니다",
    maybeDeleted: "삭제되었을 수 있습니다.",
    gitMirror: "Git 미러",
    gitReadOnly: "Git 콘텐츠는 읽기 전용이며 최근 캐시된 버전을 표시합니다.",
    gitBranch: "Git 브랜치",
    gitBranchHint: "컬렉션을 새로고침할 때 이 브랜치를 가져옵니다.",
    remoteUrl: "원격 URL",
    createToken: "토큰 만들기",
    createTokenHint: "외부 git 저장소에서 콘텐츠를 미러링할 토큰을 만듭니다.",
    gitTokenCreated: "Git 토큰이 생성되었습니다",
    gitTokenRevoked: "Git 토큰이 폐기되었습니다",
    manageGitTokens: "Git 토큰 관리",
    noGitTokens: "아직 Git 토큰이 없습니다.",
    loadingTokens: "토큰을 불러오는 중...",
    gitSyncUnavailable: "Git 동기화를 사용할 수 없습니다",
    configureGitlab: "GitLab 미러링 구성",
    setMirrorDirection: "Mirror 방향을 Push로 설정",
    setRepoUrl: "Git 저장소 URL을 위의 원격 URL로 설정",
    setAuthMethod: "인증 방법을 Username and Password로 설정",
    setUsername: "Username을 \"gitlab\"으로 설정",
    setPassword: "Password를 위의 비밀번호로 설정",
    clickAddNew: "\"Add new\" 버튼을 눌러 설정 흐름을 엽니다",
    clickMirror: "\"Mirror repository\" 버튼을 눌러 완료합니다",
    clickUpdateNow: "\"Update now\" 버튼을 눌러 첫 푸시를 시작합니다",
    sourceWeb: "웹",
    sourceGit: "git",
    sourcePrivate: "비공개",
    sourcePublic: "공개",
  },
};

function readLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "vi" || stored === "ko") return stored;
    const browser = navigator.language.toLowerCase();
    return browser.startsWith("vi") ? "vi" : browser.startsWith("ko") ? "ko" : "en";
  } catch {
    return "en";
  }
}

const listeners = new Set<() => void>();
let current: Locale = "en";

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const l of listeners) l();
}

if (typeof window !== "undefined") {
  current = readLocale();
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      current = readLocale();
      emit();
    }
  });
}

export function useLocale(): { locale: Locale; t: Messages } {
  const locale = useSyncExternalStore(
    subscribe,
    () => current,
    () => "en" as Locale,
  );
  const t = useMemo(() => messages[locale], [locale]);
  return { locale, t };
}
