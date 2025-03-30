/**
 * ポケモンデータの共通定義
 * マイルストーンとコレクション機能で共有されるデータです
 * 強さの順に並べ替え済み、時間も調整済み
 */

export const POKEMON_DATA = [
  // 初級レベル（最初の進化形態）
  {
    id: "hitokage",
    name: "ヒトカゲ",
    imageUrl: "/pokemonimage/hitokage01.gif", 
    description: "20時間の学習達成！炎のように熱い学習意欲を持ったヒトカゲをゲット！",
    condition: {
      type: "totalHours",
      value: 20
    },
    element: "fire",
    message: "学習の炎が燃え上がった！",
  },
  {
    id: "zenigame",
    name: "ゼニガメ",
    imageUrl: "/pokemonimage/zenigame01.gif",
    description: "30時間の学習達成！冷静沈着な思考力を持つゼニガメをゲット！",
    condition: {
      type: "totalHours",
      value: 30
    },
    element: "water",
    message: "知識の水流が巡り始めた！",
  },
  {
    id: "fushigidane",
    name: "フシギダネ",
    imageUrl: "/pokemonimage/fushigidane01.gif",
    description: "50時間の学習達成！知識の種を育てるフシギダネをゲット！",
    condition: {
      type: "totalHours",
      value: 50
    },
    element: "grass",
    message: "学びの種が芽生えた！",
  },
  {
    id: "mijumaru",
    name: "ミジュマル",
    imageUrl: "/pokemonimage/mijumaru.gif",
    description: "70時間の学習達成！お茶目のミジュマルががんばるあなたを応援しています！",
    condition: {
      type: "totalHours",
      value: 70
    },
    element: "water",
    message: "学びの深さを知った！",
  },
  {
    id: "kodakku",
    name: "コダック",
    imageUrl: "/pokemonimage/kodakku01.gif",
    description: "90時間の学習達成！頭を扱えながらも問題を解決するコダックをゲット！",
    condition: {
      type: "totalHours",
      value: 90
    },
    element: "water",
    message: "頭の中が整理された！",
  },
  {
    id: "nyabii",
    name: "ニャビー",
    imageUrl: "/pokemonimage/nyabii01.gif",
    description: "110時間の学習達成！小さな体でも飛びかこうとするニャビーをゲット！",
    condition: {
      type: "totalHours",
      value: 110
    },
    element: "fire",
    message: "視野が広がった！",
  },
  {
    id: "koiking",
    name: "コイキング",
    imageUrl: "/pokemonimage/koiking01.gif",
    description: "130時間の学習達成！努力の先に大きな成長があるコイキングをゲット！",
    condition: {
      type: "totalHours",
      value: 130
    },
    element: "water",
    message: "継続は力なり！",
  },
  {
    id: "rokon",
    name: "ロコン",
    imageUrl: "/pokemonimage/rokon01.gif",
    description: "150時間の学習達成！学びの道で伝説を納める九つの尾を持つロコンをゲット！",
    condition: {
      type: "totalHours",
      value: 150
    },
    element: "fire",
    message: "次々と知識を手に入れるにつれ、尾が増えていく…！",
  },
  {
    id: "hibanee",
    name: "ヒバニー",
    imageUrl: "/pokemonimage/hibanee01.gif",
    description: "170時間の学習達成！学びの炎で身を爆熱させるヒバニーをゲット！",
    condition: {
      type: "totalHours",
      value: 170
    },
    element: "fire",
    message: "学習の熱が爆発的な知識を生み出した！",
  },
  {
    id: "rakkii",
    name: "ラッキー",
    imageUrl: "/pokemonimage/rakkii01.gif",
    description: "200時間の学習達成！ひたすら学びを積み重ね、幸運を引き寄せるラッキーをゲット！",
    condition: {
      type: "totalHours",
      value: 200
    },
    element: "normal",
    message: "学びを最後まで諦めない幸運を引き寄せた！",
  },
  
  // 中級レベル（準伝説・人気ポケモン）
  {
    id: "pikachu",
    name: "ピカチュウ",
    imageUrl: "/pokemonimage/pikachu_oiwai.gif",
    description: "250時間の学習達成！閃きの電気を操るピカチュウをゲット！",
    condition: {
      type: "totalHours",
      value: 250
    },
    element: "electric",
    message: "ひらめきの電撃が走った！",
  },
  {
    id: "kabigon",
    name: "カビゴン",
    imageUrl: "/pokemonimage/kabigon01.gif",
    description: "300時間の学習達成！たっぷりと知識を貫いたカビゴンをゲット！学びの成果が身についた証だ！",
    condition: {
      type: "totalHours",
      value: 300
    },
    element: "normal",
    message: "大量の知識が身についた！",
  },
  {
    id: "rapurasu",
    name: "ラプラス",
    imageUrl: "/pokemonimage/rapurasu01.gif",
    description: "350時間の学習達成！積み重ねた知恵であらゆる謎を解くラプラスをゲット！",
    condition: {
      type: "totalHours",
      value: 350
    },
    element: "water",
    message: "難しい問題も解けるようになった！",
  },
  {
    id: "metamon",
    name: "メタモン",
    imageUrl: "/pokemonimage/metamon01.gif",
    description: "400時間の学習達成！あらゆる形に変化して学習軌跡を送るメタモンをゲット！",
    condition: {
      type: "totalHours",
      value: 400
    },
    element: "normal",
    message: "どんな学習にも適応できる柔軟性を手に入れた！",
  },
  {
    id: "iibui",
    name: "イーブイ",
    imageUrl: "/pokemonimage/iibui01.gif",
    description: "450時間の学習達成！無限の可能性を秘めたイーブイをゲット！あらゆる進化を遂げる能力を持つ。",
    condition: {
      type: "totalHours",
      value: 450
    },
    element: "normal",
    message: "どんな学問にも対応できる進化の可能性を手に入れた！",
  },
  {
    id: "pippi",
    name: "ピッピ",
    imageUrl: "/pokemonimage/pippi01.gif",
    description: "500時間の学習達成！可愛い見た目と裏腹に幻想的な力を秘めるピッピをゲット！",
    condition: {
      type: "totalHours",
      value: 500
    },
    element: "fairy",
    message: "学びの道が姫を運んできた！これはただの姫じゃない…！",
  },
  
  // 上級レベル（最終進化形態）
  {
    id: "gyaradosu",
    name: "ギャラドス",
    imageUrl: "/pokemonimage/gyaradosu01.gif",
    description: "550時間の学習達成！大きな変化を遂げたギャラドスをゲット！コイキングから進化した証だ！",
    condition: {
      type: "totalHours",
      value: 550
    },
    element: "water",
    message: "ついに大きな飛躍を遂げた！",
  },
  {
    id: "fuudin",
    name: "フーディン",
    imageUrl: "/pokemonimage/fuudin01.gif",
    description: "600時間の学習達成！超能力を使って知識を操るフーディンをゲット！",
    condition: {
      type: "totalHours",
      value: 600
    },
    element: "psychic",
    message: "学びが超能力となって発揮される！",
  },
  {
    id: "gengaa",
    name: "ゲンガー",
    imageUrl: "/pokemonimage/gengaa01.gif",
    description: "650時間の学習達成！魂にも知識を取り込むゲンガーをゲット！",
    condition: {
      type: "totalHours",
      value: 650
    },
    element: "ghost",
    message: "知識が魂にまで浮き出ている！",
  },
  {
    id: "kairyuu",
    name: "カイリュー",
    imageUrl: "/pokemonimage/kairyuu01.gif",
    description: "700時間の学習達成！力強く学びの海を泳ぎ切るカイリューをゲット！",
    condition: {
      type: "totalHours",
      value: 700
    },
    element: "dragon",
    message: "学習の海を闇雲のごとく泳ぎ切れるようになった！",
  },
  {
    id: "rizaadon",
    name: "リザードン",
    imageUrl: "/pokemonimage/rizaadon01.gif",
    description: "800時間の学習達成！ヒトカゲから進化し、学びの炎を夢の羽に変えたリザードンをゲット！",
    condition: {
      type: "totalHours",
      value: 800
    },
    element: "fire",
    message: "学びの炎が羽を得て大空を舞う！",
  },
  
  // 伝説級レベル（伝説・幻のポケモン）
  {
    id: "sandaa",
    name: "サンダー",
    imageUrl: "/pokemonimage/sandaa01.gif",
    description: "900時間の学習達成！稀少で速く激しい電撃を操るサンダーをゲット！",
    condition: {
      type: "totalHours",
      value: 900
    },
    element: "electric",
    message: "雷が落ちる瞬間のようなためらいなき知恵が手に入った！",
  },
  {
    id: "myuutsuu",
    name: "ミュウツー",
    imageUrl: "/pokemonimage/myuutsuu01.gif",
    description: "1000時間の学習達成！伝説的な知恵を持つミュウツーをゲット！",
    condition: {
      type: "totalHours",
      value: 1000
    },
    element: "psychic",
    message: "満ち加わる知識が砂漏しになりそうだ！",
  },
  {
    id: "myuu",
    name: "ミュウ",
    imageUrl: "/pokemonimage/myuu01.gif",
    description: "1100時間の学習達成！すべての知恵を内包する伝説のミュウをゲット！",
    condition: {
      type: "totalHours",
      value: 1100
    },
    element: "psychic",
    message: "究極の知識を手に入れた！",
  }
];