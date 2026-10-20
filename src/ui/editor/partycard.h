#pragma once

#include <QFrame>
#include <QLabel>
#include <QString>

namespace com::yamada::studio {
class PartyCard : public QFrame
{
    Q_OBJECT
public:
    explicit PartyCard(QWidget *parent = nullptr);
    void setMember(const QString &name, int level);
    void setEmpty();

private:
    QLabel *m_name = nullptr;
    QLabel *m_level = nullptr;
};
} // namespace com::yamada::studio
