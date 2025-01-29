import {
  EnrollmentType,
  isDesigner,
} from "~/common/schemas/enrollmentTypeUtils";
import { TableController } from "../tableController";

export class InfoTextsController extends TableController<"infoTexts"> {
  constructor() {
    super("infoTexts");
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
