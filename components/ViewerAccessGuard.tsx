"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

const VIEWER_ALLOWED_PATHS = new Set([
  "/dashboard",
  "/projects",
  "/reports",
  "/settings",
  "/profile",
]);

type CurrentUser = {
  role?: string;
};

export default function ViewerAccessGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    const verifyAccess = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: "include",
        });

        if (!response.ok) {
          if (active) {
            setAllowed(false);
            setChecked(true);
            router.replace(`/${locale}/auth`);
          }
          return;
        }

        const user = (await response.json()) as CurrentUser;
        const localizedPrefix = `/${locale}`;
        const relativePath = pathname.startsWith(localizedPrefix)
          ? pathname.slice(localizedPrefix.length) || "/"
          : pathname;

        const viewerPathAllowed = VIEWER_ALLOWED_PATHS.has(relativePath);

        if (user.role === "VIEWER" && !viewerPathAllowed) {
          if (active) {
            setAllowed(false);
            setChecked(true);
            router.replace(`/${locale}/dashboard`);
          }
          return;
        }

        if (active) {
          setAllowed(true);
          setChecked(true);
        }
      } catch {
        if (active) {
          setAllowed(false);
          setChecked(true);
          router.replace(`/${locale}/auth`);
        }
      }
    };

    void verifyAccess();

    return () => {
      active = false;
    };
  }, [locale, pathname, router]);

  if (!checked || !allowed) {
    return null;
  }

  return <>{children}</>;
}
