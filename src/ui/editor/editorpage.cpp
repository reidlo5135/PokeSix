#include "ui/editor/editorpage.h"

#include "data/repository/repository.h"
#include "data/sprites/spritecache.h"
#include "data/state/appstate.h"
#include "data/store/saveimport.h"
#include "data/store/squad.h"
#include "data/store/squadfile.h"
#include "ui/editor/partycard.h"
#include "ui/items/itemrowdelegate.h"
#include "ui/widgets/shadowbutton.h"
#include "ui/widgets/typechipwidget.h"

#include <QDir>
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
#include <QPixmap>
#include <QScrollArea>
#include <QSettings>
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
    m_pokemonIcons = new SpriteCache(SpriteCache::Kind::PokemonIcon, this);
    m_itemIcons = new SpriteCache(SpriteCache::Kind::Item, this);
    connect(m_pokemonIcons, &SpriteCache::ready, this, &EditorPage::fillCards);
    connect(m_itemIcons, &SpriteCache::ready, this, &EditorPage::fillCards);
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
    QScrollArea *scroll = new QScrollArea;
    scroll->setObjectName(QStringLiteral("editorScroll"));
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);
    QWidget *loaded = new QWidget;
    loaded->setObjectName(QStringLiteral("editorContent"));
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
    scroll->setWidget(loaded);
    body->addWidget(empty);
    body->addWidget(scroll);
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
    QSettings settings;
    QString settingsKey = "editor/lastDir";
    QString defaultDir = settings.value(settingsKey, QDir::homePath()).toString();
    const QString path = QFileDialog::getOpenFileName(this, tr("세이브 불러오기"), defaultDir,
                                                      tr("게임 세이브 (*.sav *.dsv)"));
    if (path.isEmpty())
        return;
    QString dirPath = QFileInfo(path).absolutePath();
    settings.setValue(settingsKey, dirPath);
    openFile(path);
}

void EditorPage::openFile(const QString &path)
{
    QString error;
    const std::optional<SaveFile> loaded = savefile::open(path, *m_repository, &error);
    if (!loaded) {
        QMessageBox::warning(this, tr("세이브 불러오기"), error);
        return;
    }
    m_loaded = *loaded;
    m_fileName = QFileInfo(path).fileName();
    fillCards();
    m_body->setCurrentIndex(1);
}

void EditorPage::fillCards()
{
    if (!m_loaded) {
        return;
    }
    QString gameName = m_loaded->game;
    const int generation = m_loaded->generation;
    const QList<GameInfo> games = m_repository->gamesForGeneration(generation);
    const QString group = versionGroupOf(games, m_loaded->game);
    const Language language = m_state->language();

    for (const GameInfo &game : games) {
        const qsizetype i = game.versions.indexOf(m_loaded->game);
        if (i >= 0)
            gameName = game.versionNames.at(i).text(language);
    }
    m_fileInfo->setText(tr("%1\n%2 · %3세대 · %4마리")
                                .arg(m_fileName)
                                .arg(gameName)
                                .arg(generation)
                                .arg(m_loaded->members.size()));
    const QList<Nature> natures = m_repository->natures();
    const QList<ItemRow> items = m_repository->itemsForGeneration(generation, group);

    for (int i = 0; i < 6; ++i) {
        PartyCardView view;
        const bool isInParty = i < m_loaded->members.size();
        if (!isInParty || m_loaded->members[i].squad.isEmpty()) {
            const bool egg = isInParty && m_loaded->members[i].raw.egg;
            m_cards[i]->setEmpty(egg);
            continue;
        }
        const SquadMember &member = m_loaded->members[i].squad;
        const PokemonDetail detail
                = m_repository->pokemonDetail(member.pokemonId, generation, group);
        view.name = detail.name.text(language);
        QStringList moves;
        QList<int> ids;
        for (const int moveId : member.moves) {
            if (moveId != 0)
                ids.append(moveId);
        }
        for (const MoveEntry &move : m_repository->moves(ids, generation)) {
            view.moves.append({move.name.text(language), move.type});
        }
        view.level = member.level;
        view.types = detail.types;
        view.language = language;
        for (const AbilityEntry &ability : detail.abilities) {
            if (ability.abilityId == member.abilityId)
                view.ability = ability.name.text(language);
        }
        for (const Nature &nature : natures) {
            if (nature.id == member.natureId) {
                view.nature = nature.name.text(language);
                if (!nature.isNeutral()) {
                    view.natureUp = nature.increasedStat - 1;
                    view.natureDown = nature.decreasedStat - 1;
                }
            }
        }
        for (const ItemRow &item : items) {
            if (item.id == member.itemId) {
                view.item = item.name.text(language);
                const QString itemIconKey
                        = ItemRowDelegate::iconKey(item.identifier, item.machineType, generation);
                const QString itemIconPath = m_itemIcons->path(itemIconKey);
                if (itemIconPath.isEmpty())
                    m_itemIcons->request(itemIconKey);
                else
                    view.itemIcon = QPixmap(itemIconPath);
            }
        }
        const QString pokemonIdKey = QString::number(member.pokemonId);
        const QString pokemonIconPath = m_pokemonIcons->path(pokemonIdKey);
        if (pokemonIconPath.isEmpty())
            m_pokemonIcons->request(pokemonIdKey);
        else
            view.icon = QPixmap(pokemonIconPath);
        view.stats = member.stats;
        m_cards[i]->setMember(view);
    }
}
} // namespace com::yamada::studio
