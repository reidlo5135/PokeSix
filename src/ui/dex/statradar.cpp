#include "ui/dex/statradar.h"

#include "ui/theme/theme.h"
#include "ui/theme/tokens.h"

#include <QPainter>
#include <QPainterPath>
#include <QtMath>

#include <algorithm>

namespace {
constexpr int kScaleMax = 200;
constexpr int kRingStep = 50;      // 눈금 간격: 50 · 100 · 150 · 200(· 250 …)
constexpr int kLabelMargin = 44;   // 축 이름 · 값이 들어갈 바깥 여백
constexpr qreal kFillAlpha = 0.28; // 도형 채움(빨강 옅게)

// 그리는 순서(시계방향, 위에서부터) → Repository의 능력치 순서(HP 공격 방어 특공 특방 스피드)
constexpr int kAxisToStat[6] = {0, 1, 2, 5, 4, 3};
} // namespace

namespace com::yamada::studio {
StatRadar::StatRadar(QWidget *parent)
    : QWidget(parent)
{
    QWidget::setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Expanding);
}

void StatRadar::setStats(const std::array<int, 6> &stats)
{
    m_stats = stats;
    QWidget::update();
}

void StatRadar::setNature(int increased, int decreased)
{
    m_increased = increased == decreased ? -1 : increased; // 무보정 성격은 표시하지 않는다
    m_decreased = increased == decreased ? -1 : decreased;
    QWidget::update();
}

void StatRadar::setTrainedStats(std::optional<std::array<int, 6>> stats)
{
    m_trained = stats;
    QWidget::update();
}

int StatRadar::scaleMax() const
{
    // 파랑의 최댓값이 kScaleMax를 넘으면 그 값을 덮는 가장 작은 kRingStep 배수(231 → 250)
    if (m_trained) {
        const int top = std::ranges::max(*m_trained);
        if (top <= kScaleMax)
            return kScaleMax;
        else
            return (top + kRingStep - 1) / kRingStep * kRingStep;
    } else {
        return kScaleMax;
    }
}

QSize StatRadar::sizeHint() const
{
    return {260, 260};
}

