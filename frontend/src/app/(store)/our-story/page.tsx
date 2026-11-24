import { InfoPage, infoMetadata } from "@/components/info-page";

export const metadata = infoMetadata("our-story");

export default function OurStoryPage() {
  return <InfoPage page="our-story" />;
}
