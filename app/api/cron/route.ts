import { GET as renewGET, POST as renewPOST } from "@/app/api/cron/renew/route";

export const dynamic = "force-dynamic";

export const GET = renewGET;
export const POST = renewPOST;
