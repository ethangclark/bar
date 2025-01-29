import {
  EnrollmentType,
  isDesigner,
} from "~/common/schemas/enrollmentTypeUtils";
import { TableController } from "../tableController";

export class EvalKeysController extends TableController<"evalKeys"> {
  constructor() {
    super("evalKeys");
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
