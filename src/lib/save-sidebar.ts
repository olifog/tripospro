import { z } from "zod";

const sidebarStateSchema = z.object({
  open: z.boolean()
});

export const loadSidebarState = () => {
  const sidebarState = localStorage.getItem("sidebarState");
  return sidebarState
    ? sidebarStateSchema.parse(JSON.parse(sidebarState))
    : { open: true };
};

export const saveSidebarState = (state: z.infer<typeof sidebarStateSchema>) => {
  localStorage.setItem("sidebarState", JSON.stringify(state));
};
