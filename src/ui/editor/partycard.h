#pragma once

#include <QFrame>
#include <QLabel>
#include <QString>
#include <QStringList>

namespace com::yamada::studio {
class PartyCard : public QFrame
{
    Q_OBJECT
public:
    explicit PartyCard(QWidget *parent = nullptr);
    void setMember(const QString &name, int level, const QStringList &moves);
    void setEmpty();

private:
    QLabel *m_name = nullptr;
    QLabel *m_level = nullptr;
    QList<QLabel *> m_moves;
};
} // namespace com::yamada::studio
