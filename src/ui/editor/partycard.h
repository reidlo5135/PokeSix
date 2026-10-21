#pragma once

#include "data/text/localizedtext.h"

#include <QFrame>
#include <QLabel>
#include <QList>
#include <QPixmap>
#include <QString>
#include <QStringList>

namespace com::yamada::studio {
class TypeChipWidget;
struct PartyCardView
{
    QString name;
    int level = 0;
    QStringList moves;
    QPixmap icon;
    QStringList types;
    Language language = Language::Korean;
    QString ability;
    QString nature;
    QString item;
    QPixmap itemIcon;
};

class PartyCard : public QFrame
{
    Q_OBJECT
public:
    explicit PartyCard(QWidget *parent = nullptr);
    void setMember(const PartyCardView &view);
    void setEmpty();

private:
    QLabel *m_name = nullptr;
    QLabel *m_level = nullptr;
    QList<QLabel *> m_moves;
    QLabel *m_icon = nullptr;
    QList<TypeChipWidget *> m_types;
    QLabel *m_ability = nullptr;
    QLabel *m_nature = nullptr;
    QLabel *m_itemIcon = nullptr;
    QLabel *m_item = nullptr;
};
} // namespace com::yamada::studio
