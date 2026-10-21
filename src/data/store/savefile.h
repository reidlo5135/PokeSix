#pragma once

#include "core/save/partyreader.h"
#include "data/store/squad.h"

#include <QByteArray>
#include <QList>
#include <QString>

#include <array>
#include <optional>

// 세이브 파일 하나를 연 결과 (H10b, ADR 0022). 가이드: docs/guides/h10-save-editor.md
//
//   파일 ─▶ save::readParty(core) ─▶ SaveFile
//            ├ bytes · 세대 · 게임 · 묶음 · 파티 위치   ← 쓰기(H10c)가 원본 사본을 고칠 때 쓴다
//            └ members[i] ─ squad(앱 id) + raw(게임 원본 값)
//
// 스쿼드 모양(Portable)이 필요하면 saveimport::load가 이 문서를 줄인다.
namespace com::yamada::studio {
class Repository;

// 세이브 파티의 한 마리. 같은 개체를 두 가지 말로 든다
struct SaveMember
{
    SquadMember squad; // 앱 id로 바꾼 값(카드 · 이름 찾기). 알이면 빈 자리
    save::ReadMember raw; // 게임이 저장한 원래 값(PID · 개체값 · 노력치 · 게임 번호 · 알)
};

struct SaveFile
{
    QString path; // 연 파일
    QByteArray bytes; // 파일 바이트 전부(원본 파일은 건드리지 않고 이 사본을 고친다)
    int generation = 0;          // 4 · 5
    QString versionGroup;        // "black-2-white-2" — 시리즈 표(kNdsSeries)를 찾는 열쇠
    QString game;                // 버전 "white-2"
    std::size_t partyOffset = 0; // 첫 포켓몬이 파일에서 시작하는 위치
    QList<SaveMember> members; // 세이브의 파티 순서 그대로, 1–6마리. 알도 자리를 지킨다
};

// 게임 순서(HP · 공격 · 방어 · 스피드 · 특공 · 특방) → 앱(DB) 순서(… 방어 · 특공 · 특방 · 스피드)
std::array<int, 6> dexOrder(const std::array<int, 6> &gameOrder);
} // namespace com::yamada::studio

namespace com::yamada::studio::savefile {
// 실패하면 std::nullopt — error에 사람이 읽을 한 줄(파일을 못 연다 · 세이브가 아니다)
std::optional<SaveFile> open(const QString &path, Repository &repository, QString *error = nullptr);
} // namespace com::yamada::studio::savefile
