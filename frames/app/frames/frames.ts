import { createFrames } from "frames.js/next";

type State = {
  address: string;
  pool: number;
};

export const frames = createFrames<State>({
  basePath: "/frames",
  initialState: { address: "", pool: 0 },
});
