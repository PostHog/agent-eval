import { NextResponse } from "next/server";
import { newsletterSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const result = newsletterSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!result.success) {
    return NextResponse.json(
      {
        message: result.error.issues[0]?.message ?? "Check your email address.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    message: `Field notes will go to ${result.data.email}.`,
  });
}
