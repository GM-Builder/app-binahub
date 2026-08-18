export function programAccessPath(programId: string) {
  return `/client/access?program=${encodeURIComponent(programId)}`;
}

export function programAccessUrl(programId: string, origin: string) {
  return `${origin.replace(/\/$/, "")}${programAccessPath(programId)}`;
}

export function programInvitationText({
  programId,
  code,
  title,
  origin,
}: {
  programId: string;
  code: string;
  title: string;
  origin: string;
}) {
  return [
    `Undangan Program BinaHub — ${title}`,
    `Buka tautan: ${programAccessUrl(programId, origin)}`,
    `Kode akses: ${code}`,
    "Masukkan kode dan nama Anda untuk membuka modul program.",
  ].join("\n");
}
