import { Button } from "antd";
import { useState } from "react";

export function ConnectToCanvas() {
  const [engaged, setEngaged] = useState(false);

  if (engaged) {
    return (
      <div>
        <div>
          <div>
            TODO: Connect to Canvas (generalize existing login components)
          </div>
        </div>
      </div>
    );
  }

  return <Button onClick={() => setEngaged(true)}>Connect to Canvas</Button>;
}
