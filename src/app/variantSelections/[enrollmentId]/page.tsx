import { z } from "zod";
import { BigTitlePage } from "../../_components/BigTitlePage";
import { ClientOnly } from "../../_components/ClientOnly";

type Props = {
  params: {
    enrollmentId: string;
  };
};

export default function VariantSelectionPage({ params }: Props) {
  const enrollmentId = z.string().parse(params.enrollmentId);

  console.log({ enrollmentId });

  return (
    <ClientOnly>
      <BigTitlePage>
        <div>Hi</div>
      </BigTitlePage>
    </ClientOnly>
  );
}
