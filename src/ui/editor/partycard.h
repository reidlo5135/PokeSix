#pragma once

#include "data/text/localizedtext.h"

#include <QFrame>
#include <QLabel>
#include <QList>
#include <QPixmap>
#include <QString>
#include <QStringList>

#include <array>

namespace com::yamada::studio {
class TypeChipWidget;
struct PartyMoveView
{
    QString name;
    QString type;
};
struct PartyCardView
{
    QString name;
    int level = 0;
    QList<PartyMoveView> moves;
    QPixmap icon;
    QStringList types;
    Language language = Language::Korean;
    QString ability;
    QString nature;
    QString item;
    QPixmap itemIcon;
    std::array<int, 6> stats {};
    int natureUp = -1;
    int natureDown = -1;
};

class PartyCard : public QFrame
{
    Q_OBJECT
public:
    explicit PartyCard(QWidget *parent = nullptr);
    void setMember(const PartyCardView &view);
    void setEmpty(bool egg);

private:
    QLabel *m_name = nullptr;
    QLabel *m_level = nullptr;
    QLabel *m_icon = nullptr;
    QList<TypeChipWidget *> m_types;
    QLabel *m_ability = nullptr;
    QLabel *m_nature = nullptr;
    QLabel *m_itemIcon = nullptr;
    QLabel *m_item = nullptr;
    QList<TypeChipWidget *> m_moveTypes;
    QList<QLabel *> m_moves;
    QList<QLabel *> m_stats;
};
} // namespace com::yamada::studio
