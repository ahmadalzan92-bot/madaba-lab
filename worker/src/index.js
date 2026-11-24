// Cloudflare Worker + D1 Database API — نظام إدارة فحوصات مشاريع وزارة الأشغال العامة (مختبر مأدبا)

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
  "Access-Control-Max-Age": "86400"
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...CORS_HEADERS
    }
  });
}

function validateKey(key) {
  return typeof key === "string" && key.length >= 1 && key.length <= 200 && /^[a-zA-Z0-9_.\-:]+$/.test(key);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      const db = env.DB;

      if (path === "/" || path === "/api/health") {
        return jsonResponse({
          ok: true,
          service: "madaba-lab-api",
          database: "madaba-lab-db",
          ts: Date.now()
        });
      }

      if (path === "/api/all" && method === "GET") {
        const rows = await db.prepare("SELECT key, value, ts FROM store").all();
        const data = {};
        for (const r of rows.results || []) {
          data[r.key] = { value: r.value, ts: r.ts };
        }
        return jsonResponse(data);
      }

      if (path === "/api/storage-stats" && method === "GET") {
        const storeRows = await db.prepare("SELECT key, OCTET_LENGTH(value) as bytes, ts FROM store ORDER BY bytes DESC").all();
        const backupStat = await db.prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(OCTET_LENGTH(data)),0) as bytes FROM backups").first();
        let storeBytes = 0;
        const items = (storeRows.results || []).map((r) => {
          storeBytes += r.bytes || 0;
          return { key: r.key, bytes: r.bytes || 0, ts: r.ts };
        });
        const backupsBytes = (backupStat && backupStat.bytes) || 0;
        return jsonResponse({
          limitBytes: 500 * 1024 * 1024,
          totalUsedBytes: storeBytes + backupsBytes,
          storeBytes,
          backupsBytes,
          backupsCount: (backupStat && backupStat.cnt) || 0,
          items
        });
      }

      if (path === "/api/backup" && method === "POST") {
        const rows = await db.prepare("SELECT key, value, ts FROM store").all();
        const payload = {};
        for (const r of rows.results || []) {
          payload[r.key] = { value: r.value, ts: r.ts };
        }
        const ts = Date.now();
        const backupKey = "backup_" + ts;
        await db.prepare("INSERT INTO backups (key, data, ts) VALUES (?, ?, ?)").bind(backupKey, JSON.stringify({ ts, data: payload }), ts).run();
        await db.prepare("DELETE FROM backups WHERE id NOT IN (SELECT id FROM backups ORDER BY ts DESC LIMIT 10)").run();
        return jsonResponse({ ok: true, backupKey, ts });
      }

      if (path === "/api/backups" && method === "GET") {
        const rows = await db.prepare("SELECT key, ts, OCTET_LENGTH(data) as bytes FROM backups ORDER BY ts DESC LIMIT 10").all();
        return jsonResponse({ backups: rows.results || [] });
      }

      const km = path.match(/^\/api\/key\/(.+)$/);
      if (km) {
        const key = decodeURIComponent(km[1]);
        if (!validateKey(key)) {
          return jsonResponse({ error: "Invalid key name" }, 400);
        }

        if (method === "GET") {
          const row = await db.prepare("SELECT value, ts FROM store WHERE key = ?").bind(key).first();
          if (!row) return jsonResponse({ value: null, ts: 0 });
          return jsonResponse({ value: row.value, ts: row.ts });
        }

        if (method === "PUT") {
          const body = await request.json();
          const value = typeof body.value === "string" ? body.value : JSON.stringify(body.value ?? {});
          if (value.length > 25 * 1024 * 1024) {
            return jsonResponse({ error: "Payload too large" }, 413);
          }
          const ts = Date.now();
          await db.prepare("INSERT OR REPLACE INTO store (key, value, ts) VALUES (?, ?, ?)").bind(key, value, ts).run();
          return jsonResponse({ ok: true, key, ts });
        }

        if (method === "DELETE") {
          await db.prepare("DELETE FROM store WHERE key = ?").bind(key).run();
          return jsonResponse({ ok: true, key });
        }
      }

      return jsonResponse({ error: "Not found" }, 404);
    } catch (e) {
      return jsonResponse({ error: e.message || "Internal Server Error" }, 500);
    }
  }
};
