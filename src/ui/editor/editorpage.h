#pragma once

#include <QWidget>
#include <QStackedWidget>
#include <QLineEdit>
#include <QLabel>
#include <QPushButton>

namespace com::yamada::studio {
class Repository;
class AppState;
class ShadowButton;

class EditorPage : public QWidget
{
    Q_OBJECT
public:
    explicit EditorPage(Repository *repository = nullptr, AppState *state = nullptr, QWidget *parent = nullptr);

signals:

protected:
    // 파일 끌어다 놓기(H2): .sav · .dsv를 페이지에 놓으면 불러온다
    void dragEnterEvent(QDragEnterEvent *event) override;
    void dropEvent(QDropEvent *event) override;
    void dragLeaveEvent(QDragLeaveEvent *event) override;

private:
    QWidget *buildTopbar();
    QStackedWidget *buildBody();

    void chooseSave();
    void openFile(const QString &path);

    Repository *m_repository = nullptr;
    AppState *m_state = nullptr;

    QWidget *m_topBar = nullptr;
    QLabel *m_title = nullptr;
    ShadowButton *m_saveOpenButton = nullptr;

    QStackedWidget *m_body = nullptr;

    std::optional<squadfile::Portable> m_loaded;
    QLabel *m_fileInfo;
};
} // namespace com::yamada::studio
