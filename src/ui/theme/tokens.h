// PokeSix 디자인 토큰 — design/handoff-v2/design/Tokens.h(v2)를 옮겨 온 것.
// 이름은 핸드오프 그대로(kRed, kSizeIntroMark …) 둔다. 핸드오프 파일과 나란히 비교할 수 있게 하기
// 위함 (roadmap 열린 질문 5의 결정). namespace만 ps::tok → com::yamada::studio::tok로 바꿨다. 값을
// 바꿀 때는 핸드오프의 tokens.json을 기준으로 삼고, 새 핸드오프가 오면 이 파일을 다시 옮긴다. 색과
// 크기는 코드에 직접 쓰지 않고 반드시 여기서 가져온다(CLAUDE.md §5).
#pragma once

#include <QRgb>

#include <array>

namespace com::yamada::studio::tok {
// 라이트 테마(기본) 값. 줄 끝 주석은 tokens.json의 이름이며, QSS에서 @이름으로 쓴다.
// 화면 코드는 이 상수를 직접 쓰지 않고 tok::palette()를 읽는다(아래 Palette).
namespace light {
inline constexpr QRgb kRed = 0xFFD8322B;              // red
inline constexpr QRgb kRedDeep = 0xFFB8241D;          // red.deep
inline constexpr QRgb kRedTint = 0xFFFDE7E4;          // red.tint
inline constexpr QRgb kRedText = 0xFF8E1C16;          // red.text
inline constexpr QRgb kWhite = 0xFFFFFFFF;            // white
inline constexpr QRgb kPaper = 0xFFF3EFE6;            // paper
inline constexpr QRgb kPaperAlt = 0xFFFAF7F0;         // paper.alt
inline constexpr QRgb kPaperStripe = 0xFFEDE7DA;      // paper.stripe
inline constexpr QRgb kBlue = 0xFF2C64B0;             // blue
inline constexpr QRgb kBlueDeep = 0xFF1D4E8F;         // blue.deep
inline constexpr QRgb kBlueTint = 0xFFE3EDF9;         // blue.tint
inline constexpr QRgb kBlueCell = 0xFFD3E3F7;         // blue.cell
inline constexpr QRgb kBlueFocusRing = 0xFFCFE0F5;    // blue.focusRing
inline constexpr QRgb kGreen = 0xFF2A7D38;            // green
inline constexpr QRgb kGreenTint = 0xFFE3F3E4;        // green.tint
inline constexpr QRgb kYellow = 0xFFF2C12E;           // yellow
inline constexpr QRgb kYellowTint = 0xFFFFF4CC;       // yellow.tint
inline constexpr QRgb kYellowSoft = 0xFFFFE08A;       // yellow.soft
inline constexpr QRgb kYellowRowSel = 0xFFFFF9E0;     // yellow.rowSel
inline constexpr QRgb kInk = 0xFF2A2A33;              // ink
inline constexpr QRgb kText1 = 0xFF22222A;            // text.1
inline constexpr QRgb kText2 = 0xFF55535C;            // text.2
inline constexpr QRgb kText3 = 0xFF6B6872;            // text.3
inline constexpr QRgb kTextDisabled = 0xFF9A96A0;     // text.disabled
inline constexpr QRgb kLine = 0xFFDDD6C8;             // line
inline constexpr QRgb kLineSoft = 0xFFEFEAE0;         // line.soft
inline constexpr QRgb kLineStrong = 0xFFBDB4A3;       // line.strong
inline constexpr QRgb kCellBorder = 0xFFE4DDCF;       // cell.border
inline constexpr QRgb kStatLow = 0xFFE86A4F;          // stat.low
inline constexpr QRgb kStatMid = 0xFFF2C12E;          // stat.mid
inline constexpr QRgb kStatGood = 0xFF5DAE45;         // stat.good
inline constexpr QRgb kStatHigh = 0xFF2C64B0;         // stat.high
inline constexpr QRgb kCatPhysical = 0xFFEE8040;      // cat.physical
inline constexpr QRgb kCatSpecial = 0xFF2C64B0;       // cat.special
inline constexpr QRgb kCatStatus = 0xFFBDBBA6;        // cat.status
inline constexpr QRgb kHeatX4 = 0xFFD8322B;           // heat.x4
inline constexpr QRgb kHeatX2 = 0xFFF9CFC9;           // heat.x2
inline constexpr QRgb kHeatX2Text = 0xFF8E1C16;       // heat.x2.text
inline constexpr QRgb kHeatHalf = 0xFFD3E3F7;         // heat.half
inline constexpr QRgb kHeatHalfText = 0xFF1D4E8F;     // heat.half.text
inline constexpr QRgb kHeatQuarter = 0xFF2C64B0;      // heat.quarter
inline constexpr QRgb kHeatZero = 0xFF2A2A33;         // heat.zero
inline constexpr QRgb kCapsuleRed = 0xFFD8322B;       // capsule.red
inline constexpr QRgb kCapsuleCream = 0xFFFFF8EC;     // capsule.cream
inline constexpr QRgb kCapsuleBlush = 0xFFF4A3A0;     // capsule.blush
inline constexpr QRgb kCapsuleGloss = 0xFFFFFFFF;     // capsule.gloss
inline constexpr QRgb kPlateMacTop = 0xFF3E7FD0;      // plate.macTop
inline constexpr QRgb kPlateMacBottom = 0xFF1D4E8F;   // plate.macBottom
inline constexpr QRgb kPlateLinuxBase = 0xFFB01F19;   // plate.linuxBase
inline constexpr QRgb kPlateLinuxFace = 0xFFFFFDF8;   // plate.linuxFace
inline constexpr QRgb kIntroStripe = 0xFFEFEADF;      // intro.stripe
inline constexpr QRgb kIntroTitleShadow = 0xFFF2C12E; // intro.titleShadow
inline constexpr QRgb kMenuPressed = 0xFFF2C12E;      // menu.pressed
} // namespace light

// 다크 테마 값(핸드오프 darkOverrides — 아직 11개뿐, 나머지는 F3b). kRaised는 아직 쓰는 곳이 없다
namespace dark {
inline constexpr QRgb kPaper = 0xFF1B1B21;    // paper
inline constexpr QRgb kWhite = 0xFF25252D;    // white
inline constexpr QRgb kPaperAlt = 0xFF2B2B34; // paper.alt
inline constexpr QRgb kRaised = 0xFF33333D;   // raised
inline constexpr QRgb kRed = 0xFFB8241D;      // red
inline constexpr QRgb kInk = 0xFF0E0E12;      // ink
inline constexpr QRgb kText1 = 0xFFE9E6EF;    // text.1
inline constexpr QRgb kText2 = 0xFFB9B5C2;    // text.2
inline constexpr QRgb kText3 = 0xFF9F9AA8;    // text.3
inline constexpr QRgb kLine = 0xFF3A3A45;     // line
inline constexpr QRgb kLineSoft = 0xFF2F2F38; // line.soft
} // namespace dark

// 테마 하나의 색 전부(F3a, ADR 0020). 필드 이름 = 위 상수에서 k를 뗀 것, 줄 끝 주석 = QSS의 @이름.
// 화면 코드는 tok::palette().red처럼 "지금 테마의 값"을 그릴 때마다 읽는다(상수를 직접 쓰지
// 않는다).
struct Palette
{
    QRgb red;     // red
    QRgb redDeep; // red.deep
    QRgb redTint; // red.tint
    QRgb redText; // red.text
    QRgb white;   // white
    QRgb onColor; // on.color — 색 채움(빨강 · 파랑 · 타입 · 먹) 위의 흰 글자 · 그림
    QRgb paper;            // paper
    QRgb paperAlt;         // paper.alt
    QRgb paperStripe;      // paper.stripe
    QRgb blue;             // blue
    QRgb blueDeep;         // blue.deep
    QRgb blueTint;         // blue.tint
    QRgb blueCell;         // blue.cell
    QRgb blueFocusRing;    // blue.focusRing
    QRgb green;            // green
    QRgb greenTint;        // green.tint
    QRgb yellow;           // yellow
    QRgb yellowTint;       // yellow.tint
    QRgb yellowSoft;       // yellow.soft
    QRgb yellowRowSel;     // yellow.rowSel
    QRgb ink;              // ink
    QRgb text1;            // text.1
    QRgb text2;            // text.2
    QRgb text3;            // text.3
    QRgb textDisabled;     // text.disabled
    QRgb line;             // line
    QRgb lineSoft;         // line.soft
    QRgb lineStrong;       // line.strong
    QRgb cellBorder;       // cell.border
    QRgb statLow;          // stat.low
    QRgb statMid;          // stat.mid
    QRgb statGood;         // stat.good
    QRgb statHigh;         // stat.high
    QRgb catPhysical;      // cat.physical
    QRgb catSpecial;       // cat.special
    QRgb catStatus;        // cat.status
    QRgb heatX4;           // heat.x4
    QRgb heatX2;           // heat.x2
    QRgb heatX2Text;       // heat.x2.text
    QRgb heatHalf;         // heat.half
    QRgb heatHalfText;     // heat.half.text
    QRgb heatQuarter;      // heat.quarter
    QRgb heatZero;         // heat.zero
    QRgb capsuleRed;       // capsule.red
    QRgb capsuleCream;     // capsule.cream
    QRgb capsuleBlush;     // capsule.blush
    QRgb capsuleGloss;     // capsule.gloss
    QRgb plateMacTop;      // plate.macTop
    QRgb plateMacBottom;   // plate.macBottom
    QRgb plateLinuxBase;   // plate.linuxBase
    QRgb plateLinuxFace;   // plate.linuxFace
    QRgb introStripe;      // intro.stripe
    QRgb introTitleShadow; // intro.titleShadow
    QRgb menuPressed;      // menu.pressed
};

// 라이트 = 핸드오프의 기본값 그대로
inline constexpr Palette kLight {
        .red = light::kRed,
        .redDeep = light::kRedDeep,
        .redTint = light::kRedTint,
        .redText = light::kRedText,
        .white = light::kWhite,
        .onColor = light::kWhite,
        .paper = light::kPaper,
        .paperAlt = light::kPaperAlt,
        .paperStripe = light::kPaperStripe,
        .blue = light::kBlue,
        .blueDeep = light::kBlueDeep,
        .blueTint = light::kBlueTint,
        .blueCell = light::kBlueCell,
        .blueFocusRing = light::kBlueFocusRing,
        .green = light::kGreen,
        .greenTint = light::kGreenTint,
        .yellow = light::kYellow,
        .yellowTint = light::kYellowTint,
        .yellowSoft = light::kYellowSoft,
        .yellowRowSel = light::kYellowRowSel,
        .ink = light::kInk,
        .text1 = light::kText1,
        .text2 = light::kText2,
        .text3 = light::kText3,
        .textDisabled = light::kTextDisabled,
        .line = light::kLine,
        .lineSoft = light::kLineSoft,
        .lineStrong = light::kLineStrong,
        .cellBorder = light::kCellBorder,
        .statLow = light::kStatLow,
        .statMid = light::kStatMid,
        .statGood = light::kStatGood,
        .statHigh = light::kStatHigh,
        .catPhysical = light::kCatPhysical,
        .catSpecial = light::kCatSpecial,
        .catStatus = light::kCatStatus,
        .heatX4 = light::kHeatX4,
        .heatX2 = light::kHeatX2,
        .heatX2Text = light::kHeatX2Text,
        .heatHalf = light::kHeatHalf,
        .heatHalfText = light::kHeatHalfText,
        .heatQuarter = light::kHeatQuarter,
        .heatZero = light::kHeatZero,
        .capsuleRed = light::kCapsuleRed,
        .capsuleCream = light::kCapsuleCream,
        .capsuleBlush = light::kCapsuleBlush,
        .capsuleGloss = light::kCapsuleGloss,
        .plateMacTop = light::kPlateMacTop,
        .plateMacBottom = light::kPlateMacBottom,
        .plateLinuxBase = light::kPlateLinuxBase,
        .plateLinuxFace = light::kPlateLinuxFace,
        .introStripe = light::kIntroStripe,
        .introTitleShadow = light::kIntroTitleShadow,
        .menuPressed = light::kMenuPressed,
};

// 다크 = 라이트를 복사한 뒤 dark::의 값만 덮어쓴다(핸드오프에 있는 11개. 나머지는 F3b)
// TODO(F3a-CP1) constexpr 람다로: 1. Palette p = kLight;
//   2. p.paper = dark::kPaper; … dark:: 상수 11개를 같은 이름의 필드에 (kRaised는 필드 없음 →
//   건너뜀)
//   3. return p;   — 모양: inline constexpr Palette kDark = [] { /* ? */ }();
inline constexpr Palette kDark = kLight;

// 지금 테마의 팔레트(theme.cpp — theme::setMode가 바꾼다). 기본은 kLight
const Palette &palette();

// 팔레트의 한 칸을 가리키는 "역할"(멤버 포인터). palette().*role = 지금 테마의 그 색
using Role = QRgb Palette::*;

// 오래 들고 있는 색(PanelStyle 등)은 값 대신 이것을 담는다: 역할이면 그릴 때 지금 테마에서 읽고,
// 고정 색(타입 색처럼 테마와 무관)이면 그대로. 그래서 테마가 바뀌어도 다시 넣을 필요가 없다.
//   tok::Color fill = &tok::Palette::white;   // 역할
//   tok::Color header = type->fill;           // 고정 색
class Color
{
public:
    constexpr Color(Role role)
        : m_role(role)
    {
    }
    constexpr Color(QRgb fixed)
        : m_fixed(fixed)
    {
    }
    // TODO(F3a-CP3) 역할이면 지금 팔레트(palette())에서 읽는다. 지금은 늘 라이트에서 읽는다
    QRgb rgb() const { return m_role ? kLight.*m_role : m_fixed; }

private:
    Role m_role = nullptr;
    QRgb m_fixed = 0;
};

struct TypeColor
{
    const char *key;
    const char16_t *ko;
    const char16_t *abbr;
    QRgb fill;
    QRgb text;
};
inline constexpr std::array<TypeColor, 18> kTypes {{
        {"normal", u"노말", u"노", 0xFFBDBBA6, 0xFF2A2A33},
        {"fire", u"불꽃", u"불", 0xFFCC4A22, 0xFFFFFFFF},
        {"water", u"물", u"물", 0xFF3470C2, 0xFFFFFFFF},
        {"grass", u"풀", u"풀", 0xFF377D33, 0xFFFFFFFF},
        {"electric", u"전기", u"전", 0xFFF2C12E, 0xFF2A2A33},
        {"ice", u"얼음", u"얼", 0xFF7FCFD4, 0xFF2A2A33},
        {"fighting", u"격투", u"격", 0xFFA8332A, 0xFFFFFFFF},
        {"poison", u"독", u"독", 0xFF8A3F96, 0xFFFFFFFF},
        {"ground", u"땅", u"땅", 0xFFD8B062, 0xFF2A2A33},
        {"flying", u"비행", u"비", 0xFFA3AEEF, 0xFF2A2A33},
        {"psychic", u"에스퍼", u"에", 0xFFC93866, 0xFFFFFFFF},
        {"bug", u"벌레", u"벌", 0xFFA9BA3A, 0xFF2A2A33},
        {"rock", u"바위", u"바", 0xFF806C30, 0xFFFFFFFF},
        {"ghost", u"고스트", u"고", 0xFF5B4A8C, 0xFFFFFFFF},
        {"dragon", u"드래곤", u"드", 0xFF4B42C4, 0xFFFFFFFF},
        {"dark", u"악", u"악", 0xFF4A3F38, 0xFFFFFFFF},
        {"steel", u"강철", u"강", 0xFFB5C0CC, 0xFF2A2A33},
        {"fairy", u"페어리", u"페", 0xFFEFA6CF, 0xFF2A2A33},
}};

inline constexpr int kSizeAppBar = 60;
inline constexpr int kSizeAppBarCompact = 56;
inline constexpr int kSizeTabInactive = 38;
inline constexpr int kSizeTabActive = 45;
inline constexpr int kSizePanelHeader = 38;
inline constexpr int kSizePanelBorder = 2;
inline constexpr int kSizePanelRadius = 8;
inline constexpr int kSizeHardShadowY = 3;
inline constexpr int kSizeButtonHeight = 36;
inline constexpr int kSizeChipMD = 24;
inline constexpr int kSizeChipSM = 20;
inline constexpr int kSizeChipXS = 22;
inline constexpr int kSizeFilterChip = 30;
inline constexpr int kSizeInputHeight = 36;
inline constexpr int kSizeTableRow = 34;
inline constexpr int kSizeTableRowDense = 30;
inline constexpr int kSizeHeatCellW = 34;
inline constexpr int kSizeHeatCellH = 26;
inline constexpr int kSizeHeatLabelW = 92;
inline constexpr int kSizeHeatGap = 2;
inline constexpr int kSizeFocusRing = 3;
inline constexpr int kSizeSelectOutline = 4;
inline constexpr int kSizeIntroMenuWidth = 520;
inline constexpr int kSizeIntroMenuRow = 58;
inline constexpr int kSizeIntroMenuRowCompact = 52;
inline constexpr int kSizeIntroMenuRowMin = 48;
inline constexpr int kSizeIntroMark = 136;
inline constexpr int kSizeIntroWordmark = 80;
inline constexpr int kSizeAppBarMark = 36;
inline constexpr int kSizeAppBarTabs = 4;
inline constexpr int kBpWide = 1360;
inline constexpr int kBpMedium = 1100;
inline constexpr int kBpNarrow = 1024;
inline constexpr int kBpMin = 960;
inline constexpr int kBpSquadSplit = 1280;
inline constexpr int kBpMinHeight = 640;

// 캡슐 마크의 기하(viewBox 100 기준). design/handoff-v2/docs/01b_DESIGN_SHEET_V2.md §6
inline constexpr double kMarkRotateDeg = -35.0;
inline constexpr double kMarkExtent = 37.3;

} // namespace com::yamada::studio::tok
