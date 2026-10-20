#include "ui/editor/partycard.h"

#include <QGridLayout>
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

    QGridLayout *movesLayout = new QGridLayout;
    m_name = new QLabel;
    m_level = new QLabel;

    layout->addWidget(m_name);
    layout->addWidget(m_level);
    layout->addLayout(movesLayout);

    for (int i = 0; i < 4; ++i) {
        QLabel *move;
        move = new QLabel;
        m_moves.append(move);
        movesLayout->setColumnStretch(2, 1);
        movesLayout->addWidget(move, i / 2, i % 2);
    }

    m_name->setObjectName(QStringLiteral("editorCardName"));
    m_level->setObjectName(QStringLiteral("editorCardLevel"));
}

void PartyCard::setMember(const QString &name, int level, const QStringList &moves)
{
    m_name->setText(name);
    m_level->setText(tr("Lv %1").arg(level));
    for (int i = 0; i < 4; ++i) {
        m_moves[i]->setText(i < moves.size() ? moves[i] : QString());
    }
}

void PartyCard::setEmpty()
{
    m_name->setText(QString());
    m_level->setText(QString());
    for (int i = 0; i < 4; ++i) {
        m_moves[i]->setText(QString());
    }
}
} // namespace com::yamada::studio
