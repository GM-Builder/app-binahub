import Image from "next/image";
import Link from "next/link";

import { services, type ServiceModule } from "@/lib/services";

export function ServiceMegaGrid({ items = services }: { items?: ServiceModule[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
      {items.map((service) => (
        <ServiceCard key={service.slug} service={service} />
      ))}
    </div>
  );
}

function ServiceCard({ service }: { service: ServiceModule }) {
  const isActive = service.status === "active";

  const cardContent = (
    <div
      className={`relative h-full flex flex-col justify-between p-5 rounded-2xl border transition-all ${
        isActive
          ? "bg-white border-slate-200/80 hover:border-[#C79A3C]/70 hover:shadow-md hover:shadow-slate-200/60 group"
          : "bg-slate-50/60 border-slate-200/60 opacity-80"
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="h-12 w-12 rounded-xl bg-slate-100 group-hover:bg-[#C79A3C]/10 flex items-center justify-center p-2 transition-colors">
            <Image
              src={service.icon}
              alt={service.name}
              width={48}
              height={48}
              className="h-full w-full object-contain"
            />
          </div>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              isActive
                ? "bg-[#C79A3C]/15 text-[#9E7520]"
                : "bg-slate-200/80 text-slate-500"
            }`}
          >
            {isActive ? "Tersedia" : "Segera"}
          </span>
        </div>

        <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0B2C6B] transition-colors">
          {service.name}
        </h3>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
          {service.slug === "binainsight" && "Asesmen kesiapan transformasi & pemetaan potensi."}
          {service.slug === "binaimpact" && "Pengukuran dampak perubahan & efektivitas program."}
          {service.slug === "binalab" && "Eksperimen strategi & inovasi model operasional."}
          {service.slug === "binacoach" && "Pendampingan intensif & coaching kepemimpinan."}
          {service.slug === "binaplay" && "Gamifikasi & simulasi skenario bisnis."}
          {service.slug === "binaacademy" && "Kurikulum pembelajaran & sertifikasi tim."}
          {service.slug === "binajourney" && "Roadmap transformasi langkah demi langkah."}
          {service.slug === "binaworks" && "Implementasi proyek & eksekusi lapangan."}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0B2C6B]">
        <span>{isActive ? "Buka layanan" : "Dalam pengembangan"}</span>
        {isActive && <span className="text-[#C79A3C] font-bold">→</span>}
      </div>
    </div>
  );

  if (!isActive) {
    return <div className="cursor-default">{cardContent}</div>;
  }

  return (
    <Link href={service.href} className="block">
      {cardContent}
    </Link>
  );
}
