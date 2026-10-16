// Autonomous DB 연결 (node-oracledb Thin 모드, 지갑 없는 TLS 접속 기준).
// 접속 정보는 환경변수에서만 읽는다. 10/14 리허설에서 이 방식으로 접속 확인 (docs/OCI_RUNBOOK.md 5절).
import oracledb from "oracledb";

let pool: oracledb.Pool | undefined;

async function getPool() {
  if (!pool) {
    pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
      poolMin: 0,
      poolMax: 4,
    });
  }
  return pool;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  binds: oracledb.BindParameters = {},
): Promise<T[]> {
  const conn = await (await getPool()).getConnection();
  try {
    const result = await conn.execute<T>(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
    });
    return result.rows ?? [];
  } finally {
    await conn.close();
  }
}
