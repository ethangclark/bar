import { Button, Input } from "antd";
import { useCallback, useState } from "react";
import { api } from "~/trpc/react";

export function CreateIntegration({
  subdomain,
  onCreated,
}: {
  subdomain: string;
  onCreated: () => void;
}) {
  const [clientId, setClientId] = useState("");
  const [clientKey, setClientKey] = useState("");
  const { mutateAsync: createIntegration } =
    api.integration.createCanvasIntegration.useMutation();
  const doTheThing = useCallback(() => {
    void createIntegration({
      clientId,
      clientSecret: clientKey,
      subdomain,
    }).then(() => {
      onCreated();
    });
  }, [clientId, clientKey, createIntegration, onCreated, subdomain]);
  return (
    <div>
      Integration not configured. Enter your client ID and key (sometimes
      referred to as secret) below. (If you don't know what these are, contact
      us for help.)
      <Input
        placeholder="Client ID"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
      />
      <Input
        placeholder="Client Key"
        value={clientKey}
        onChange={(e) => setClientKey(e.target.value)}
      />
      <Button onClick={doTheThing}>Create Integration</Button>
    </div>
  );
}
