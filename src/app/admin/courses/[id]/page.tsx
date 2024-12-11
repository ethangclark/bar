"use client";
import { Spin, Tree } from "antd";
import { z } from "zod";
import { useCourseTreeData } from "~/app/enrollment/[id]/useCourseTreeData";
import { useTreeProps } from "~/app/enrollment/[id]/useTreeProps";
import { api } from "~/trpc/react";
import { ClientOnly } from "~/app/_components/ClientOnly";
import { Page } from "~/app/_components/Page";
import { Title } from "~/app/_components/Title";

type Props = {
  params: {
    id: string;
  };
};

export default function AdminCoursePage({ params }: Props) {
  const courseId = z.string().parse(params.id);

  const { isLoading, data: course } = api.course.courseDetail.useQuery({
    courseId,
  });
  const variantTypes = api.variants.types.useQuery({
    courseTypeId: course?.courseType.id ?? null,
  });

  const {
    treeData,
    setSelectedTopicId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    selectedTopicContext: _,
  } = useCourseTreeData({
    course: course ?? null,
    tutoringSessions: [],
    isLoading,
  });

  const treeProps = useTreeProps({
    treeData,
    selectedId: null,
    setSelectedId: setSelectedTopicId,
    courseId,
  });

  if (isLoading) {
    return <Spin />;
  }
  return (
    <Page>
      <Title>Admin - course</Title>
      <ClientOnly>
        <div className="flex">
          <div className="mr-8">
            <Tree {...treeProps} />
          </div>
          <div className="border p-10">
            <div className="mb-5 text-xl">Variants:</div>
            {variantTypes.data?.map((vt) => (
              <div key={vt.id}>
                <h2>{vt.name}</h2>
                {vt.options.map((o) => (
                  <div key={o.id}>{o.value}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </ClientOnly>
    </Page>
  );
}
