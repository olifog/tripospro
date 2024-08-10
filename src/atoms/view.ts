import { atom } from "recoil";

export interface View {
  autoSelected: boolean
}

export const viewState = atom<View>({
  key: "view",
  default: {
    autoSelected: false
  },
});
