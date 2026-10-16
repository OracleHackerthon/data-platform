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
      // 연결이 닫힌 뒤에도 JSON·리포트를 읽도록 CLOB을 문자열로 받는다.
      fetchTypeHandler: (metadata) => {
        if (metadata.dbType === oracledb.DB_TYPE_CLOB) {
          return { type: oracledb.STRING };
        }
      },
    });
    // INSERT ... RETURNING 뒤 같은 연결에서 연 커서도 query로 읽는다.
    // resultSet 옵션을 쓰지 않으므로 implicitResults의 첫 결과는 행 배열이다.
    const implicitRows = result.implicitResults?.[0];
    return result.rows ?? (Array.isArray(implicitRows) ? implicitRows as T[] : []);
  } finally {
    await conn.close();
  }
}
