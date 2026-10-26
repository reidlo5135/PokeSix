#pragma once

#include "data/text/localizedtext.h"

#include <QWidget>

namespace com::yamada::studio {
namespace tok {
struct TypeColor;
}

class TypeChipWidget : public QWidget
{
    Q_OBJECT
public:
    explicit TypeChipWidget(QWidget *parent = nullptr);
    void setType(const QString &identifier, Language language);
    QSize sizeHint() const override;

protected:
    void paintEvent(QPaintEvent *event) override;

private:
    const tok::TypeColor *m_type = nullptr;
    Language m_language = Language::Korean;
};
} // namespace com::yamada::studio
