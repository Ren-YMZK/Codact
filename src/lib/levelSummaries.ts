export interface LevelSummary {
  concepts: string[]
  built: string
  nextPreview: string | null
}

export const LEVEL_SUMMARIES: Record<number, LevelSummary> = {
  0: {
    concepts: ['print()による出力', '変数の作り方と使い方', '文字列（str）', '数値（int・float）', 'コメント（#）', 'f-stringによる文字列の組み立て'],
    built: '変数・文字列・数値・f-stringを使った社員の自己紹介プログラム',
    nextPreview: 'リスト（list）とfor文を使って、社員の名前を一覧表示する機能を作ります',
  },
  1: {
    concepts: ['print()による出力', 'リスト（list）の作り方と使い方', 'インデックスによる要素の取り出し', 'for文による繰り返し処理'],
    built: '社員リストを作成し、全員の名前を一覧表示するプログラム',
    nextPreview: 'if文を使った条件分岐で、特定の部署の社員だけを絞り込む方法を学びます',
  },
  2: {
    concepts: ['if / elif / elseによる条件分岐', '比較演算子（== != > < >= <=）', 'and / or / notによる複合条件', 'inによるリスト検索', 'for + ifによる絞り込み', 'リストのリスト'],
    built: '部署や条件でフィルタリングする社員絞り込み機能',
    nextPreview: '関数（def）と戻り値（return）を使って、処理を再利用できる形にまとめます',
  },
  3: {
    concepts: ['def による関数定義', '引数（複数引数を含む）', 'returnによる戻り値', '戻り値を変数で受け取って使う', 'for + if + returnによる検索関数'],
    built: '名前で社員を検索し、部署を返す検索機能',
    nextPreview: 'dict（辞書）を使って、名前・部署をキーで管理する方法を学びます',
  },
  4: {
    concepts: ['dict（辞書）の作り方とキーによるアクセス', 'dictへの値の追加・変更', 'dictのリストによる複数社員の管理', 'append()によるリストへの追加', 'delによるリストからの削除'],
    built: '社員のdictリストに対して追加・削除・一覧表示を行う管理機能',
    nextPreview: '数値計算とf-stringを使って、社員の給与を計算・整形表示する方法を学びます',
  },
  5: {
    concepts: ['四則演算（+ - * /）と整数除算（//）', 'f-stringによる文字列フォーマット', 'f-string内での計算式の埋め込み', 'for + 合計変数による合計・平均の計算', '{:,}による3桁区切り表示'],
    built: '社員ごとの給与を計算し、3桁区切りで整形表示したうえで合計を出す給与計算機能',
    nextPreview: 'class（クラス）を使って、データと操作をひとまとめにする方法を学びます',
  },
  6: {
    concepts: ['classの定義とインスタンスの作成', '__init__による属性の初期化', 'selfの役割', '複数の属性を持つクラス', 'メソッドの中での属性の活用', 'インスタンスの複数作成', '属性の変更（状態管理）', '状態を変えるメソッド', '管理クラスによるリスト状態の保持'],
    built: '社員クラスと管理クラスを作り、追加・一覧・検索をオブジェクトとして実装した社員管理システム',
    nextPreview: 'try / exceptと条件チェックを使って、不正な入力を弾くバリデーション機能を学びます',
  },
  7: {
    concepts: ['try / exceptによるエラーのキャッチ', 'エラーの種類を指定したexcept', 'as eによるエラーメッセージの取得', 'ifによる事前バリデーション', 'raiseによる意図的なエラーの発生', 'raise + try / exceptの組み合わせ'],
    built: '空・重複チェック付きのバリデーション登録機能を持つ完全な社員管理システム',
    nextPreview: null,
  },
}
