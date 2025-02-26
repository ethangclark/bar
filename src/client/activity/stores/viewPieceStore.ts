import { makeAutoObservable } from "mobx";
import { Status } from "~/client/utils/status";
import { type DescendentStore } from "./descendentStore";

type ViewPieceChildren = Array<
  | {
      type: "image";
      url: string;
      textAlternative: string;
      key: string;
    }
  | {
      type: "video";
      videoId: string;
      textAlternative: string;
      key: string;
    }
  | {
      type: "text";
      content: string;
      key: string;
    }
>;

export class ViewPieceStore {
  constructor(private descendentStore: DescendentStore) {
    makeAutoObservable(this);
  }

  // this could be highly optimized using indices managed by the constructor
  // (might need to figure out some client-side notion of change subscription
  // abstracted from the trpc subscription to do this most efficiently --
  // maybe breaking out another store which manages all of that vs. doing it
  // all in descendentStore)
  viewPieceChildren(messageId: string): ViewPieceChildren | null {
    const viewPieces = this.descendentStore.get("viewPieces");
    const vpImages = this.descendentStore.get("viewPieceImages");
    const vpTexts = this.descendentStore.get("viewPieceTexts");
    const vpVideos = this.descendentStore.get("viewPieceVideos");
    const infoImages = this.descendentStore.get("infoImages");
    const infoVideos = this.descendentStore.get("infoVideos");
    const infoTexts = this.descendentStore.get("infoTexts");

    if (
      viewPieces instanceof Status ||
      vpImages instanceof Status ||
      vpTexts instanceof Status ||
      vpVideos instanceof Status ||
      infoImages instanceof Status ||
      infoVideos instanceof Status ||
      infoTexts instanceof Status
    ) {
      return null;
    }
    const children: ViewPieceChildren = [];
    const matchingVps = viewPieces
      .filter((vp) => vp.messageId === messageId)
      .sort((a, b) => a.order - b.order);
    for (const vp of matchingVps) {
      vpImages
        .filter((vpi) => vpi.viewPieceId === vp.id)
        .forEach((vpi) => {
          const ii = infoImages.find((ii) => ii.id === vpi.infoImageId);
          if (!ii) {
            return;
          }
          children.push({
            type: "image",
            url: ii.url,
            textAlternative: ii.textAlternative,
            key: vp.id,
          });
        });
      vpVideos
        .filter((vpv) => vpv.viewPieceId === vp.id)
        .forEach((vpv) => {
          const iv = infoVideos.find((iv) => iv.id === vpv.infoVideoId);
          if (!iv) {
            return;
          }
          children.push({
            type: "video",
            videoId: iv.videoId,
            textAlternative: iv.textAlternative,
            key: vp.id,
          });
        });
      vpTexts
        .filter((vpt) => vpt.viewPieceId === vp.id)
        .forEach((vpt) => {
          children.push({
            type: "text",
            content: vpt.content,
            key: vp.id,
          });
        });
    }
    return children.length > 0 ? children : null;
  }
}
