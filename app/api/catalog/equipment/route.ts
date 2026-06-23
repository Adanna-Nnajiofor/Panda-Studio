import { NextResponse } from "next/server";
import { proxyCatalogGet } from "../../../../lib/serverCatalog";

export async function GET() {
  try {
    const { ok, status, payload } = await proxyCatalogGet("/equipment");

    if (!ok) {
      return NextResponse.json(
        { equipment: [], message: "Could not load equipment catalog." },
        { status },
      );
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      {
        equipment: [],
        message:
          "Studio catalog is temporarily unavailable. Please try again shortly.",
      },
      { status: 503 },
    );
  }
}
