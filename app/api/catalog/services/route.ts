import { NextResponse } from "next/server";
import { proxyCatalogGet } from "../../../../lib/serverCatalog";

export async function GET() {
  try {
    const { ok, status, payload } = await proxyCatalogGet("/services");

    if (!ok) {
      return NextResponse.json(
        { services: [], message: "Could not load services catalog." },
        { status },
      );
    }

    const services = Array.isArray(payload) ? payload : (payload.services ?? []);

    return NextResponse.json({ services });
  } catch {
    return NextResponse.json(
      {
        services: [],
        message:
          "Services catalog is temporarily unavailable. Please try again shortly.",
      },
      { status: 503 },
    );
  }
}
