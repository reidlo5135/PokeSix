#include "data/state/appstate.h"

#include "data/logging/logging.h"

#include <QSettings>

namespace {
constexpr char kGenerationKey[] = "generation";
constexpr char kLanguageKey[] = "language"; // "ko" · "en" · "ja"
constexpr char kGamesGroup[] = "games";     // games/4 = "soulsilver"
constexpr char kThemeKey[] = "theme";       // "light" · "dark" · "system"
} // namespace

namespace com::yamada::studio {
AppState::AppState(QObject *parent)
    : QObject(parent)
{
    // QSettings(): 조직 · 앱 이름(main.cpp)으로 저장 위치가 정해진다. 형식은 모든 OS에서
    // IniFormat(main.cpp의 setDefaultFormat, conventions.md §8):
    //   Linux ~/.config/YamadaStudio/PokeSix.ini · macOS ~/.config/… · Windows
    //   %APPDATA%\YamadaStudio\PokeSix.ini
    // Windows 레지스트리(NativeFormat)는 쓰지 않는다 — 조직 이름이 없으면 쓰기가 조용히 버려져
    // 테스트가 깨지고, 파일이면 열어 보고 지우기 쉽다.
    const int saved = QSettings().value(kGenerationKey, kDefaultGeneration).toInt();
    m_generation
            = (saved >= kMinGeneration && saved <= kMaxGeneration) ? saved : kDefaultGeneration;
    m_language = savedLanguage();
    m_theme = savedTheme();
}

AppState::Theme AppState::savedTheme()
{
    const QString value = QSettings().value(kThemeKey).toString();
    if (value == QLatin1String("light"))
        return Theme::Light;
    if (value == QLatin1String("dark"))
        return Theme::Dark;
    return Theme::System; // 처음 실행 · 모르는 값
}

void AppState::setTheme(Theme theme)
{
    if (theme == m_theme)
        return;
    m_theme = theme;
    const char *value = theme == Theme::Light ? "light" : theme == Theme::Dark ? "dark" : "system";
    QSettings().setValue(kThemeKey, QLatin1String(value));
    qCInfo(lcData) << "theme" << value;
    emit themeChanged(theme);
}

Language AppState::savedLanguage()
{
    return languageFromCode(QSettings().value(kLanguageKey).toString());
}

void AppState::saveLanguage(Language language)
{
    QSettings().setValue(kLanguageKey, languageCode(language));
}

void AppState::setLanguage(Language language)
{
    if (language == m_language)
        return;
    m_language = language;
    saveLanguage(language);
    qCInfo(lcData) << "language" << languageCode(language);
    emit languageChanged(language);
}

QString AppState::game(int generation) const
{
    QSettings settings;
    settings.beginGroup(QLatin1String(kGamesGroup));
    return settings.value(QString::number(generation)).toString();
}

void AppState::setGame(const QString &version)
{
    if (version.isEmpty() || version == game())
        return;
    QSettings settings;
    settings.beginGroup(QLatin1String(kGamesGroup));
    settings.setValue(QString::number(m_generation), version);
    qCInfo(lcData) << "game" << version;
    emit gameChanged(version);
}

void AppState::setGeneration(int generation)
{
    if (generation < kMinGeneration || generation > kMaxGeneration || generation == m_generation)
        return;
    m_generation = generation;
    QSettings().setValue(kGenerationKey, generation);
    qCInfo(lcData) << "generation" << generation;
    emit generationChanged(generation);
}
} // namespace com::yamada::studio
