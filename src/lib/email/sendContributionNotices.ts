import { render } from "@react-email/components";
import { resend, FROM_EMAIL } from "./resend";
import { ContributionNotice } from "./ContributionNotice";

interface Contributor {
  name: string;
  email: string;
  amount: number;
}

interface SendOptions {
  occasionTitle: string;
  recipientName: string;
  giftTitle: string;
  giftPrice: number;
  buyerName: string;
  bankDetails: string;
  year: number;
  contributors: Contributor[];
}

export async function sendContributionNotices(opts: SendOptions): Promise<void> {
  const {
    occasionTitle,
    recipientName,
    giftTitle,
    giftPrice,
    buyerName,
    bankDetails,
    year,
    contributors,
  } = opts;

  // Fire all emails in parallel; log failures but don't throw —
  // the purchase has already been committed.
  const results = await Promise.allSettled(
    contributors.map(async (contributor) => {
      const html = await render(
        ContributionNotice({
          contributorName: contributor.name,
          recipientName,
          occasionTitle,
          giftTitle,
          giftPrice,
          contributionAmount: contributor.amount,
          buyerName,
          bankDetails,
          year,
        })
      );

      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: contributor.email,
        subject: `Time to split — ${recipientName}'s ${year} gift`,
        html,
      });

      if (error) {
        console.error("[email] Failed to send contribution notice", {
          to: contributor.email,
          from: FROM_EMAIL,
          error,
        });
        throw error;
      }

      console.log("[email] Sent contribution notice", { to: contributor.email, id: data?.id });
    })
  );

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    console.error(`[email] ${failures.length}/${contributors.length} contribution notices failed`);
  }
}
