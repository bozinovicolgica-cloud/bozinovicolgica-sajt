import { LandingPage } from "@/components/protokol/LandingPage";

// Varijanta A. Posetioci ne dolaze direktno ovde: middleware ih sa "/" interno prebacuje.
export default function Page() {
  return <LandingPage variant="a" />;
}
