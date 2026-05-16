import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { Nando } from "./nando";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={60}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="BusinessStats"
        component={Nando}
        durationInFrames={300}
        fps={60}
        width={2560}
        height={1440}
      />
    </>
  );
};
