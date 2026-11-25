"use strict";
// ======================================================================
// Shared batch runner for suite tools that process many files.
// Runs jobs one after another, reports progress, stops cleanly on Cancel
// (after the current job), and keeps going when a single job fails.
// No Photoshop calls in here.
//
//   const run = createBatch({ onProgress(i, n, job), onResult(r) });
//   const summary = await run.start(jobs, async (job, i) => { ... return "ok" | "skipped: why" });
//   run.cancel();
//   summary = { done, skipped, failed, cancelled, results:[{ job, status, why, ms }] }
// ======================================================================

function createBatch(o) {
  o = o || {};
  let cancelled = false, running = false;

  async function start(jobs, runJob) {
    if (running) throw new Error("A batch is already running.");
    running = true; cancelled = false;
    const results = [];
    const summary = { done: 0, skipped: 0, failed: 0, cancelled: false, results };
    try {
      for (let i = 0; i < jobs.length; i++) {
        if (cancelled) { summary.cancelled = true; break; }
        const job = jobs[i];
        if (o.onProgress) o.onProgress(i, jobs.length, job);
        const t0 = Date.now();
        let r;
        try {
          const out = await runJob(job, i);
          const s = typeof out === "string" ? out : "ok";
          if (/^skipped/.test(s)) r = { job, status: "skipped", why: s.replace(/^skipped:?\s*/, "") };
          else r = { job, status: "ok", why: s === "ok" ? "" : s.replace(/^ok\s*\(?/, "").replace(/\)$/, "") };   // "ok (note)" keeps its note for the log
        } catch (e) {
          r = { job, status: "failed", why: (e && e.message) ? e.message : String(e) };
        }
        r.ms = Date.now() - t0;
        results.push(r);
        summary[r.status === "ok" ? "done" : r.status]++;
        if (o.onResult) o.onResult(r, i, jobs.length);
      }
      if (cancelled && results.length < jobs.length) summary.cancelled = true;
      if (o.onProgress) o.onProgress(results.length, jobs.length, null);
      return summary;
    } finally { running = false; }
  }

  return {
    start,
    cancel() { cancelled = true; },
    get running() { return running; },
    get cancelled() { return cancelled; }
  };
}

// Plain-text run log, one line per job.
function formatLog(title, summary, label) {
  const lines = [title + " run log  " + new Date().toISOString(),
    "done " + summary.done + ", skipped " + summary.skipped + ", failed " + summary.failed + (summary.cancelled ? ", CANCELLED" : ""), ""];
  for (const r of summary.results) lines.push(r.status.toUpperCase().padEnd(8) + label(r.job) + (r.why ? "  -  " + r.why : "") + "  (" + (r.ms / 1000).toFixed(1) + " s)");
  return lines.join("\n") + "\n";
}

module.exports = { createBatch, formatLog };
