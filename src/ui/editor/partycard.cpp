#include "ui/editor/partycard.h"

#include <QLabel>
#include <QString>
#include <QVBoxLayout>
#include <QWidget>

namespace com::yamada::studio {
PartyCard::PartyCard(QWidget *parent)
    : QFrame(parent)
{
    setObjectName(QStringLiteral("editorCard"));
    QVBoxLayout *layout = new QVBoxLayout(this);
    layout->setContentsMargins(14, 12, 14, 12);

    m_name = new QLabel;
    m_name->setObjectName(QStringLiteral("editorCardName"));
    m_level = new QLabel;
    m_level->setObjectName(QStringLiteral("editorCardLevel"));

    layout->addWidget(m_name);
    layout->addWidget(m_level);
}

void PartyCard::setMember(const QString &name, int level)
{
    m_name->setText(name);
    m_level->setText(tr("Lv %1").arg(level));
}

void PartyCard::setEmpty()
{
    m_name->setText("");
    m_level->setText("");
}
} // namespace com::yamada::studio
