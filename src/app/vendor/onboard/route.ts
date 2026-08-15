import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/config";

/**
 * Inicia (o continúa) el onboarding de Stripe Connect para el vendedor actual.
 * Crea una cuenta Express si no existe y redirige al flujo de Stripe.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${siteUrl}/login?next=/vendor`);
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  if (!vendor) {
    return NextResponse.redirect(`${siteUrl}/vendor?error=no_vendor`);
  }

  let accountId = vendor.stripe_account_id as string | null;

  // Crea la cuenta conectada si aún no existe.
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email ?? undefined,
      metadata: { vendor_id: vendor.id },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;

    await supabase
      .from("vendors")
      .update({ stripe_account_id: accountId })
      .eq("id", vendor.id);
  }

  // Genera el enlace de onboarding.
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${siteUrl}/vendor/onboard`,
    return_url: `${siteUrl}/vendor?onboarded=1`,
    type: "account_onboarding",
  });

  return NextResponse.redirect(accountLink.url);
}
