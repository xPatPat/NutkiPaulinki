import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const folder = path.join(process.cwd(), "public", "nutki");

  const pliki = fs.readdirSync(folder);

  const nuty = pliki
    .filter((plik) => /\.(png|jpg|jpeg|webp)$/i.test(plik))
    .map((plik) => ({
      nazwa: path.parse(plik).name,
      plik: plik,
    }));

  return NextResponse.json(nuty);
}