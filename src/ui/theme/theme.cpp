#include "ui/theme/theme.h"

#include "ui/logging/logging.h"
#include "ui/theme/tokens.h"

#include <QApplication>
#include <QColor>
#include <QDirIterator>
#include <QFile>
#include <QFontDatabase>
#include <QPalette>
#include <QRegularExpression>
#include <QStyleHints>

#include <algorithm>
#include <array>
#include <string_view>

namespace com::yamada::studio::theme {
namespace {
struct NamedColor
{
    std::string_view name; // tokens.json의 이름. QSS에서는 @ 뒤에 쓴다(@red.deep)
    tok::Role role; // 팔레트의 어느 칸인지 — 값은 치환할 때 지금 팔레트에서 읽는다
};

// QSS 이름 → 팔레트 칸. tokens.h의 줄 끝 주석(// red.deep)에서 뽑아 만들었다.
// 값이 아니라 역할(멤버 포인터)이라 표 하나로 라이트 · 다크 둘 다 된다.
constexpr auto kColors = std::to_array<NamedColor>({
        {"red", &tok::Palette::red},
        {"red.deep", &tok::Palette::redDeep},
        {"red.tint", &tok::Palette::redTint},
        {"red.text", &tok::Palette::redText},
        {"white", &tok::Palette::white},
        {"on.color", &tok::Palette::onColor},
        {"paper", &tok::Palette::paper},
        {"paper.alt", &tok::Palette::paperAlt},
        {"paper.stripe", &tok::Palette::paperStripe},
        {"blue", &tok::Palette::blue},
        {"blue.deep", &tok::Palette::blueDeep},
        {"blue.tint", &tok::Palette::blueTint},
        {"blue.cell", &tok::Palette::blueCell},
        {"blue.focusRing", &tok::Palette::blueFocusRing},
        {"green", &tok::Palette::green},
        {"green.tint", &tok::Palette::greenTint},
        {"yellow", &tok::Palette::yellow},
        {"yellow.tint", &tok::Palette::yellowTint},
        {"yellow.soft", &tok::Palette::yellowSoft},
        {"yellow.rowSel", &tok::Palette::yellowRowSel},
        {"ink", &tok::Palette::ink},
        {"text.1", &tok::Palette::text1},
        {"text.2", &tok::Palette::text2},
        {"text.3", &tok::Palette::text3},
        {"text.disabled", &tok::Palette::textDisabled},
        {"line", &tok::Palette::line},
        {"line.soft", &tok::Palette::lineSoft},
        {"line.strong", &tok::Palette::lineStrong},
        {"cell.border", &tok::Palette::cellBorder},
        {"stat.low", &tok::Palette::statLow},
        {"stat.mid", &tok::Palette::statMid},
        {"stat.good", &tok::Palette::statGood},
        {"stat.high", &tok::Palette::statHigh},
        {"cat.physical", &tok::Palette::catPhysical},
        {"cat.special", &tok::Palette::catSpecial},
        {"cat.status", &tok::Palette::catStatus},
        {"heat.x4", &tok::Palette::heatX4},
        {"heat.x2", &tok::Palette::heatX2},
        {"heat.x2.text", &tok::Palette::heatX2Text},
        {"heat.half", &tok::Palette::heatHalf},
        {"heat.half.text", &tok::Palette::heatHalfText},
        {"heat.quarter", &tok::Palette::heatQuarter},
        {"heat.zero", &tok::Palette::heatZero},
        {"capsule.red", &tok::Palette::capsuleRed},
        {"capsule.cream", &tok::Palette::capsuleCream},
        {"capsule.blush", &tok::Palette::capsuleBlush},
        {"capsule.gloss", &tok::Palette::capsuleGloss},
        {"plate.macTop", &tok::Palette::plateMacTop},
        {"plate.macBottom", &tok::Palette::plateMacBottom},
        {"plate.linuxBase", &tok::Palette::plateLinuxBase},
        {"plate.linuxFace", &tok::Palette::plateLinuxFace},
        {"intro.stripe", &tok::Palette::introStripe},
        {"intro.titleShadow", &tok::Palette::introTitleShadow},
        {"menu.pressed", &tok::Palette::menuPressed},
});

// TODO(F3a-CP2) 지금 모드를 담는 변수 하나: Mode g_mode = Mode::Light;
//   palette() · mode()가 읽고 setMode가 바꾼다

// qrc 안의 :/fonts/*.ttf를 전부 등록한다. 등록된 글꼴은 이 프로세스 안에서만 쓸 수 있고,
// 사용자의 시스템에 설치되지는 않는다.
void loadBundledFonts()
{
    QDirIterator it(QStringLiteral(":/fonts"), {QStringLiteral("*.ttf")});
    while (it.hasNext()) {
        const QString path = it.next();
        if (QFontDatabase::addApplicationFont(path) < 0)
            qCWarning(lcUi) << "failed to load font" << path;
    }
}
} // namespace

Mode mode()
{
    // TODO(F3a-CP2) g_mode를 돌려준다
    return Mode::Light;
}

void setMode(Mode mode)
{
    // TODO(F3a-CP2) g_mode에 담는다
    (void)mode;
}

QString substituteTokens(const QString &styleSheet)
{
    // @ 다음에 영문자로 시작해 영숫자로 끝나는 이름(점 허용): @red, @red.deep, @text.1
    // static: 정규식은 컴파일 비용이 있으니 처음 한 번만 만든다.
    static const QRegularExpression token(QStringLiteral(R"(@([A-Za-z][\w.]*[A-Za-z0-9]))"));

    QString result;
    result.reserve(styleSheet.size());
    qsizetype last = 0;
    for (const QRegularExpressionMatch &m : token.globalMatch(styleSheet)) {
        result += styleSheet.mid(last, m.capturedStart() - last);
        const QByteArray name = m.captured(1).toLatin1();
        const auto found = std::find_if(kColors.begin(), kColors.end(), [&](const NamedColor &c) {
            return c.name == std::string_view(name.constData(), name.size());
        });
        if (found != kColors.end()) {
            // TODO(F3a-CP3) 지금 팔레트(tok::palette())에서 읽는다. 지금은 늘 라이트에서 읽는다
            result += QColor(tok::kLight.*found->role).name(QColor::HexRgb).toUpper();
        } else {
            qCWarning(lcUi) << "unknown style token" << m.captured(0);
            result += m.captured(0);
        }
        last = m.capturedEnd();
    }
    result += styleSheet.mid(last);
    return result;
}

void apply(QApplication &app)
{
    loadBundledFonts();
    // TODO(F3a-CP4) 아래 "색" 부분을 applyColors로 옮기고, 여기서는 applyColors(app) 한 줄만
    //   (테마를 실행 중에 바꿀 때 F2'가 applyColors만 다시 부른다)

    // 종이 테마는 OS 설정과 무관하게 밝다(다크 테마는 Phase F3에서 토큰 교체로). Windows는
    // Qt 6.5부터 시스템이 다크 모드면 앱 팔레트를 어둡게 바꾸는데, QSS가 `background:
    // transparent`로 비워 둔 자리(분석 창의 스크롤 영역 등)에는 그 어두운 Window 색이 비쳐 검은
    // 상자가 됐다(v0.2.0 msi, 다크 모드 PC). 색 구성표를 밝음으로 고정하고 팔레트의 기본 역할도
    // 토큰으로 채운다 — QSS가 정하지 않은 위젯도 종이 위에 선다.
    // TODO(F3a-CP4) 색 구성표도 mode()를 따른다: Dark면 Qt::ColorScheme::Dark
    QGuiApplication::styleHints()->setColorScheme(Qt::ColorScheme::Light);
    QPalette palette = app.palette();
    palette.setColor(QPalette::Window, QColor(tok::palette().paper));
    palette.setColor(QPalette::WindowText, QColor(tok::palette().text1));
    palette.setColor(QPalette::Base, QColor(tok::palette().white));
    palette.setColor(QPalette::AlternateBase, QColor(tok::palette().paper));
    palette.setColor(QPalette::Text, QColor(tok::palette().text1));
    palette.setColor(QPalette::PlaceholderText, QColor(tok::palette().text3));
    palette.setColor(QPalette::Button, QColor(tok::palette().white));
    palette.setColor(QPalette::ButtonText, QColor(tok::palette().text1));
    palette.setColor(QPalette::ToolTipBase, QColor(tok::palette().white));
    palette.setColor(QPalette::ToolTipText, QColor(tok::palette().text1));
    palette.setColor(QPalette::Highlight, QColor(tok::palette().yellow));
    palette.setColor(QPalette::HighlightedText, QColor(tok::palette().ink));
    palette.setColor(QPalette::Mid, QColor(tok::palette().line));
    palette.setColor(QPalette::Dark, QColor(tok::palette().lineStrong));
    app.setPalette(palette);

    QFile file(QStringLiteral(":/styles/app.qss"));
    if (!file.open(QIODevice::ReadOnly | QIODevice::Text)) {
        qCWarning(lcUi) << "cannot open" << file.fileName();
        return;
    }
    app.setStyleSheet(substituteTokens(QString::fromUtf8(file.readAll())));
}

void applyColors(QApplication &app)
{
    // TODO(F3a-CP4) apply의 "색" 부분(setColorScheme ~ setStyleSheet)이 여기로 온다
    (void)app;
}

QFont font(const char *family, int pixelSize, QFont::Weight weight)
{
    QFont f(QString::fromLatin1(family));
    f.setPixelSize(pixelSize);
    f.setWeight(weight);
    f.setHintingPreference(QFont::PreferNoHinting); // 힌팅이 글자 폭을 바꾸지 않게 →
                                                    // 디자인(브라우저) 수치에 가깝게
    return f;
}
} // namespace com::yamada::studio::theme

namespace com::yamada::studio::tok {
const Palette &palette()
{
    // TODO(F3a-CP2) theme::mode()가 Dark면 kDark, 아니면 kLight
    return kLight;
}
} // namespace com::yamada::studio::tok
