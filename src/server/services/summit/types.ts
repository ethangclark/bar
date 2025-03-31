import {
  type ViewPiece,
  type ViewPieceImage,
  type ViewPieceText,
  type ViewPieceVideo,
} from "~/server/db/schema";

export type ViewPieceInjection =
  | {
      type: "image";
      viewPiece: ViewPiece;
      data: ViewPieceImage;
    }
  | {
      type: "video";
      viewPiece: ViewPiece;
      data: ViewPieceVideo;
    }
  | {
      type: "text";
      viewPiece: ViewPiece;
      data: ViewPieceText;
    };
