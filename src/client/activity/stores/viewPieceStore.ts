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
    const vpis = this.descendentStore.get("viewPieceImages");
    const vpts = this.descendentStore.get("viewPieceTexts");
    const infoImages = this.descendentStore.get("infoImages");
    const infoTexts = this.descendentStore.get("infoTexts");

    if (
      viewPieces instanceof Status ||
      vpis instanceof Status ||
      vpts instanceof Status ||
      infoImages instanceof Status ||
      infoTexts instanceof Status
    ) {
      return null;
    }
    const children: ViewPieceChildren = [];
    const matchingVps = viewPieces
      .filter((vp) => vp.messageId === messageId)
      .sort((a, b) => a.order - b.order);
    for (const vp of matchingVps) {
      vpis
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
      vpts
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
