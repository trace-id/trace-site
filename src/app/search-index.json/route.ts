import { searchIndex } from '@/lib/docs';

export const dynamic = 'force-static';

export async function GET() {
  return Response.json(await searchIndex());
}
