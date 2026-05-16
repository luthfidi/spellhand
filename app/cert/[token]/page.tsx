import { notFound } from "next/navigation";
import type { Metadata } from "next";
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
  const cert = await fetchCertificate(token);
  if (!cert) return { title: "Certificate not found" };

  const ogImage = `/cert/${token}/og`;
  const title = `${cert.display_name} · Spellhand Certificate`;
  const description = `${cert.display_name} mastered the American Sign Language alphabet on Spellhand.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
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