void StatRadar::paintEvent(QPaintEvent *)
{
    const QString names[6]
            = {tr("HP"), tr("공격"), tr("방어"), tr("특공"), tr("특방"), tr("스피드")};
    QPainter painter(this);
    painter.setRenderHint(QPainter::Antialiasing, true);

    const QPointF center = QRectF(rect()).center();
    const qreal half = std::min(width(), height()) / 2.0;
    const qreal radius = std::max(10.0, m_trained ? half - kLabelMargin - 18 : half - kLabelMargin);
    // 축 i의 끝점(반지름 r). 0번 축이 위(−90°)이고 60°씩 시계방향.
    auto point = [&](int axis, qreal r) {
        const qreal angle = qDegreesToRadians(-90.0 + 60.0 * axis);
        return center + QPointF(std::cos(angle) * r, std::sin(angle) * r);
    };

    // 1) 눈금 육각형 · 축선 — 바깥 눈금 = scale(보통 200)
    const int scale = scaleMax();
    const int rings = scale / kRingStep;
    painter.setBrush(Qt::NoBrush);
    for (int ring = 1; ring <= rings; ++ring) {
        QPolygonF hexagon;
        for (int axis = 0; axis < 6; ++axis)
            hexagon << point(axis, radius * ring / rings);
        painter.setPen(
                QPen(QColor(ring == rings ? tok::palette().lineStrong : tok::palette().line), 1));
        painter.drawPolygon(hexagon);
    }
    painter.setPen(QPen(QColor(tok::palette().line), 1));
    for (int axis = 0; axis < 6; ++axis)
        painter.drawLine(center, point(axis, radius));

    // 2) 인게임 능력치 도형(파랑) — 빨강보다 먼저: 파랑이 대개 더 커서, 위에 덮으면 빨강이 탁해진다
    if (m_trained) {
        const std::array<int, 6> &trained = *m_trained;

        QPolygonF shape;
        for (int axis = 0; axis < 6; ++axis) {
            const int value = std::min(trained[kAxisToStat[axis]], scale);
            shape << point(axis, radius * value / scale);
        }
        QColor fill(tok::palette().blue);
        fill.setAlphaF(kFillAlpha);
        painter.setBrush(fill);
        painter.setPen(QPen(QColor(tok::palette().blueDeep), 2, Qt::SolidLine, Qt::RoundCap,
                            Qt::RoundJoin));
        painter.drawPolygon(shape);
        painter.setPen(Qt::NoPen);
        painter.setBrush(QColor(tok::palette().blue));
        for (const QPointF &p : shape)
            painter.drawEllipse(p, 2.5, 2.5);
    }

    // 3) 종족값 도형(빨강)
    QPolygonF shape;
    for (int axis = 0; axis < 6; ++axis) {
        const int value = std::min(m_stats[kAxisToStat[axis]], scale);
        shape << point(axis, radius * value / scale);
    }
    QColor fill(tok::palette().red);
    fill.setAlphaF(kFillAlpha);
    painter.setBrush(fill);
    painter.setPen(QPen(QColor(tok::palette().red), 2, Qt::SolidLine, Qt::RoundCap, Qt::RoundJoin));
    painter.drawPolygon(shape);
    painter.setPen(Qt::NoPen);
    painter.setBrush(QColor(tok::palette().red));
    for (const QPointF &p : shape)
        painter.drawEllipse(p, 2.5, 2.5);

    // 4) 축 이름 + 값: 축 끝 바깥에. 위 · 아래 축은 가운데 정렬, 왼쪽 · 오른쪽 축은 바깥쪽으로
    // 붙인다.
    const QFont nameFont = theme::font(theme::kFamilyBody, 12, QFont::ExtraBold);
    const QFont valueFont = theme::font(theme::kFamilyData, 13, QFont::Bold);
    for (int axis = 0; axis < 6; ++axis) {
        const int stat = kAxisToStat[axis];
        const QPointF tip = point(axis, radius + 10);
        const bool top = axis == 0;
        const bool bottom = axis == 3;
        const bool right = axis == 1 || axis == 2;
        QRectF box(0, 0, 80, 34);
        if (top)
            box.moveCenter(tip - QPointF(0, 14));
        else if (bottom)
            box.moveCenter(tip + QPointF(0, 14));
        else if (right)
            box.moveTopLeft(tip - QPointF(2, 17));
        else
            box.moveTopRight(tip + QPointF(2, -17));
        const Qt::Alignment horizontal = top || bottom ? Qt::AlignHCenter
                                         : right       ? Qt::AlignLeft
                                                       : Qt::AlignRight;
        // 성격 보정: 오르는 능력치 "특공 ▲"(빨강) · 내리는 능력치 "공격 ▼"(파랑)
        QString name = names[stat];
        QColor nameColor(tok::palette().text2);
        if (stat == m_increased) {
            name += QStringLiteral(" ▲");
            nameColor = QColor(tok::palette().red);
        } else if (stat == m_decreased) {
            name += QStringLiteral(" ▼");
            nameColor = QColor(tok::palette().blueDeep);
        }
        painter.setFont(nameFont);
        painter.setPen(nameColor);
        painter.drawText(QRectF(box.left(), box.top(), box.width(), 16),
                         horizontal | Qt::AlignVCenter, name);
        painter.setFont(valueFont);
        painter.setPen(QColor(m_stats[stat] >= 100 ? tok::palette().text1 : tok::palette().text3));
        painter.drawText(QRectF(box.left(), box.top() + 16, box.width(), 18),
                         horizontal | Qt::AlignVCenter, QString::number(m_stats[stat]));
        // 인게임 능력치는 종족값 아래 한 줄(그만큼 radius의 바깥 여백이 18 늘었다)
        if (m_trained) {
            painter.setPen(QColor(tok::palette().blueDeep));
            painter.drawText(QRectF(box.left(), box.top() + 34, box.width(), 18),
                             horizontal | Qt::AlignVCenter, QString::number((*m_trained)[stat]));
        }
    }
}
} // namespace com::yamada::studio
