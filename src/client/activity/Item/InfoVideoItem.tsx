import { InfoVideo } from "~/server/db/schema";
import { InfoVideoUpload } from "./InfoVideoUpload";

export function InfoVideoItem({ infoVideo }: { infoVideo: InfoVideo }) {
  return (
    <div className="w-full">
      <InfoVideoUpload infoVideo={infoVideo} />
    </div>
  );
}
