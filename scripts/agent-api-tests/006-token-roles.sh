#!/usr/bin/env bash
# SOURCE after sign-in. Local decoding only; this does not verify the signature.
printf '%s' "${TOKEN:-}" | node -e '
let token = "";
process.stdin.on("data", chunk => token += chunk);
process.stdin.on("end", () => {
  try {
    const c = JSON.parse(Buffer.from(token.trim().split(".")[1], "base64url").toString());
    console.log(JSON.stringify({agent:c.agent === true,admin:c.admin === true},null,2));
  } catch { console.error("Missing or invalid token; run sign-in first."); process.exitCode = 1; }
});'
