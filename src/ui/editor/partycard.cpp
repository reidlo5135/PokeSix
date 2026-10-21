#include "ui/editor/partycard.h"

#include "ui/widgets/typechipwidget.h"

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
    QHBoxLayout *typesRow = new QHBoxLayout;
    for (int i = 0; i < 2; ++i) {
        TypeChipWidget *chip = new TypeChipWidget;
        typesRow->addWidget(chip);
        m_types.append(chip);
    }
    typesRow->addStretch();
    layout->addLayout(typesRow);
    QHBoxLayout *infoRow = new QHBoxLayout;
    m_ability = new QLabel;
    m_nature = new QLabel;
    m_itemIcon = new QLabel;
    m_itemIcon->setFixedSize(30, 30);
    m_item = new QLabel;
    infoRow->addWidget(m_ability);
    infoRow->addWidget(m_nature);
    infoRow->addWidget(m_itemIcon);
    infoRow->addWidget(m_item);
    infoRow->addStretch();
    layout->addLayout(infoRow);
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
    for (int j = 0; j < m_types.size(); ++j) {
        QString identifier = (j < view.types.size()) ? view.types[j] : QString();
        m_types[j]->setType(identifier, view.language);
    }
    m_ability->setText(tr("특성 %1").arg(view.ability));
    m_nature->setText(tr("성격 %1").arg(view.nature));
    m_itemIcon->setPixmap(view.itemIcon);
    m_item->setText(view.item.isEmpty() ? tr("--- 지닌 물건 없음") : view.item);
}

void PartyCard::setEmpty()
{
    m_name->setText(QString());
    m_level->setText(QString());
    for (int i = 0; i < 4; ++i) {
        m_moves[i]->setText(QString());
    }
    m_icon->clear();
    for (TypeChipWidget *chip : m_types) {
        chip->setType(QString(), Language::Korean);
    }
    m_ability->setText(QString());
    m_nature->setText(QString());
    m_itemIcon->clear();
    m_item->setText(QString());
}
} // namespace com::yamada::studio
