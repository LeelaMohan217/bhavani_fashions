import { InfoPage, infoMetadata } from "@/components/info-page";

export const metadata = infoMetadata("privacy");

export default function PrivacyPage() {
  return <InfoPage page="privacy" />;
}
