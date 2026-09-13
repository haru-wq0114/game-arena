const RulesSlides = (() => {

  const rules = {
    'mine-glico': {
      title: '地雷グリコ',
      icon: '💣',
      slides: [
        {
          title: 'ゲーム概要',
          text: 'じゃんけんで勝って階段を進め！\n46段のゴールを目指す2人対戦ゲーム。',
          svg: `<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg">
            <defs><linearGradient id="stair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#1e40af"/></linearGradient></defs>
            <text x="240" y="25" font-size="11" fill="#c9a227" text-anchor="middle">GOAL</text>
            <rect x="200" y="30" width="80" height="14" rx="3" fill="url(#stair)" opacity=".9"/>
            <rect x="170" y="50" width="80" height="14" rx="3" fill="url(#stair)" opacity=".8"/>
            <rect x="140" y="70" width="80" height="14" rx="3" fill="url(#stair)" opacity=".7"/>
            <rect x="110" y="90" width="80" height="14" rx="3" fill="url(#stair)" opacity=".6"/>
            <rect x="80" y="110" width="80" height="14" rx="3" fill="url(#stair)" opacity=".5"/>
            <rect x="50" y="130" width="80" height="14" rx="3" fill="url(#stair)" opacity=".4"/>
            <rect x="20" y="150" width="80" height="14" rx="3" fill="url(#stair)" opacity=".3"/>
            <text x="30" y="163" font-size="10" fill="#fff">START</text>
            <circle cx="55" cy="145" r="10" fill="#ff4757" opacity=".9"/><text x="55" y="149" font-size="8" fill="#fff" text-anchor="middle">P1</text>
            <circle cx="195" cy="65" r="10" fill="#3b82f6" opacity=".9"/><text x="195" y="69" font-size="8" fill="#fff" text-anchor="middle">P2</text>
            <text x="140" y="105" font-size="22" text-anchor="middle">⬆️</text>
          </svg>`
        },
        {
          title: 'じゃんけんで進む',
          text: 'グー勝ち → 「グ・リ・コ」3段進む\nチョキ勝ち → 「チ・ヨ・コ・レ・イ・ト」6段\nパー勝ち → 「パ・イ・ナ・ツ・プ・ル」6段',
          svg: `<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(40,20)">
              <circle cx="30" cy="40" r="28" fill="rgba(201,162,39,.15)" stroke="#c9a227" stroke-width="2"/>
              <text x="30" y="48" font-size="30" text-anchor="middle">✊</text>
              <text x="30" y="85" font-size="11" fill="#c9a227" text-anchor="middle" font-weight="bold">3段</text>
            </g>
            <g transform="translate(110,20)">
              <circle cx="30" cy="40" r="28" fill="rgba(201,162,39,.15)" stroke="#c9a227" stroke-width="2"/>
              <text x="30" y="48" font-size="30" text-anchor="middle">✌️</text>
              <text x="30" y="85" font-size="11" fill="#c9a227" text-anchor="middle" font-weight="bold">6段</text>
            </g>
            <g transform="translate(180,20)">
              <circle cx="30" cy="40" r="28" fill="rgba(201,162,39,.15)" stroke="#c9a227" stroke-width="2"/>
              <text x="30" y="48" font-size="30" text-anchor="middle">✋</text>
              <text x="30" y="85" font-size="11" fill="#c9a227" text-anchor="middle" font-weight="bold">6段</text>
            </g>
            <rect x="20" y="115" width="240" height="50" rx="10" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.1)"/>
            <text x="140" y="137" font-size="11" fill="#f0f0f5" text-anchor="middle">あいこが5回連続 → 最後にグーを出した方が</text>
            <text x="140" y="155" font-size="11" fill="#c9a227" text-anchor="middle" font-weight="bold">3段 or 6段を選べる！</text>
          </svg>`
        },
        {
          title: '地雷の設置',
          text: 'ゲーム開始前に1〜45段の中から\n3箇所に地雷を設置できる。\n相手がその段を踏むとSTARTに戻る！',
          svg: `<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="20" width="220" height="30" rx="6" fill="rgba(59,130,246,.15)" stroke="rgba(59,130,246,.3)"/>
            <text x="140" y="40" font-size="11" fill="#60a5fa" text-anchor="middle">1〜45段から3箇所を選択</text>
            <g transform="translate(40,70)">
              <rect width="55" height="35" rx="6" fill="rgba(255,71,87,.1)" stroke="#ff4757"/>
              <text x="28" y="24" font-size="20" text-anchor="middle">💣</text>
            </g>
            <g transform="translate(112,70)">
              <rect width="55" height="35" rx="6" fill="rgba(255,71,87,.1)" stroke="#ff4757"/>
              <text x="28" y="24" font-size="20" text-anchor="middle">💣</text>
            </g>
            <g transform="translate(184,70)">
              <rect width="55" height="35" rx="6" fill="rgba(255,71,87,.1)" stroke="#ff4757"/>
              <text x="28" y="24" font-size="20" text-anchor="middle">💣</text>
            </g>
            <text x="140" y="130" font-size="28" text-anchor="middle">💥</text>
            <text x="140" y="155" font-size="12" fill="#ff4757" text-anchor="middle" font-weight="bold">地雷を踏む → STARTに戻る！</text>
            <text x="140" y="172" font-size="10" fill="rgba(240,240,245,.5)" text-anchor="middle">※同じ段への設置は不可</text>
          </svg>`
        }
      ]
    },
    'freestyle-janken': {
      title: '自由律ジャンケン',
      icon: '✊',
      slides: [
        {
          title: 'ゲーム概要',
          text: '通常の3つの手に加え、\nあなただけのオリジナルの手を作成！\n7回戦4先勝制で戦います。',
          svg: `<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(20,15)">
              <circle cx="35" cy="35" r="28" fill="rgba(201,162,39,.1)" stroke="rgba(201,162,39,.4)"/>
              <text x="35" y="44" font-size="28" text-anchor="middle">✊</text>
            </g>
            <g transform="translate(90,15)">
              <circle cx="35" cy="35" r="28" fill="rgba(201,162,39,.1)" stroke="rgba(201,162,39,.4)"/>
              <text x="35" y="44" font-size="28" text-anchor="middle">✌️</text>
            </g>
            <g transform="translate(160,15)">
              <circle cx="35" cy="35" r="28" fill="rgba(201,162,39,.1)" stroke="rgba(201,162,39,.4)"/>
              <text x="35" y="44" font-size="28" text-anchor="middle">✋</text>
            </g>
            <text x="247" y="35" font-size="22" text-anchor="middle">+</text>
            <text x="247" y="60" font-size="11" fill="#c9a227" text-anchor="middle">独自手</text>
            <rect x="20" y="85" width="240" height="80" rx="12" fill="rgba(139,92,246,.08)" stroke="rgba(139,92,246,.3)"/>
            <text x="140" y="108" font-size="12" fill="#a78bfa" text-anchor="middle" font-weight="bold">7回戦 4先勝制</text>
            <text x="140" y="130" font-size="11" fill="rgba(240,240,245,.6)" text-anchor="middle">5つの手から毎回1つ選んで対戦</text>
            <text x="140" y="150" font-size="11" fill="rgba(240,240,245,.6)" text-anchor="middle">先に4勝した方が勝利！</text>
          </svg>`
        },
        {
          title: 'オリジナルの手',
          text: '独自手には名前・絵文字・\n勝敗関係を自分で設定できる。\nAI審判が公平性をチェック！',
          svg: `<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="10" width="220" height="160" rx="14" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.08)"/>
            <text x="140" y="38" font-size="11" fill="rgba(240,240,245,.5)" text-anchor="middle">独自手の設定</text>
            <text x="70" y="65" font-size="10" fill="#c9a227">名前:</text><text x="120" y="65" font-size="11" fill="#f0f0f5">ドラゴンクロー</text>
            <text x="70" y="85" font-size="10" fill="#c9a227">絵文字:</text><text x="120" y="85" font-size="18">🐉</text>
            <line x1="50" y1="97" x2="230" y2="97" stroke="rgba(255,255,255,.06)"/>
            <text x="70" y="115" font-size="10" fill="#2ed573">勝ち:</text><text x="110" y="115" font-size="11" fill="#f0f0f5">✊ グー、✌️ チョキ</text>
            <text x="70" y="135" font-size="10" fill="#ff4757">負け:</text><text x="110" y="135" font-size="11" fill="#f0f0f5">✋ パー</text>
            <g transform="translate(150,145)">
              <rect width="80" height="22" rx="6" fill="rgba(46,213,115,.15)" stroke="#2ed573"/>
              <text x="40" y="15" font-size="9" fill="#2ed573" text-anchor="middle">✓ AI承認</text>
            </g>
          </svg>`
        }
      ]
    },
    'beauty-contest': {
      title: '美人投票',
      icon: '🧪',
      slides: [
        {
          title: 'ゲーム概要',
          text: '5人のプレイヤーが0〜100の数字を選択。\n全員の平均値×0.8に最も近い数字を\n選んだ人が勝利！',
          svg: `<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(15,10)">
              ${[0,1,2,3,4].map(i => `
                <circle cx="${30+i*52}" cy="30" r="18" fill="rgba(201,162,39,.1)" stroke="rgba(201,162,39,.3)"/>
                <text x="${30+i*52}" y="35" font-size="16" text-anchor="middle">👤</text>
                <text x="${30+i*52}" y="58" font-size="9" fill="rgba(240,240,245,.5)" text-anchor="middle">P${i+1}</text>
              `).join('')}
            </g>
            <rect x="20" y="75" width="240" height="90" rx="12" fill="rgba(59,130,246,.06)" stroke="rgba(59,130,246,.2)"/>
            <text x="140" y="97" font-size="11" fill="#60a5fa" text-anchor="middle">全員の選んだ数字の平均 × 0.8</text>
            <text x="140" y="117" font-size="10" fill="rgba(240,240,245,.5)" text-anchor="middle">例: 5人が 20,30,40,50,60 を選択</text>
            <text x="140" y="137" font-size="10" fill="rgba(240,240,245,.5)" text-anchor="middle">平均=40 → 目標値=32</text>
            <text x="140" y="157" font-size="11" fill="#c9a227" text-anchor="middle" font-weight="bold">32に最も近い人が勝ち！</text>
          </svg>`
        },
        {
          title: 'ペナルティと脱落',
          text: '最も遠い数字を選んだ人にペナルティ+1\nペナルティが10に達すると脱落！\n最後まで生き残れ。',
          svg: `<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg">
            <text x="140" y="25" font-size="11" fill="rgba(240,240,245,.5)" text-anchor="middle">ペナルティメーター</text>
            <g transform="translate(40,35)">
              ${Array.from({length:10},(_,i)=>`<circle cx="${i*22}" cy="0" r="8" fill="${i<7?'#ff4757':'rgba(255,71,87,.15)'}" stroke="rgba(255,71,87,.4)"/>`).join('')}
            </g>
            <text x="140" y="65" font-size="10" fill="#ff4757" text-anchor="middle">7 / 10</text>
            <rect x="30" y="80" width="220" height="85" rx="10" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.06)"/>
            <text x="140" y="102" font-size="10" fill="#c9a227" text-anchor="middle">追加ルール（脱落者が出るたび追加）</text>
            <text x="50" y="122" font-size="10" fill="rgba(240,240,245,.6)">1人目脱落: 同数選択 → 無効</text>
            <text x="50" y="140" font-size="10" fill="rgba(240,240,245,.6)">2人目脱落: ピタリ賞 → 2倍減点</text>
            <text x="50" y="158" font-size="10" fill="rgba(240,240,245,.6)">3人目脱落: 0選択 → 100が勝者</text>
          </svg>`
        }
      ]
    },
    'e-card': {
      title: 'Eカード',
      icon: '👑',
      slides: [
        {
          title: 'ゲーム概要',
          text: '皇帝側と奴隷側に分かれて対戦。\n皇帝側は皇帝1枚+市民4枚を持ち、\n奴隷側は奴隷1枚+市民4枚を持つ。',
          svg: `<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg">
            <text x="80" y="20" font-size="11" fill="#c9a227" text-anchor="middle" font-weight="bold">皇帝側</text>
            <text x="200" y="20" font-size="11" fill="#ff4757" text-anchor="middle" font-weight="bold">奴隷側</text>
            <g transform="translate(25,30)">
              <rect width="40" height="55" rx="6" fill="rgba(201,162,39,.2)" stroke="#c9a227" stroke-width="1.5"/>
              <text x="20" y="35" font-size="20" text-anchor="middle">👑</text>
              <text x="20" y="50" font-size="7" fill="#c9a227" text-anchor="middle">皇帝</text>
            </g>
            ${[0,1,2,3].map(i => `
              <g transform="translate(${70+i*22},30)">
                <rect width="20" height="55" rx="4" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.15)"/>
                <text x="10" y="38" font-size="10" text-anchor="middle">👤</text>
              </g>
            `).join('')}
            <g transform="translate(165,30)">
              <rect width="40" height="55" rx="6" fill="rgba(255,71,87,.15)" stroke="#ff4757" stroke-width="1.5"/>
              <text x="20" y="35" font-size="20" text-anchor="middle">⛓️</text>
              <text x="20" y="50" font-size="7" fill="#ff4757" text-anchor="middle">奴隷</text>
            </g>
            ${[0,1,2,3].map(i => `
              <g transform="translate(${210+i*22},30)">
                <rect width="20" height="55" rx="4" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.15)"/>
                <text x="10" y="38" font-size="10" text-anchor="middle">👤</text>
              </g>
            `).join('')}
            <rect x="20" y="100" width="240" height="70" rx="10" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.06)"/>
            <text x="140" y="120" font-size="11" fill="#f0f0f5" text-anchor="middle">互いに1枚ずつカードを出して勝負</text>
            <text x="140" y="140" font-size="11" fill="#c9a227" text-anchor="middle" font-weight="bold">12セットの合計ポイントで決着</text>
            <text x="140" y="158" font-size="10" fill="rgba(240,240,245,.5)" text-anchor="middle">6セットごとに皇帝/奴隷交代</text>
          </svg>`
        },
        {
          title: '勝敗関係',
          text: '皇帝 > 市民（皇帝の勝ち）\n市民 > 奴隷（市民の勝ち）\n奴隷 > 皇帝（奴隷の大逆転！5pt）',
          svg: `<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(100,10)">
              <circle cx="40" cy="35" r="30" fill="rgba(201,162,39,.1)" stroke="#c9a227"/>
              <text x="40" y="32" font-size="24" text-anchor="middle">👑</text>
              <text x="40" y="50" font-size="9" fill="#c9a227" text-anchor="middle">皇帝</text>
            </g>
            <g transform="translate(25,100)">
              <circle cx="40" cy="35" r="30" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.2)"/>
              <text x="40" y="32" font-size="24" text-anchor="middle">👤</text>
              <text x="40" y="50" font-size="9" fill="rgba(240,240,245,.6)" text-anchor="middle">市民</text>
            </g>
            <g transform="translate(175,100)">
              <circle cx="40" cy="35" r="30" fill="rgba(255,71,87,.1)" stroke="#ff4757"/>
              <text x="40" y="32" font-size="24" text-anchor="middle">⛓️</text>
              <text x="40" y="50" font-size="9" fill="#ff4757" text-anchor="middle">奴隷</text>
            </g>
            <line x1="120" y1="65" x2="75" y2="105" stroke="#2ed573" stroke-width="2" marker-end="url(#arr)"/>
            <line x1="100" y1="140" x2="180" y2="140" stroke="#2ed573" stroke-width="2" marker-end="url(#arr)"/>
            <line x1="200" y1="105" x2="160" y2="65" stroke="#ff4757" stroke-width="2.5" marker-end="url(#arr2)"/>
            <text x="158" y="78" font-size="9" fill="#ff4757" font-weight="bold">5pt!</text>
            <defs>
              <marker id="arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#2ed573"/></marker>
              <marker id="arr2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#ff4757"/></marker>
            </defs>
            <text x="70" y="92" font-size="8" fill="#2ed573">1pt</text>
            <text x="140" y="155" font-size="8" fill="#2ed573">1pt</text>
          </svg>`
        }
      ]
    },
    'one-poker': {
      title: 'ワンポーカー',
      icon: '🃏',
      slides: [
        {
          title: 'ゲーム概要',
          text: '各プレイヤーはライフ30でスタート。\n毎ラウンド2枚配られ1枚を選び、\nベッティングで勝負！',
          svg: `<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(30,10)">
              <text x="50" y="15" font-size="10" fill="rgba(240,240,245,.5)" text-anchor="middle">あなた</text>
              <rect width="40" height="55" rx="6" fill="rgba(255,255,255,.9)" stroke="rgba(255,255,255,.3)"/>
              <text x="20" y="38" font-size="16" fill="#dc2626" text-anchor="middle" font-weight="bold">A♥</text>
              <rect x="50" width="40" height="55" rx="6" fill="rgba(255,255,255,.9)" stroke="rgba(255,255,255,.3)"/>
              <text x="70" y="38" font-size="16" fill="#1a1a2e" text-anchor="middle" font-weight="bold">7♠</text>
            </g>
            <text x="140" y="50" font-size="24" text-anchor="middle">VS</text>
            <g transform="translate(170,10)">
              <text x="40" y="15" font-size="10" fill="rgba(240,240,245,.5)" text-anchor="middle">相手</text>
              <rect width="40" height="55" rx="6" fill="#1a1a2e" stroke="rgba(139,92,246,.3)"/>
              <text x="20" y="38" font-size="16" fill="rgba(255,255,255,.15)" text-anchor="middle">?</text>
              <rect x="40" width="40" height="55" rx="6" fill="#1a1a2e" stroke="rgba(139,92,246,.3)"/>
              <text x="60" y="38" font-size="16" fill="rgba(255,255,255,.15)" text-anchor="middle">?</text>
            </g>
            <rect x="20" y="80" width="240" height="90" rx="12" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.06)"/>
            <text x="140" y="102" font-size="11" fill="#c9a227" text-anchor="middle" font-weight="bold">ライフ制</text>
            <text x="140" y="122" font-size="10" fill="rgba(240,240,245,.6)" text-anchor="middle">初期ライフ: 30</text>
            <text x="140" y="140" font-size="10" fill="rgba(240,240,245,.6)" text-anchor="middle">ライフ0 or 3敗で敗北</text>
            <text x="140" y="158" font-size="10" fill="#ff4757" text-anchor="middle">カードの数字が大きい方が勝ち</text>
          </svg>`
        },
        {
          title: 'ベッティング',
          text: 'コール: 相手と同額で勝負\nレイズ: 賭け金を上乗せ\nドロップ: 降りる（賭け分失う）',
          svg: `<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(20,10)">
              <rect width="240" height="45" rx="8" fill="rgba(46,213,115,.08)" stroke="rgba(46,213,115,.3)"/>
              <text x="25" y="20" font-size="16">📞</text>
              <text x="55" y="20" font-size="11" fill="#2ed573" font-weight="bold">コール</text>
              <text x="55" y="36" font-size="9" fill="rgba(240,240,245,.5)">相手のベットに合わせて勝負する</text>
            </g>
            <g transform="translate(20,65)">
              <rect width="240" height="45" rx="8" fill="rgba(201,162,39,.08)" stroke="rgba(201,162,39,.3)"/>
              <text x="25" y="20" font-size="16">⬆️</text>
              <text x="55" y="20" font-size="11" fill="#c9a227" font-weight="bold">レイズ</text>
              <text x="55" y="36" font-size="9" fill="rgba(240,240,245,.5)">賭け金を上乗せしてプレッシャーをかける</text>
            </g>
            <g transform="translate(20,120)">
              <rect width="240" height="45" rx="8" fill="rgba(255,71,87,.08)" stroke="rgba(255,71,87,.3)"/>
              <text x="25" y="20" font-size="16">🏳️</text>
              <text x="55" y="20" font-size="11" fill="#ff4757" font-weight="bold">ドロップ</text>
              <text x="55" y="36" font-size="9" fill="rgba(240,240,245,.5)">降りる。現在のベット分のライフを失う</text>
            </g>
          </svg>`
        },
        {
          title: 'UP/DOWNカード',
          text: '相手には自分のカードが\n前の手札より上か下かだけ見える。\nこの情報を読んで勝負を仕掛けろ！',
          svg: `<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg">
            <text x="140" y="25" font-size="11" fill="rgba(240,240,245,.5)" text-anchor="middle">相手に見えるヒント情報</text>
            <g transform="translate(40,40)">
              <rect width="85" height="60" rx="10" fill="rgba(255,71,87,.1)" stroke="rgba(255,71,87,.4)"/>
              <text x="43" y="25" font-size="20" text-anchor="middle">🔺</text>
              <text x="43" y="48" font-size="12" fill="#ff4757" text-anchor="middle" font-weight="bold">UP</text>
            </g>
            <g transform="translate(155,40)">
              <rect width="85" height="60" rx="10" fill="rgba(59,130,246,.1)" stroke="rgba(59,130,246,.4)"/>
              <text x="43" y="25" font-size="20" text-anchor="middle">🔻</text>
              <text x="43" y="48" font-size="12" fill="#3b82f6" text-anchor="middle" font-weight="bold">DOWN</text>
            </g>
            <rect x="20" y="115" width="240" height="55" rx="10" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.06)"/>
            <text x="140" y="137" font-size="10" fill="rgba(240,240,245,.6)" text-anchor="middle">前ラウンドのカードより高い → UP表示</text>
            <text x="140" y="155" font-size="10" fill="rgba(240,240,245,.6)" text-anchor="middle">前ラウンドのカードより低い → DOWN表示</text>
          </svg>`
        }
      ]
    }
  };

  let currentSlide = 0;
  let currentGame = null;
  let onComplete = null;

  function show(gameType, callback) {
    currentGame = gameType;
    currentSlide = 0;
    onComplete = callback;
    renderSlide();
  }

  function renderSlide() {
    const r = rules[currentGame];
    if (!r) { if (onComplete) onComplete(); return; }
    const s = r.slides[currentSlide];
    const total = r.slides.length;
    const dots = r.slides.map((_, i) =>
      `<div class="slide-dot ${i === currentSlide ? 'active' : ''}" onclick="RulesSlides.goTo(${i})"></div>`
    ).join('');

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen active">
        <div class="rules-container">
          <div class="rules-header">
            <span class="rules-badge">${r.icon} RULES</span>
            <span class="rules-counter">${currentSlide + 1} / ${total}</span>
          </div>
          <h2 class="rules-title">${s.title}</h2>
          <div class="rules-illustration">${s.svg}</div>
          <div class="rules-text">${s.text.replace(/\n/g, '<br>')}</div>
          <div class="rules-dots">${dots}</div>
          <div class="rules-nav">
            ${currentSlide > 0 ? '<button class="btn ghost" onclick="RulesSlides.prev()">← 前へ</button>' : '<div></div>'}
            ${currentSlide < total - 1
              ? '<button class="btn primary" onclick="RulesSlides.next()">次へ →</button>'
              : '<button class="btn primary" onclick="RulesSlides.finish()">ゲーム開始 ⚡</button>'}
          </div>
          <button class="btn ghost text-xs" onclick="RulesSlides.finish()" style="margin-top:8px;opacity:.5">スキップ</button>
        </div>
      </div>
    `;
    if (typeof AudioManager !== 'undefined') AudioManager.playSelect();
  }

  function next() { if (rules[currentGame] && currentSlide < rules[currentGame].slides.length - 1) { currentSlide++; renderSlide(); } }
  function prev() { if (currentSlide > 0) { currentSlide--; renderSlide(); } }
  function goTo(i) { currentSlide = i; renderSlide(); }
  function finish() { if (onComplete) onComplete(); }

  return { show, next, prev, goTo, finish };
})();
