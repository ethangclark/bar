import {
  type Course,
  type CourseType,
  type Module,
  type Topic,
  type Unit,
} from "~/server/db/schema";

export function Topic({
  course,
  courseType,
  unit,
  module,
  topic,
}: {
  course: Course;
  courseType: CourseType;
  unit: Unit;
  module: Module;
  topic: Topic;
}) {
  return (
    <div>
      <h1>{courseType.name}</h1>
      <h2>{course.id}</h2>
      <h3>{unit.name}</h3>
      <h4>{module.name}</h4>
      <h5>{topic.name}</h5>
    </div>
  );
}
