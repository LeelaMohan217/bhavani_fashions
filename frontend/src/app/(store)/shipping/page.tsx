import { InfoPage, infoMetadata } from "@/components/info-page";

export const metadata = infoMetadata("shipping");

export default function ShippingPage() {
  return <InfoPage page="shipping" />;
}
