import { InfoPage, infoMetadata } from "@/components/info-page";

export const metadata = infoMetadata("terms");

export default function TermsPage() {
  return <InfoPage page="terms" />;
}
