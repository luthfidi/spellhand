import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { CertificateView } from "./certificate-view";

interface Params {
  params: Promise<{ token: string }>;
}

async function fetchCertificate(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("certificate_public")
    .select("share_token, display_name, issued_at")
    .eq("share_token", token)
    .maybeSingle();

  if (error || !data) return null;
  return data as { share_token: string; display_name: string; issued_at: string };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { token } = await params;
  const t = await getTranslations("cert");
  const locale = await getLocale();
  const cert = await fetchCertificate(token);
  if (!cert) return { title: t("not_found_title") };

  const ogImage = `/cert/${token}/og?lang=${locale}`;
  const title = t("page_title", { name: cert.display_name });
  const description = t("page_description", { name: cert.display_name });
  const altText = t("og_image_alt", { name: cert.display_name });

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: altText }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function CertPage({ params }: Params) {
  const { token } = await params;
  const cert = await fetchCertificate(token);
  if (!cert) notFound();

  return (
    <CertificateView
      token={cert.share_token}
      displayName={cert.display_name}
      issuedAt={cert.issued_at}
    />
  );
}
