// POST /api/admin/logout: clears the session cookie.

import { clearedCookie, isHttps } from "../../../server/auth";
import type { Fn } from "../../../server/env";
import { json } from "../../../server/http";

export const onRequestPost: Fn = async ({ request }) => json({ ok: true }, 200, { "Set-Cookie": clearedCookie(isHttps(request)) });
