import { NextResponse } from "next/server";
import { POST } from "./src/app/api/graphql/route";

async function test() {
  const req = {
    json: async () => ({
      query: `query { products(limit: 1) { id } }`
    }),
    headers: new Map()
  };
  const res = await POST(req as any);
  console.log(res.status);
  console.log(await res.json());
}

test();
