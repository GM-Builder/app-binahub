import type { ComponentProps } from "react";

// Preview-only replacement: no Next router, prefetch, auth, or production API.
export default function PreviewLink({ href, children, ...props }: ComponentProps<"a">) {
  return <a href={href} {...props}>{children}</a>;
}
