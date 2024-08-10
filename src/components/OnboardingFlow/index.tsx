
import { getAllTriposes } from "@/queries/tripos";
import { getCurrentUser } from "@/queries/user";
import { ClientOnboarding } from "./ClientOnboarding";

export const OnboardingFlow = async () => {
  const triposes = await getAllTriposes();
  const user = await getCurrentUser();

  return <ClientOnboarding triposes={triposes} user={user} />;
};


