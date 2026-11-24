import { InfoPage, infoMetadata } from "@/components/info-page";

export const metadata = infoMetadata("contact");

export default function ContactPage() {
  return <InfoPage page="contact" />;
}
