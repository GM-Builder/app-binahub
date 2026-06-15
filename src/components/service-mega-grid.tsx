import Image from "next/image";
import Link from "next/link";

import { services, type ServiceModule } from "@/lib/services";

export function ServiceMegaGrid({ items = services }: { items?: ServiceModule[] }) {
  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-8">
      {items.map((service) => (
        <ServiceIcon key={service.slug} service={service} />
      ))}
    </div>
  );
}

function ServiceIcon({ service }: { service: ServiceModule }) {
  const isActive = service.status === "active";
  const content = (
    <>
      <div
        className={[
          "relative mx-auto flex aspect-square w-full max-w-[96px] items-center justify-center rounded-[24px] border bg-white shadow-[0_18px_52px_-38px_rgba(11,44,107,0.44)] transition",
          isActive
            ? "border-[#0B2C6B]/10 group-hover:-translate-y-1 group-hover:border-[#D9A441]/70"
            : "border-[#0B2C6B]/6 opacity-38 grayscale",
        ].join(" ")}
      >
        <Image
          src={service.icon}
          alt=""
          width={88}
          height={88}
          className="h-[56%] w-[56%] object-contain"
        />
      </div>
      <div className="mt-3 text-center">
        <p
          className={[
            "text-sm font-semibold leading-tight tracking-[-0.02em]",
            isActive ? "text-[#0B2C6B]" : "text-[#0B2C6B]/42",
          ].join(" ")}
        >
          {service.name}
        </p>
      </div>
    </>
  );

  if (!isActive) {
    return <div className="group cursor-not-allowed">{content}</div>;
  }

  return (
    <Link href={service.href} className="group">
      {content}
    </Link>
  );
}
