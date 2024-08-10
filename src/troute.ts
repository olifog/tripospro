import { createTroute } from "@olifog/troute";
import { getAllTriposes } from "./queries/tripos";
import { getTriposParts } from "./queries/triposPart";

export const { GET, troute } = createTroute({
  getAllTriposes,
  getTriposParts,
});
