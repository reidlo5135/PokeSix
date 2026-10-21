#include "ui/editor/partycard.h"

#include "ui/widgets/typechipwidget.h"

#include <QGridLayout>
#include <QHBoxLayout>
#include <QLabel>
#include <QString>
#include <QStyle>
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
    for (int i = 0; i < 4; ++i) {
        QHBoxLayout *cell = new QHBoxLayout;
        TypeChipWidget *chip = new TypeChipWidget;
        QLabel *move = new QLabel;
        cell->addWidget(chip);
        cell->addWidget(move);
        movesLayout->addLayout(cell, i / 2, i % 2);
        m_moveTypes.append(chip);
        m_moves.append(move);
    }
    layout->addLayout(movesLayout);
    QHBoxLayout *statsRow = new QHBoxLayout;
    for (int i = 0; i < 6; ++i) {
        QLabel *stat = new QLabel;
        m_stats.append(stat);
        statsRow->addWidget(stat);
    }
    layout->addLayout(statsRow);
}

void PartyCard::setMember(const PartyCardView &view)
{
    m_name->setText(view.name);
    m_level->setText(tr("Lv %1").arg(view.level));
    for (int i = 0; i < 4; ++i) {
        const bool has = i < view.moves.size();
        m_moves[i]->setText(has ? view.moves[i].name : QString());
        m_moveTypes[i]->setType(has ? view.moves[i].type : QString(), view.language);
    }
    m_icon->setPixmap(view.icon);
    for (int i = 0; i < m_types.size(); ++i) {
        QString identifier = (i < view.types.size()) ? view.types[i] : QString();
        m_types[i]->setType(identifier, view.language);
    }
    m_ability->setText(tr("특성 %1").arg(view.ability));
    m_nature->setText(tr("성격 %1").arg(view.nature));
    m_itemIcon->setPixmap(view.itemIcon);
    m_item->setText(view.item.isEmpty() ? tr("--- 지닌 물건 없음") : view.item);
    const QStringList statNames
            = {tr("HP"), tr("공격"), tr("방어"), tr("특공"), tr("특방"), tr("스피드")};
    for (int i = 0; i < m_stats.size(); ++i) {
        m_stats[i]->setText(tr("%1 %2").arg(statNames[i]).arg(view.stats[i]));
        const char *mark = i == view.natureUp ? "up" : i == view.natureDown ? "down" : "";
        m_stats[i]->setProperty("nature", QString::fromLatin1(mark));
        m_stats[i]->style()->unpolish(m_stats[i]);
        m_stats[i]->style()->polish(m_stats[i]);
    }
}

void PartyCard::setEmpty(bool egg)
{
    if (egg)
        m_name->setText(tr("알"));
    else
        m_name->setText(QString());

    m_level->setText(QString());
    for (int i = 0; i < 4; ++i) {
        m_moves[i]->setText(QString());
        m_moveTypes[i]->setType(QString(), Language::Korean);
    }
    m_icon->clear();
    for (TypeChipWidget *chip : m_types) {
        chip->setType(QString(), Language::Korean);
    }
    m_ability->setText(QString());
    m_nature->setText(QString());
    m_itemIcon->clear();
    m_item->setText(QString());
    for (int i = 0; i < m_stats.size(); ++i) {
        m_stats[i]->setText(QString());
    }
}
} // namespace com::yamada::studio
