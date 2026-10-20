#include "ui/editor/editorpage.h"

#include "data/repository/repository.h"
#include "data/state/appstate.h"
#include "data/store/saveimport.h"
#include "data/store/squad.h"
#include "data/store/squadfile.h"
#include "ui/editor/partycard.h"
#include "ui/theme/cursors.h"
#include "ui/widgets/shadowbutton.h"

#include <QDragEnterEvent>
#include <QDropEvent>
#include <QFileDialog>
#include <QFileInfo>
#include <QGridLayout>
#include <QHBoxLayout>
#include <QLabel>
#include <QMargins>
#include <QMessageBox>
#include <QMimeData>
#include <QStandardPaths>
#include <QTimer>
#include <QUrl>
#include <QVBoxLayout>

#include <optional>

namespace {
using namespace com::yamada::studio;

constexpr QMargins kPageMargins {20, 16, 20, 12};
} // namespace

namespace com::yamada::studio {
EditorPage::EditorPage(Repository *repository, AppState *state, QWidget *parent)
    : QWidget(parent)
    , m_repository(repository)
    , m_state(state)
{
    QVBoxLayout *layout = new QVBoxLayout(this);
    layout->setContentsMargins(kPageMargins);
    layout->setSpacing(14);
    layout->addWidget(buildTopbar());
    layout->addWidget(buildBody());

    setAcceptDrops(true);
}

QWidget *EditorPage::buildTopbar()
{
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

QStackedWidget *EditorPage::buildBody()
{
    QStackedWidget *body = new QStackedWidget;
    m_body = body;

    QWidget *empty = new QWidget;
    QVBoxLayout *emptyLayout = new QVBoxLayout(empty);
    QLabel *hint = new QLabel(tr("세이브 파일을 여기에 끌어다 놓아요"));
    hint->setObjectName(QStringLiteral("editorDropHint"));
    hint->setAlignment(Qt::AlignCenter);

    emptyLayout->addWidget(hint);

    m_fileInfo = new QLabel;
    QWidget *loaded = new QWidget;
    QVBoxLayout *loadedLayout = new QVBoxLayout(loaded);

    QWidget *card = new QWidget;
    QGridLayout *cardLayout = new QGridLayout(card);

    for (int i = 0; i < 6; ++i) {
        PartyCard *pcard = new PartyCard;
        cardLayout->addWidget(pcard, i / 2, i % 2);
        m_cards.append(pcard);
    }

    loadedLayout->addWidget(m_fileInfo);
    loadedLayout->addWidget(card);
    loadedLayout->addStretch();

    body->addWidget(empty);
    body->addWidget(loaded);

    return body;
}

void EditorPage::dragEnterEvent(QDragEnterEvent *event)
{
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

void EditorPage::dropEvent(QDropEvent *event)
{
    QWidget::dropEvent(event);
    if (!event->mimeData()->hasUrls())
        return;
    event->acceptProposedAction();
    const QString path = event->mimeData()->urls().constFirst().toLocalFile();
    QTimer::singleShot(0, this, [this, path] { openFile(path); });
}

void EditorPage::chooseSave()
{
    const QString dir = QStandardPaths::writableLocation(QStandardPaths::DocumentsLocation);
    const QString path = QFileDialog::getOpenFileName(this, tr("세이브 불러오기"), dir,
                                                      tr("게임 세이브 (*.sav *.dsv)"));
    if (path.isEmpty())
        return;
    openFile(path);
}

void EditorPage::openFile(const QString &path)
{
    QString error;
    const std::optional<squadfile::Portable> loaded = saveimport::load(path, *m_repository, &error);

    if (!loaded) {
        QMessageBox::warning(this, tr("세이브 불러오기"), error);
        return;
    }

    m_loaded = *loaded;

    QString gameName = loaded->game;
    const QList<GameInfo> games = m_repository->gamesForGeneration(loaded->generation);
    const QString group = versionGroupOf(games, loaded->game);

    for (const GameInfo &game : games) {
        const qsizetype i = game.versions.indexOf(loaded->game);
        if (i >= 0)
            gameName = game.versionNames.at(i).text(m_state->language());
    }
    m_fileInfo->setText(tr("%1\n%2 · %3세대 · %4마리")
                                .arg(QFileInfo(path).fileName())
                                .arg(gameName)
                                .arg(loaded->generation)
                                .arg(loaded->squad.filled()));

    for (int i = 0; i < 6; ++i) {
        const SquadMember &member = loaded->squad.members[i];
        if (member.isEmpty()) {
            m_cards[i]->setEmpty();
            continue;
        }
        const QString name
                = m_repository->pokemonDetail(member.pokemonId, loaded->generation, group)
                          .name.text(m_state->language());
        QStringList moves;
        for (const int moveId : member.moves) {
            QList<int> ids;
            ids.append(moveId);
            const QList<MoveEntry> moveEntryMoves = m_repository->moves(ids, loaded->generation);
            for (int k = 0; k < moveEntryMoves.size(); ++k) {
                moves.append(moveEntryMoves[k].name.text(m_state->language()));
            }
        }
        m_cards[i]->setMember(name, member.level, moves);
    }

    m_body->setCurrentIndex(1);
}

} // namespace com::yamada::studio
