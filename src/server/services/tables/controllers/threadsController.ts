import { EnrollmentType } from "~/common/schemas/enrollmentTypeUtils";
import { TableController } from "../tableController";

export class ThreadsController extends TableController<"threads"> {
  constructor() {
    super("threads");
  }
  canRead(enrolledAs: EnrollmentType[]): boolean {
    return true;
  }
  canEdit(enrolledAs: EnrollmentType[]): boolean {
    return true;
  }
}
