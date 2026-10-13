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
    const tok::Palette &c = tok::palette();

    // 틀: 흰 바탕 + 먹선 2 — 세대 버튼과 같은 모양. 선 두께의 반(1)만큼 안으로 들여 그린다
    painter.setPen(QPen(QColor(c.ink), kBorder));
    painter.setBrush(QColor(c.white));
    painter.drawRoundedRect(QRectF(rect()).adjusted(1, 1, -1, -1), kRadius, kRadius);

    // 칸 칠하기는 틀 안쪽 둥근 네모로 자른다 — 양 끝 칸의 모서리가 틀 밖으로 삐져나오지 않게
    QPainterPath clip;
    clip.addRoundedRect(QRectF(rect()).adjusted(kBorder, kBorder, -kBorder, -kBorder),
                        kRadius - kBorder, kRadius - kBorder);
    painter.setClipPath(clip);

    // 고른 칸만 먹색 + 흰 아이콘(사진 속 스위치처럼), 나머지는 회색 아이콘. 마우스가 오르면 옅은
    // 노랑
    const int selected = indexOf(m_theme);
    for (int i = 0; i < kSegments; ++i) {
        const QRect r = segmentRect(i);
        if (i == selected)
            painter.fillRect(r, QColor(c.ink));
        else if (i == m_hover)
            painter.fillRect(r, QColor(c.yellowTint));
        if (i > 0) // 칸 사이 금
            painter.fillRect(QRect(r.left(), r.top(), 1, r.height()), QColor(c.line));
        const QPointF topLeft = QRectF(r).center() - QPointF(kIconSize / 2.0, kIconSize / 2.0);
        painter.drawPixmap(topLeft, icon(i, i == selected ? c.onColor : c.text2));
    }
}

void ThemeSwitch::mousePressEvent(QMouseEvent *event)
{
    // 고름만 알린다 — m_theme은 AppState가 저장한 뒤 themeChanged → setTheme으로 돌아와 바뀐다
    const int i = segmentAt(event->position().toPoint());
    if (i < 0 || event->button() != Qt::LeftButton)
        return;
    emit themeSelected(themeAt(i));
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
