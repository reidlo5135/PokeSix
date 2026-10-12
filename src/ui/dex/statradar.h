#pragma once

#include <QWidget>

#include <array>
#include <optional>

namespace com::yamada::studio {
// 종족값 레이더 차트 (도감 상세): 여섯 능력치를 육각형 축에 찍고 이은 도형.
//
//            HP
//     특공 ╱    ╲ 공격       축 순서 = 게임 요약 화면(위에서부터 시계방향):
//         │  ◆  │            HP · 공격 · 방어 · 스피드 · 특방 · 특공
//     특방 ╲    ╱ 방어
//          스피드
//
// 눈금은 50 · 100 · 150 · 200 육각형 넷. 최대치를 200으로 고정해 포켓몬끼리 모양을 견줄 수 있게
// 하고, 200을 넘는 값(단단지 방어 230 등)은 끝에 붙인다. 축 이름 옆에 값을 적는다.
//
// 세이브에서 불러온 개체(H8)는 그 개체의 인게임 능력치를 파랑 도형으로 겹친다. 능력치는 레벨을
// 따라 200을 넘을 수 있어서, 그때는 눈금을 50 단위로 늘린다(scaleMax).
class StatRadar : public QWidget
{
    Q_OBJECT
public:
    explicit StatRadar(QWidget *parent = nullptr);

    // stats: HP · 공격 · 방어 · 특공 · 특방 · 스피드(Repository 순서). 1세대는 특공 = 특방 = 특수.
    void setStats(const std::array<int, 6> &stats);
    // 성격 보정 표시: 오르는 · 내리는 능력치(stats 배열의 위치 1–5, 없으면 −1). 축 이름 옆에 ▲ 빨강
    // · ▼ 파랑
    void setNature(int increased, int decreased);
    // 인게임 능력치(같은 순서) — 파랑으로 겹친다. nullopt = 지우기(도감에서 연 상세 · 다른 포켓몬)
    void setTrainedStats(std::optional<std::array<int, 6>> stats);
    QSize sizeHint() const override;

protected:
    void paintEvent(QPaintEvent *event) override;

private:
    int scaleMax() const; // 바깥 눈금의 값: 200, 능력치가 더 크면 그보다 큰 50의 배수

    std::array<int, 6> m_stats {};
    std::optional<std::array<int, 6>> m_trained; // 비어 있으면 파랑을 그리지 않는다
    int m_increased = -1;
    int m_decreased = -1;
};
} // namespace com::yamada::studio
