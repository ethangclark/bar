import {
  EnrollmentType,
  isDesigner,
} from "~/common/schemas/enrollmentTypeUtils";
import { TableController } from "../tableController";

export class ActivityItemsController extends TableController<"activityItems"> {
  constructor() {
    super("activityItems");
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
