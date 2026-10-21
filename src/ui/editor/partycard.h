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
};
} // namespace com::yamada::studio
