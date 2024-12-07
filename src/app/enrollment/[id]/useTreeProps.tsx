"use client";
import { DownOutlined } from "@ant-design/icons";
import { type TreeDataNode } from "antd";
import { z } from "zod";

export function useTreeProps({
  treeData,
  selectedId,
  setSelectedId,
  courseId,
}: {
  treeData: TreeDataNode[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  courseId: string | null;
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
    defaultExpandedKeys: courseId ? [courseId] : [], // we want the root course node expanded
  };
}
