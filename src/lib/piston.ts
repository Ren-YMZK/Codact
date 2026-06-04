const JUDGE0_BASE_URL = 'https://ce.judge0.com'
const PYTHON3_LANGUAGE_ID = 71
const TIMEOUT_MS = 10000
const POLL_INTERVAL_MS = 500

export interface PistonResult {
  stdout: string
  stderr: string
}

function toBase64(str: string): string {
  return Buffer.from(str).toString('base64')
}

function fromBase64(str: string | null): string {
  if (!str) return ''
  return Buffer.from(str, 'base64').toString('utf-8')
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
  }
}

export async function executePython(
  code: string,
  stdin: string = ''
): Promise<PistonResult> {
  const headers = getHeaders()

  // Step 1: サブミッションを作成してトークンを取得
  const createRes = await fetch(
    `${JUDGE0_BASE_URL}/submissions?base64_encoded=true&wait=false`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        language_id: PYTHON3_LANGUAGE_ID,
        source_code: toBase64(code),
        stdin: toBase64(stdin),
      }),
    }
  )

  if (!createRes.ok) {
    throw new Error(`Judge0 API error: ${createRes.status}`)
  }

  const { token } = await createRes.json()

  // Step 2: 結果をポーリング（status.id が 1=In Queue / 2=Processing の間は待機）
  const startTime = Date.now()

  while (true) {
    if (Date.now() - startTime > TIMEOUT_MS) {
      throw new Error('コードの実行がタイムアウトしました（10秒）')
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

    const pollRes = await fetch(
      `${JUDGE0_BASE_URL}/submissions/${token}?base64_encoded=true`,
      { headers }
    )

    if (!pollRes.ok) {
      throw new Error(`Judge0 API polling error: ${pollRes.status}`)
    }

    const result = await pollRes.json()
    const statusId: number = result.status?.id

    // 1=In Queue, 2=Processing → 継続。3以上=完了（Accepted or エラー）
    if (statusId === 1 || statusId === 2) continue

    return {
      stdout: fromBase64(result.stdout),
      stderr: fromBase64(result.stderr),
    }
  }
}
