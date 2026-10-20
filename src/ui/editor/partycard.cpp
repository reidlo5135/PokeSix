#include "ui/editor/partycard.h"

#include <QGridLayout>
#include <QHBoxLayout>
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
    QHBoxLayout *head = new QHBoxLayout; // 괄호를 비운다 — 아래 layout->addLayout(head)로 들어간다
    m_icon = new QLabel;
    m_icon->setFixedSize(68, 56); // 아이콘이 오기 전에도 머리 줄 높이가 같게
    m_name = new QLabel;
    m_level = new QLabel;
    m_icon->setObjectName(QStringLiteral("editorCardIcon"));
    m_name->setObjectName(QStringLiteral("editorCardName"));
    m_level->setObjectName(QStringLiteral("editorCardLevel"));
    head->addWidget(m_icon);
    head->addWidget(m_name);
    head->addStretch();
    head->addWidget(m_level);
    layout->addLayout(head);
    QGridLayout *movesLayout = new QGridLayout;
    movesLayout->setColumnStretch(2, 1);
    layout->addLayout(movesLayout);
    for (int i = 0; i < 4; ++i) {
        QLabel *move;
        move = new QLabel;
        m_moves.append(move);
        movesLayout->addWidget(move, i / 2, i % 2);
    }
}

void PartyCard::setMember(const PartyCardView &view)
{
    m_name->setText(view.name);
    m_level->setText(tr("Lv %1").arg(view.level));
    for (int i = 0; i < 4; ++i) {
        m_moves[i]->setText(i < view.moves.size() ? view.moves[i] : QString());
    }
    m_icon->setPixmap(view.icon);
}

void PartyCard::setEmpty()
{
    m_name->setText(QString());
    m_level->setText(QString());
    for (int i = 0; i < 4; ++i) {
        m_moves[i]->setText(QString());
    }
    m_icon->clear();
}
} // namespace com::yamada::studio
