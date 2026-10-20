#pragma once

#include <QFrame>
#include <QLabel>
#include <QPixmap>
#include <QString>
#include <QStringList>

namespace com::yamada::studio {
struct PartyCardView
{
    QString name;
    int level = 0;
    QStringList moves;
    QPixmap icon;
};

class PartyCard : public QFrame
{
    Q_OBJECT
public:
    explicit PartyCard(QWidget *parent = nullptr);
    void setMember(const PartyCardView &view);
    void setEmpty();

private:
    QLabel *m_icon = nullptr;
    QLabel *m_name = nullptr;
    QLabel *m_level = nullptr;

    QList<QLabel *> m_moves;
};
} // namespace com::yamada::studio
