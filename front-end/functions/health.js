export async function onRequest() {
  return new Response(
    JSON.stringify({
      ok: true,
      status: 'healthy',
      service: 'school-system',
      timestamp: new Date().toISOString(),
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      status: 200,
    }
  );
}
