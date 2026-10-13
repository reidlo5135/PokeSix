#include "ui/theme/theme.h"
#include "ui/theme/tokens.h"

#include <gtest/gtest.h>

namespace com::yamada::studio {
namespace {
// 테마 모드는 프로세스 전역이라, 테스트가 바꾼 모드를 다음 테스트로 넘기지 않는다
class Theme : public ::testing::Test
{
protected:
    void TearDown() override { theme::setMode(theme::Mode::Light); }
};

TEST_F(Theme, LightTokensBecomeHexColors)
{
    EXPECT_EQ(theme::substituteTokens(QStringLiteral("color: @red.deep;")),
              QStringLiteral("color: #B8241D;"));
    EXPECT_EQ(theme::substituteTokens(QStringLiteral("@nope")), QStringLiteral("@nope"));
}

TEST_F(Theme, OnColorStaysWhiteWhileWhiteIsTheSurface) // 기계적 치환으로 이미 통과
{
    EXPECT_EQ(tok::kLight.onColor, tok::light::kWhite);
    EXPECT_EQ(tok::kDark.onColor, tok::light::kWhite); // 다크에서도 색 위의 글자는 흰색
}

TEST_F(Theme, DarkPaletteTakesTheHandoffOverrides) // F3a-CP1
{
    EXPECT_EQ(tok::kDark.paper, tok::dark::kPaper);
    EXPECT_EQ(tok::kDark.white, tok::dark::kWhite);
    EXPECT_EQ(tok::kDark.paperAlt, tok::dark::kPaperAlt);
    EXPECT_EQ(tok::kDark.red, tok::dark::kRed);
    EXPECT_EQ(tok::kDark.ink, tok::dark::kInk);
    EXPECT_EQ(tok::kDark.text1, tok::dark::kText1);
    EXPECT_EQ(tok::kDark.text2, tok::dark::kText2);
    EXPECT_EQ(tok::kDark.text3, tok::dark::kText3);
    EXPECT_EQ(tok::kDark.line, tok::dark::kLine);
    EXPECT_EQ(tok::kDark.lineSoft, tok::dark::kLineSoft);
    EXPECT_EQ(tok::kDark.blue, tok::kLight.blue); // 다크 값이 없는 칸은 라이트 그대로(F3b까지)
}

TEST_F(Theme, SetModeSwitchesThePalette) // F3a-CP2
{
    EXPECT_EQ(theme::mode(), theme::Mode::Light);
    EXPECT_EQ(tok::palette().paper, tok::light::kPaper);
    theme::setMode(theme::Mode::Dark);
    EXPECT_EQ(theme::mode(), theme::Mode::Dark);
    EXPECT_EQ(&tok::palette(), &tok::kDark);
    theme::setMode(theme::Mode::Light);
    EXPECT_EQ(&tok::palette(), &tok::kLight);
}

TEST_F(Theme, TokensFollowTheMode) // F3a-CP3 (substituteTokens)
{
    theme::setMode(theme::Mode::Dark);
    EXPECT_EQ(theme::substituteTokens(QStringLiteral("background: @paper; color: @on.color;")),
              QStringLiteral("background: #1B1B21; color: #FFFFFF;"));
}

TEST_F(Theme, ColorReadsItsRoleFromTheCurrentPalette) // F3a-CP3 (tok::Color::rgb)
{
    const tok::Color role = &tok::Palette::paper;
    const tok::Color fixed = QRgb(0xFF123456);
    EXPECT_EQ(role.rgb(), tok::light::kPaper);
    theme::setMode(theme::Mode::Dark);
    EXPECT_EQ(role.rgb(), tok::dark::kPaper);
    EXPECT_EQ(fixed.rgb(), QRgb(0xFF123456)); // 고정 색은 테마와 무관
}
} // namespace
} // namespace com::yamada::studio
