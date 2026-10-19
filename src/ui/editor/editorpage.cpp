#include "ui/editor/editorpage.h"

#include "ui/widgets/shadowbutton.h"
#include "ui/theme/cursors.h"
#include "data/repository/repository.h"
#include "data/state/appstate.h"
#include "data/store/squadfile.h"
#include "data/store/saveimport.h"

#include <optional>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QMargins>
#include <QLabel>
#include <QPainter>
#include <QFile>
#include <QFileDialog>
#include <QStandardPaths>
#include <QUrl>
#include <QDragEnterEvent>
#include <QDropEvent>
#include <QDragLeaveEvent>
#include <QMimeData>
#include <QTimer>
#include <QMessageBox>

namespace {
using namespace com::yamada::studio;

    constexpr QMargins kPageMargins {20, 16, 20, 12};
}

namespace com::yamada::studio {
EditorPage::EditorPage(Repository *repo, AppState *state, QWidget *parent)
    : QWidget(parent)
    , m_repository(repo)
    , m_state(state)
{
    QVBoxLayout *layout = new QVBoxLayout(this);
    layout->setContentsMargins(kPageMargins);
    layout->setSpacing(14);
    layout->addWidget(buildTopbar());   
    layout->addWidget(buildBody());

    setAcceptDrops(true);
}

QWidget *EditorPage::buildTopbar() {
    QWidget *bar = new QWidget;
    m_topBar = bar;
    QHBoxLayout *layout = new QHBoxLayout(bar);
    layout->setContentsMargins({0, 0, 0, 0});
    layout->setSpacing(12);

    m_title = new QLabel(tr("에디터"));
    m_title->setObjectName(QStringLiteral("pageTitle"));

    m_saveOpenButton = new ShadowButton;
    m_saveOpenButton->setText(tr("세이브 열기"));
    m_saveOpenButton->setObjectName(QStringLiteral("editorSaveOpenButton"));
    connect(m_saveOpenButton, &QAbstractButton::clicked, this, &EditorPage::chooseSave);

    layout->addWidget(m_title);
    layout->addStretch();
    layout->addWidget(m_saveOpenButton);

    return bar;
}

QStackedWidget *EditorPage::buildBody() {
    QStackedWidget *body = new QStackedWidget;
    m_body = body;

    QWidget *empty = new QWidget;
    QVBoxLayout *emptyLayout = new QVBoxLayout(empty);
    QLabel *hint = new QLabel(tr("세이브 파일을 여기에 끌어다 놓아요"));
    hint->setObjectName(QStringLiteral("editorDropHint"));
    hint->setAlignment(Qt::AlignCenter);

    emptyLayout->addStretch();
    emptyLayout->addWidget(hint);
    emptyLayout->addStretch();

    body->addWidget(empty);

    return body;
}

void EditorPage::dragEnterEvent(QDragEnterEvent *event) {
    QWidget::dragEnterEvent(event);
    
    const QList<QUrl> urls = event->mimeData()->urls();
    if (urls.size() != 1 || !urls.constFirst().isLocalFile())
        return;
    const QString suffix = QFileInfo(urls.constFirst().toLocalFile()).suffix().toLower();
    static const QStringList kAccepted = {QStringLiteral("sav"), QStringLiteral("dsv")};

    if (kAccepted.contains(suffix)) {
        event->acceptProposedAction();
    }
}

void EditorPage::dropEvent(QDropEvent *event) {
    QWidget::dropEvent(event);
    if (!event->mimeData()->hasUrls())
        return;
    event->acceptProposedAction();
    const QString path = event->mimeData()->urls().constFirst().toLocalFile();
    QTimer::singleShot(0, this, [this, path] { openFile(path); });
}

void EditorPage::dragLeaveEvent(QDragLeaveEvent *event) {
    QWidget::dragLeaveEvent(event);
}

void EditorPage::chooseSave() {
    const QString dir = QStandardPaths::writableLocation(QStandardPaths::DocumentsLocation);
    const QString path = QFileDialog::getOpenFileName(
            this, tr("세이브 불러오기"), dir,
            tr("게임 세이브 (*.sav *.dsv)"));
    if (path.isEmpty())
        return;
    openFile(path);
}

void EditorPage::openFile(const QString &path) {
    QString error;
    const std::optional<squadfile::Portable> loaded = saveimport::load(path, *m_repository, &error);

    if (!loaded) {
        QMessageBox::warning(this, tr("세이브 불러오기"), error);
        return;
    }

    const QString version = m_repository->resolveVersion(loaded->generation, loaded->game);
    if (version.isEmpty()) {
        QMessageBox::warning(this, tr("세이브 불러오기"),
                             tr("%1세대는 아직 준비되지 않았어요").arg(loaded->generation));
        return;
    }

    m_loaded = *loaded;
    
    QString gameName = loaded->game;
    for (const GameInfo &game : m_repository->gamesForGeneration(loaded->generation)) {
        const qsizetype i = game.versions.indexOf(loaded->game);
        if (i >= 0)
            gameName = game.versionNames.at(i).text(m_state->language());
    }
    m_fileInfo->setText(QStringLiteral("%1\n%2 · %3세대 · %4마리")
                            .arg(QFileInfo(path).fileName())
                            .arg(gameName)
                            .arg(loaded->generation)
                            .arg(loaded->squad.filled()));

    m_body->setCurrentIndex(1);
}

} // namespace com::yamada::studio
