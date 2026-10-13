#include "ui/shell/themeswitch.h"

#include "ui/theme/cursors.h"
#include "ui/theme/tokens.h"
#include "ui/widgets/svgicon.h"

#include <QColor>
#include <QMouseEvent>
#include <QPainter>
#include <QPainterPath>

namespace {
// 탭 아이콘과 같은 격자(24, 선 2.2, 둥근 끝). currentColor 자리를 칠할 색으로 바꾼다.
// 해는 설정 탭의 톱니(원 + 짧은 선)와 헷갈리지 않게 원을 크게, 빛살을 원에서 띄웠다.
constexpr const char *kIcons[com::yamada::studio::ThemeSwitch::kSegments] = {
        R"(<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4.4"/><path d="M12 2.6v1.8M12 19.6v1.8M2.6 12h1.8M19.6 12h1.8M5.4 5.4l1.3 1.3M17.3 17.3l1.3 1.3M5.4 18.6l1.3-1.3M17.3 6.7l1.3-1.3"/></svg>)",
        R"(<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M19.8 14.6A8.2 8.2 0 1 1 9.4 4.2a6.4 6.4 0 0 0 10.4 10.4z"/></svg>)",
        R"(<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12.5" rx="2"/><path d="M8.5 20.5h7M12 16.5v4"/></svg>)",
};
} // namespace

namespace com::yamada::studio {
ThemeSwitch::ThemeSwitch(QWidget *parent)
    : QWidget(parent)
{
    QWidget::setSizePolicy(QSizePolicy::Fixed, QSizePolicy::Fixed);
    QWidget::setCursor(cursors::pointer());
    QWidget::setMouseTracking(true); // 누르지 않아도 mouseMoveEvent → 칸마다 hover · 툴팁
}

void ThemeSwitch::setTheme(AppState::Theme theme)
{
    if (theme == m_theme)
        return;
    m_theme = theme;
    QWidget::update();
}

QSize ThemeSwitch::sizeHint() const
{
    return {2 * kBorder + kSegments * kSegmentWidth, kHeight};
}

AppState::Theme ThemeSwitch::themeAt(int index)
{
    return index == 0   ? AppState::Theme::Light
           : index == 1 ? AppState::Theme::Dark
                        : AppState::Theme::System;
}

int ThemeSwitch::indexOf(AppState::Theme theme)
{
    return theme == AppState::Theme::Light ? 0 : theme == AppState::Theme::Dark ? 1 : 2;
}

QRect ThemeSwitch::segmentRect(int index) const
{
    return {kBorder + index * kSegmentWidth, kBorder, kSegmentWidth, height() - 2 * kBorder};
}

int ThemeSwitch::segmentAt(const QPoint &pos) const
{
    for (int i = 0; i < kSegments; ++i)
        if (segmentRect(i).contains(pos))
            return i;
    return -1;
}

QPixmap ThemeSwitch::icon(int index, QRgb color) const
{
    const QString svg = QString::fromLatin1(kIcons[index]);
    return svgicon::pixmap(
            QString(svg).replace(QStringLiteral("currentColor"), QColor(color).name()), kIconSize,
            devicePixelRatioF());
}

void ThemeSwitch::paintEvent(QPaintEvent *)
{
    QPainter painter(this);
    painter.setRenderHint(QPainter::Antialiasing, true);
    // TODO(F3a-CP5) 세 칸을 그린다 — 색은 모두 tok::palette()에서:
    //   1. 틀: 둥근 네모(kRadius) 바탕 + 먹선 kBorder — 세대 버튼과 같은 모양
    //   2. 고른 칸(indexOf(m_theme))만 바탕을 칠한다 → segmentRect로 자리를 얻는다
    //   3. 마우스가 올라간 칸(m_hover)은 옅게 칠한다(고른 칸이면 건너뜀)
    //   4. 칸마다 아이콘: icon(i, 색) → 칸 가운데에 drawPixmap. 고른 칸과 아닌 칸의 색을 다르게
    //   5. 칸 사이 세로 금(1px)은 선택 — 있으면 칸이 더 또렷하다
    //   크기는 논리 px — pixmap은 devicePixelRatio가 들어 있어 가운데를 잡을 때 kIconSize로 계산
    Q_UNUSED(painter);
}

void ThemeSwitch::mousePressEvent(QMouseEvent *event)
{
    // TODO(F3a-CP5) 누른 자리의 칸(segmentAt(event->position().toPoint()))을 찾아서
    //   1. 칸 밖(−1)이거나 왼쪽 버튼이 아니면 그냥 return
    //   2. themeSelected(themeAt(칸))을 보낸다 — m_theme은 여기서 바꾸지 않는다
    //      (AppState가 저장한 뒤 themeChanged → MainWindow가 setTheme으로 돌려준다)
    Q_UNUSED(event);
}

void ThemeSwitch::mouseMoveEvent(QMouseEvent *event)
{
    const int hover = segmentAt(event->position().toPoint());
    if (hover == m_hover)
        return;
    m_hover = hover;
    QWidget::setToolTip(hover == 0   ? tr("라이트")
                        : hover == 1 ? tr("다크")
                        : hover == 2 ? tr("시스템 설정 따르기")
                                     : QString());
    QWidget::update();
}

void ThemeSwitch::leaveEvent(QEvent *)
{
    m_hover = -1;
    QWidget::update();
}
} // namespace com::yamada::studio
