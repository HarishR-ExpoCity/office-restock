import { redirect } from "next/navigation";

// The QR code points at /request; the bare root just forwards there.
export default function Home() {
  redirect("/request");
}
