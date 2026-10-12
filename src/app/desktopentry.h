#pragma once

namespace com::yamada::studio::desktopentry {
// Linux AppImage로 실행됐을 때 앱 메뉴에 스스로 등록한다. AppImage 하나만 받아 실행해도
// 런처 · 독에 PokeSix가 뜨게 하려는 것이다(scripts/linux/package.sh --install과 같은 결과).
//   AppImage 런타임이 넣는 환경 변수 두 개를 쓴다.
//     APPIMAGE — 실행한 .AppImage 파일의 절대 경로 → .desktop의 Exec · TryExec
//     APPDIR   — AppImage 안이 풀린 곳 → usr/share의 .desktop · hicolor 아이콘을 복사해 온다
//   대상은 $XDG_DATA_HOME(기본 ~/.local/share)의 applications/ · icons/hicolor/.
//   내용이 같으면 건드리지 않고, 파일을 옮겨 실행하면 Exec가 새 경로로 바뀐다.
//   TryExec 덕분에 AppImage를 지우면 메뉴에서도 숨는다(파일은 남는다 — 지우는 법은 README).
// AppImage가 아니거나(APPIMAGE 없음) Linux가 아니면 아무것도 하지 않는다. 실패해도 앱은 그대로
// 뜬다(경고 로그만).
void registerAppImage();
} // namespace com::yamada::studio::desktopentry
