import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { orderSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const result = orderSchema.safeParse(await request.json().catch(() => null));

  if (!result.success) {
    return NextResponse.json(
      {
        message: result.error.issues[0]?.message ?? "Check your order details.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    orderId: randomUUID().slice(0, 8).toUpperCase(),
    message: `A confirmation for ${result.data.itemCount} items would be sent to ${result.data.email}.`,
  });
}
