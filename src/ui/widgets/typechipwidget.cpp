#include "ui/widgets/typechipwidget.h"

#include "ui/widgets/typechip.h"

#include <QPaintEvent>
#include <QPainter>
#include <QSize>
#include <QWidget>
#include <QtMath>

namespace com::yamada::studio {
TypeChipWidget::TypeChipWidget(QWidget *parent)
    : QWidget(parent)
{
    setSizePolicy(QSizePolicy::Fixed, QSizePolicy::Fixed);
}

void TypeChipWidget::setType(const QString &identifier, Language language)
{
    m_type = typechip::find(identifier);
    m_language = language;
    updateGeometry();
    update();
}

QSize TypeChipWidget::sizeHint() const
{
    if (!m_type)
        return QSize(0, 0);
    return QSize(qCeil(typechip::width(*m_type, m_language)), qCeil(typechip::kHeight));
}

void TypeChipWidget::paintEvent(QPaintEvent *event)
{
    (void)event;
    if (!m_type)
        return;
    QPainter painter(this);
    painter.setRenderHint(QPainter::Antialiasing);
    typechip::paint(painter, QPointF(0, 0), *m_type, m_language);
}
} // namespace com::yamada::studio
