"use client";
import { DownOutlined } from "@ant-design/icons";
import { type TreeDataNode } from "antd";
import { z } from "zod";

export function useTreeProps({
  treeData,
  selectedId,
  setSelectedId,
}: {
  treeData: TreeDataNode[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
}) {
  return {
    switcherIcon: <DownOutlined />,
    treeData,
    selectedKeys: selectedId ? [selectedId] : [],
    onSelect: ([rawKey, ...rest]: React.Key[]) => {
      if (!rawKey || rest.length > 0) {
        return;
      }
      const key = z.string().parse(rawKey);
      setSelectedId(key);
    },
  };
}
