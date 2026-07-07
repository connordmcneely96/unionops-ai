export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { runIngestion, runSelfTest, type IngestEnv } from "@/lib/ingest";

const SWITCHGEAR_TITLE = "Switchgear Thermographic Inspection Procedure";

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function htmlResponse(body: string, status: number): Response {
    return new Response(
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Re-Ingest</title></head><body style="margin:0;font-family:Inter,system-ui,sans-serif;background:#f7f8fa;color:#111418;">${body}</body></html>`,
        {
            status,
            headers: { "content-type": "text/html; charset=utf-8" },
        }
    );
}

// ── GET /api/ingest/run?token=… — browser-triggerable re-ingest + self-test ──

export async function GET(request: NextRequest) {
    const { env: rawEnv } = await getCloudflareContext({ async: true });
    const env = rawEnv as IngestEnv;

    // Auth: token from query string. Fail closed if secret unset or mismatched.
    const token = new URL(request.url).searchParams.get("token");
    if (!env.INGEST_TOKEN || token !== env.INGEST_TOKEN) {
        return htmlResponse(
            `<div style="max-width:640px;margin:48px auto;padding:24px;background:#fff;border:1px solid #e6e8eb;border-radius:8px;box-shadow:0 1px 2px rgba(16,24,40,.04);">
                <h1 style="font-size:18px;margin:0 0 8px;">401 — Unauthorized</h1>
                <p style="font-size:14px;color:#5b6470;margin:0;">A valid token query parameter is required.</p>
            </div>`,
            401
        );
    }

    try {
        const result = await runIngestion(env);
        const selfTest = await runSelfTest(env);

        const pass = selfTest.pass;
        const statusColor = pass ? "#3f7a52" : "#c8322b";
        const statusLabel = pass ? "PASS" : "FAIL";

        const body = `
            <div style="max-width:640px;margin:48px auto;padding:24px;background:#fff;border:1px solid #e6e8eb;border-radius:8px;box-shadow:0 1px 2px rgba(16,24,40,.04);">
                <h1 style="font-size:18px;margin:0 0 4px;">Re-Ingest Complete</h1>
                <p style="font-size:13px;color:#8a929e;margin:0 0 20px;">Union County Campus · demo knowledge base</p>

                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;">
                    <div style="padding:14px;border:1px solid #e6e8eb;border-radius:8px;">
                        <div style="font-size:12px;color:#5b6470;margin-bottom:6px;">Docs Processed</div>
                        <div style="font-size:26px;font-weight:600;font-variant-numeric:tabular-nums;">${result.docsProcessed}</div>
                    </div>
                    <div style="padding:14px;border:1px solid #e6e8eb;border-radius:8px;">
                        <div style="font-size:12px;color:#5b6470;margin-bottom:6px;">Chunks Created</div>
                        <div style="font-size:26px;font-weight:600;font-variant-numeric:tabular-nums;">${result.chunksCreated}</div>
                    </div>
                    <div style="padding:14px;border:1px solid #e6e8eb;border-radius:8px;">
                        <div style="font-size:12px;color:#5b6470;margin-bottom:6px;">Vectors Upserted</div>
                        <div style="font-size:26px;font-weight:600;font-variant-numeric:tabular-nums;">${result.vectorsUpserted}</div>
                    </div>
                </div>

                ${
                    result.skipped.length > 0
                        ? `<p style="font-size:13px;color:#b7791f;margin:0 0 20px;">Skipped (no matching document row): ${escapeHtml(
                              result.skipped.join(", ")
                          )}</p>`
                        : ""
                }

                <div style="padding:16px;border:1px solid #e6e8eb;border-radius:8px;background:#f7f8fa;">
                    <div style="font-size:12px;color:#5b6470;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Retrieval Self-Test</div>
                    <div style="font-size:13px;color:#5b6470;margin-bottom:6px;">Probe: switchgear hot-lug thermal finding</div>
                    <div style="font-size:14px;margin-bottom:10px;">Top match: <strong>${escapeHtml(
                        selfTest.topTitle ?? "(none)"
                    )}</strong></div>
                    <div style="display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:12px;background:${statusColor}18;border:1px solid ${statusColor}40;">
                        <span style="width:6px;height:6px;border-radius:50%;background:${statusColor};display:inline-block;"></span>
                        <span style="font-size:12px;font-weight:600;color:${statusColor};">${statusLabel}</span>
                    </div>
                    <p style="font-size:12px;color:#8a929e;margin:12px 0 0;">Expected top match: ${escapeHtml(
                        SWITCHGEAR_TITLE
                    )}</p>
                </div>
            </div>`;

        return htmlResponse(body, 200);
    } catch {
        return htmlResponse(
            `<div style="max-width:640px;margin:48px auto;padding:24px;background:#fff;border:1px solid #e6e8eb;border-radius:8px;box-shadow:0 1px 2px rgba(16,24,40,.04);">
                <h1 style="font-size:18px;margin:0 0 8px;color:#c8322b;">500 — Ingestion Failed</h1>
                <p style="font-size:14px;color:#5b6470;margin:0;">Something went wrong while re-ingesting. Check the worker logs for details.</p>
            </div>`,
            500
        );
    }
}
