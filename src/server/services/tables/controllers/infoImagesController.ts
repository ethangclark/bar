import {
  EnrollmentType,
  isDesigner,
} from "~/common/schemas/enrollmentTypeUtils";
import { TableController } from "../tableController";

export class InfoImagesController extends TableController<"infoImages"> {
  constructor() {
    super("infoImages");
  }
  canCreate(enrolledAs: EnrollmentType[]): boolean {
    return isDesigner(enrolledAs);
  }
  canRead(enrolledAs: EnrollmentType[]): boolean {
    return true;
  }
  canEdit(enrolledAs: EnrollmentType[]): boolean {
    return isDesigner(enrolledAs);
  }
}
