# ui 레이어 테스트 — 위젯을 만들지 않는 부분만(테마 토큰 · 팔레트). QApplication 없이 돈다.
add_executable(pokesix_ui_tests
    theme_test.cpp   # F3a 런타임 팔레트
)
pokesix_target_defaults(pokesix_ui_tests)

target_link_libraries(pokesix_ui_tests PRIVATE
    pokesix_ui
    GTest::gtest_main
)

# data 테스트와 같은 이유(Windows의 Qt DLL 경로)로 목록은 ctest가 돌 때 읽는다
gtest_discover_tests(pokesix_ui_tests DISCOVERY_MODE PRE_TEST)
