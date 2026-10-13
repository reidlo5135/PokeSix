#pragma once

#include "data/state/appstate.h"

#include <QWidget>

namespace com::yamada::studio {
// 앱 막대의 테마 고르기: [☀ 라이트 | ☾ 다크 | 🖥 시스템] 세 칸이 붙은 버튼 하나(세대 버튼 왼쪽).
// 세대 버튼과 같은 말투로, 버튼은 "고름"만 알리고(themeSelected) 실제 값은 AppState가 저장해서
// themeChanged로 돌려준다 → MainWindow가 setTheme으로 표시를 맞추고 색을 다시 입힌다.
class ThemeSwitch : public QWidget
{
    Q_OBJECT
public:
    explicit ThemeSwitch(QWidget *parent = nullptr);

    void setTheme(AppState::Theme theme); // 보이는 선택만 바꾼다(시그널 없음)
    QSize sizeHint() const override;

    static constexpr int kSegments = 3;      // 0 라이트 · 1 다크 · 2 시스템
    static constexpr int kSegmentWidth = 34; // 한 칸(아이콘 18 + 좌우 여백 8)
    static constexpr int kHeight = 36;       // 세대 버튼(Compact)과 같은 높이
    static constexpr int kBorder = 2;        // 먹선 2 — 세대 버튼과 같다
    static constexpr int kRadius = 6;
    static constexpr int kIconSize = 18;

signals:
    void themeSelected(com::yamada::studio::AppState::Theme theme);

protected:
    void paintEvent(QPaintEvent *event) override;
    void mousePressEvent(QMouseEvent *event) override;
    void mouseMoveEvent(QMouseEvent *event) override;
    void leaveEvent(QEvent *event) override;

private:
    static AppState::Theme themeAt(int index); // 칸 번호 → 테마
    static int indexOf(AppState::Theme theme); // 테마 → 칸 번호
    QRect segmentRect(int index) const;        // 먹선 안쪽의 칸 하나
    int segmentAt(const QPoint &pos) const;    // 그 자리의 칸(없으면 −1)
    // 칸의 아이콘을 color로 칠한 그림(그릴 때마다 만든다 — 테마가 바뀌면 색도 바뀌므로)
    QPixmap icon(int index, QRgb color) const;

    AppState::Theme m_theme = AppState::Theme::System;
    int m_hover = -1; // 마우스가 올라간 칸
};
} // namespace com::yamada::studio
