export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact' && request.method === 'POST') {
      try {
        const data = await request.json();
        // Honeypot
        if (data.website_hp) {
          return Response.json({ ok: true });
        }
        const name = (data.name || '').toString().slice(0, 200).trim();
        const email = (data.email || '').toString().slice(0, 200).trim();
        const message = (data.message || '').toString().slice(0, 4000).trim();
        if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          return Response.json({ ok: false, error: 'Please enter a valid email.' }, { status: 400 });
        }
        // Optionally persist to D1 if bound; otherwise just accept.
        if (env.DB) {
          try {
            await env.DB.prepare(
              'INSERT INTO submissions (name, email, message, created_at) VALUES (?, ?, ?, ?)'
            ).bind(name, email, message, new Date().toISOString()).run();
          } catch (e) { /* table may not exist; accept anyway */ }
        }
        return Response.json({ ok: true });
      } catch (e) {
        return Response.json({ ok: false, error: 'Something went wrong.' }, { status: 400 });
      }
    }

    return env.ASSETS.fetch(request);
  },
};
