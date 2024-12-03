import { type TopicContext } from "~/server/db/schema";

export function Topic({ topicContext }: { topicContext: TopicContext }) {
  const { course, courseType, unit, module, topic } = topicContext;
  return (
    <div className="h-full w-full p-8" style={{ width: 672 }}>
      <div className="outline-3 h-full w-full rounded-3xl p-8 outline outline-gray-200">
        <h1>{courseType.name}</h1>
        <h2>{course.id}</h2>
        <h3>{unit.name}</h3>
        <h4>{module.name}</h4>
        <h5>{topic.name}</h5>
      </div>
    </div>
  );
}
