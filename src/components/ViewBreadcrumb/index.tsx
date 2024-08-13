import { getAllTriposes } from "@/queries/tripos";
import { ClientViewBreadcrumb } from "./ClientViewBreadcrumb";

export const ViewBreadcrumb = async () => {
  const triposes = await getAllTriposes();

  return <ClientViewBreadcrumb triposes={triposes} />;
};
