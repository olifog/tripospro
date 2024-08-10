import { getAllTriposes } from "@/queries/tripos";
import { getCurrentUser } from "@/queries/user";
import { ClientViewSelector } from "./ClientViewSelector";

export const ViewSelector = async () => {
  const triposes = await getAllTriposes();
  const user = await getCurrentUser();

  return <ClientViewSelector triposes={triposes} user={user} />;
};

