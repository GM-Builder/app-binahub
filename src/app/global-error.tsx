"use client";

import { useEffect } from "react";
import { captureError } from "@/lib/error-tracking";

export default function GlobalError({ error, retry }: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => { captureError(error); }, [error]);
  return (
    <html lang="id">
      <body>
        <main role="alert">
          <h1>Halaman belum dapat dimuat</h1>
          <p>Silakan coba lagi. Jika berulang, hubungi admin dengan waktu kejadian.</p>
          <button onClick={retry}>Coba lagi</button>
        </main>
      </body>
    </html>
  );
}
