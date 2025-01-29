import { EnrollmentType } from "~/common/schemas/enrollmentTypeUtils";
import { TableController } from "../tableController";

export class QuestionsController extends TableController<"questions"> {
  constructor() {
    super("questions");
  }
  canRead(enrolledAs: EnrollmentType[]): boolean {
    return true;
  }
  canEdit(enrolledAs: EnrollmentType[]): boolean {
    return true;
  }
}
