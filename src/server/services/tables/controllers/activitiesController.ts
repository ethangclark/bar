import {
  EnrollmentType,
  isDesigner,
} from "~/common/schemas/enrollmentTypeUtils";
import { TableController } from "../tableController";

export class ActivitiesController extends TableController<"activities"> {
  constructor() {
    super("activities");
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
