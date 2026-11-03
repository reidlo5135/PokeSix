/**
 * PokéAPI CSV 원천 — 커밋을 고정해서 받는다(받은 파일은 크기 · SHA-256으로 확인).
 * 커밋을 올릴 때: 파일을 다시 받아 size · sha256을 고치고 importer 테스트로 열 이름이 그대로인지 본다.
 */
export const POKEAPI_COMMIT = "168b1e89467054cda2e7df43ccebbb69b459497a"

export const CSV_FILES = [
  {
    name: "languages",
    size: 291,
    sha256: "fbb60019a6a461783d5671a995d5f590db61792a273e90faa0ed630d102a19b8",
  },
  {
    name: "generations",
    size: 194,
    sha256: "d39634465251f1334aa0389b5adc4b4f2754eaec61f305fceb9432a3d4c96748",
  },
  {
    name: "version_groups",
    size: 726,
    sha256: "28da8d89d8eb4966941f81a9e62b3990510ed4d76dd774158246551a8e7707a7",
  },
  {
    name: "versions",
    size: 907,
    sha256: "70083465865a6a69a9aad2be3fc3915078c6ff740f14a090b1367d8ec9cfc3cd",
  },
  {
    name: "version_names",
    size: 8943,
    sha256: "23e3e9062f98e1f83d475b9eeac57ddff4375b46c175948a65c4fe8d3e1d87b4",
  },
  {
    name: "region_names",
    size: 999,
    sha256: "9380d909d2179a7f3bbad09969a0c89f623be135a100686596b6284c10231b48",
  },
  {
    name: "types",
    size: 321,
    sha256: "37f039c8d722f47d51ba1c5c5ecf9b7007235b1a9a1af2827645c777b70307c8",
  },
  {
    name: "type_names",
    size: 2843,
    sha256: "685230c51074cf2f723debcf827a4df4c36ab0ec7e929c806ad65a3e40958705",
  },
  {
    name: "type_efficacy",
    size: 2883,
    sha256: "cdd7de4066680414d0a2433af805f139f425d6350cbf998ecab559a0fe8ff587",
  },
  {
    name: "type_efficacy_past",
    size: 118,
    sha256: "0d8cb1251c7f987c7978d77d6c1b9ecfc54e04474b7584b8ecf96fef498fb9d4",
  },
  {
    name: "stats",
    size: 202,
    sha256: "ee8c541b45b64f40f0eb2545c767294b5801ce8a1410e19d8c33a54e6f1c3b9c",
  },
  {
    name: "pokemon_species",
    size: 56884,
    sha256: "e66e2eeb25fd3836b0ebab6bf87bbf01960aa3c0555e2bac495fa8393c5e0c45",
  },
  {
    name: "pokemon_species_names",
    size: 404502,
    sha256: "820cde17074cdb1c2b0595c997fb8f998e773bd5da3bb525dec85703c86c5fd9",
  },
  {
    name: "pokemon",
    size: 47082,
    sha256: "16c81c33188b0eac403aa2f759fcbe9e42c611f722d263f5b5a6a5bff9f8ce6b",
  },
  {
    name: "pokemon_forms",
    size: 63721,
    sha256: "99bf8f7ad4dc1f2e291357a090cef6a575623ec3cbf9030d0e33656e6e608ae2",
  },
  {
    name: "pokemon_types",
    size: 19058,
    sha256: "f1fc4bfd657a034ea3bf6972423b10276424aa068577b304a78a08996425ba05",
  },
  {
    name: "pokemon_types_past",
    size: 428,
    sha256: "02553c38e3871f99c7ed809b944066fea3f42ef6bccd4daba19274aca01fbff0",
  },
  {
    name: "pokemon_stats",
    size: 94392,
    sha256: "fa2c44263a3706468682fefc3e0b3c4f5487fe9febed7d4ebcd6939c34b16aa8",
  },
  {
    name: "pokemon_stats_past",
    size: 3046,
    sha256: "0a074d9581369c1df13d8d4f4015fd7215b896c5dfb58107f3b529f7156950d2",
  },
  {
    name: "abilities",
    size: 7074,
    sha256: "74c3588ad48e08e54ff01f432899a4028c3e91508bbd53201df85e1f6b9e9ef3",
  },
  {
    name: "ability_names",
    size: 65239,
    sha256: "8acb80c42210f86ae747dc3347b060d69cd2574a9dbfaf74774ae632ca6348da",
  },
  {
    name: "pokemon_abilities",
    size: 37224,
    sha256: "4a79ee53d386a8ad3a89657483ddfd31594e05a5d52400fe131e5e4dfd7ec04a",
  },
  {
    name: "pokemon_abilities_past",
    size: 6271,
    sha256: "cc77c6d85f8323f5f52047d45671140309d19ec0eb0e5e610b68971dc9c64e02",
  },
  {
    name: "ability_flavor_text",
    size: 1261989,
    sha256: "5ab2165547dce3897b1d88e654f0159511680b1d84f93fd4f265752b66904adb",
  },
  {
    name: "natures",
    size: 586,
    sha256: "3536990f6adeaa1735551a6afe798649d22426e161c937da09d3ae9a5381309c",
  },
  {
    name: "nature_names",
    size: 3650,
    sha256: "a6bf8bedb9822d0e966a3036885e33e1306172b3a6566edc22d02ff2e7155031",
  },
  {
    name: "pokedexes",
    size: 723,
    sha256: "aa6570e15092f80750431a59a8712410cc114d74ffffb75b3334df64b33b3d07",
  },
  {
    name: "pokedex_version_groups",
    size: 274,
    sha256: "e842691103129f6ad30b8a4de3503edfa5086f55a117630cbab6fddcfa83e82c",
  },
  {
    name: "pokemon_dex_numbers",
    size: 80383,
    sha256: "b8fe3353eec2b0ba4fc37e07e94ffa9f33ce96a7f9856c643a18b3ad518cd393",
  },
  {
    name: "evolution_chains",
    size: 2643,
    sha256: "5159f0481eaa786f2b08e58356bcc6271e0982dceeb69746aaac4637d5a47125",
  },
  {
    name: "evolution_triggers",
    size: 304,
    sha256: "fb4b055fdb022eab3110147de669ae243c5497559257ad1f370c929ab6309a8c",
  },
  {
    name: "pokemon_evolution",
    size: 37836,
    sha256: "e78be51c8805551fffccd5551a556e752e4a76ff1b52482b53b409dd3882e1dd",
  },
  {
    name: "moves",
    size: 42322,
    sha256: "8aafd37bf78f19471495c05b201545180f50f0a08a2a2a844d69f9837dd39ac9",
  },
  {
    name: "move_names",
    size: 202670,
    sha256: "99e23ee38ea53d1473474d463b87651deac3cd4928750f8186feae66da45c147",
  },
  {
    name: "move_changelog",
    size: 3475,
    sha256: "86c1511f6a0e29dcc5a885c5b8f125ffd502afbec9f69c7f2b85a3e0e8b001f8",
  },
  {
    name: "move_damage_classes",
    size: 44,
    sha256: "b7101ceca4dff152537a2fb5c439ca4030b05f86442c643812c0b7b6ccf16f1b",
  },
  {
    name: "pokemon_move_methods",
    size: 187,
    sha256: "78b75acfcf6dca4c82da9d4851357cbbd65e61b08154eddfc2ace0efd00e408e",
  },
  {
    name: "pokemon_moves",
    size: 10733699,
    sha256: "22a807cef26891eeac0d0c900bd363e66baf421f7ee795bc7bc3e718f23b939e",
  },
  {
    name: "items",
    size: 59564,
    sha256: "f08cd6dc30b447cb91cbe9232c79052e8521f32f6105bb1489b5bfabf4ca3241",
  },
  {
    name: "item_names",
    size: 498386,
    sha256: "e286953dda52ceddb72c85079641f965bde6eab6fed2a576e292dce053a1af67",
  },
  {
    name: "item_categories",
    size: 922,
    sha256: "8bfcaaf1dfe45d33a8cc374a602f2424e1c37ad68bab222f090cd95c691660d7",
  },
  {
    name: "item_pockets",
    size: 87,
    sha256: "8ba8329ca4a72fca13df87cebe1b67ea389ed61ac856d2c9b8073e6bd077aff4",
  },
  {
    name: "item_game_indices",
    size: 75060,
    sha256: "ad7576a23dea4e136ea887f5f04b680abc4f72131812fa011bdddeb54760c653",
  },
  {
    name: "encounters",
    size: 3172057,
    sha256: "93ba8853ac871719d230a6406c91f8418754fdc773f2f4b9f476007f743b4955",
  },
  {
    name: "encounter_slots",
    size: 57659,
    sha256: "597dc58df2b0a2c64cedce6d6a2a08feeecbd1cf860bdf926cd27f119417d87a",
  },
  {
    name: "encounter_methods",
    size: 1299,
    sha256: "99327ac41c463b8bcca18d04b56cad3d5532fec70dd7eb869b9ca650a007e291",
  },
  {
    name: "location_areas",
    size: 26734,
    sha256: "4706b96842166a44ca619da0add34c212088669270a478d9e84bc78e9f581840",
  },
  {
    name: "locations",
    size: 23389,
    sha256: "2af5d6a1151d5ae402f9da1d5513bc1c7437795e69b140787c7aab3f6ed7eaa3",
  },
  {
    name: "location_names",
    size: 116637,
    sha256: "4f901da13ab1fcd4cfeee99dd653652c2bd10afe21739f47a99ee906a99a004e",
  },
  {
    name: "machines",
    size: 32831,
    sha256: "f9df7faaf0a60896fa344abd2b639f83f79c2a24e1fd4bb3560ca7da76e9a6ad",
  },
  {
    name: "item_flavor_text",
    size: 6281294,
    sha256: "f85281c97e4a423fb6ae673a3d2cfab116ac2e7bb9fcdecfb43ac8b1e1fb8676",
  },
  {
    name: "move_meta",
    size: 20555,
    sha256: "93b92d5bddf4fc1536ca0a647c20453bf92e6389010f33ca6fc4c5e9c54363be",
  },
  {
    name: "move_meta_stat_changes",
    size: 2091,
    sha256: "489edd9ee45ea7e60c99c5a860c4c0957b337af21f8ae9bf03dd121fd548d5ab",
  },
  {
    name: "move_flavor_text",
    size: 5392794,
    sha256: "43177df8d76dac477fc837aa19b2a50d74ee2c94e47fb827506768c58b360087",
  },
] as const

export type CsvName = (typeof CSV_FILES)[number]["name"]

export const CSV_TOTAL_SIZE = CSV_FILES.reduce(
  (sum, file) => sum + file.size,
  0
)

export function csvUrl(name: string): string {
  return `https://raw.githubusercontent.com/PokeAPI/pokeapi/${POKEAPI_COMMIT}/data/v2/csv/${name}.csv`
}
