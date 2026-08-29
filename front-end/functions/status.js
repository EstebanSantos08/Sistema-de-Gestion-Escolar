export async function onRequest() {
  return new Response(
    JSON.stringify({
      ok: true,
      app: 'school-system',
      environment: 'production',
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
