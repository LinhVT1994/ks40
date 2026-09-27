// Data seeding belongs in an explicit CLI task, never a public HTTP endpoint.
export function GET() {
  return new Response(null, { status: 404 });
}
