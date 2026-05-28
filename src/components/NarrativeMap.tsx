import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, PanelLeft } from "lucide-react";
import { PanelHeader } from "./PanelHeader";
import type { StoryNode } from "../types";

interface NarrativeMapProps {
  nodes: StoryNode[];
  activeNodeId: string;
  onSelectNode: (nodeId: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function NarrativeMap({ nodes, activeNodeId, onSelectNode, onDragEnd }: NarrativeMapProps) {
  return (
    <aside className="narrative-panel">
      <PanelHeader icon={<PanelLeft size={17} />} title="Narrative Map" subtitle="线性叙事节点" />
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={nodes.map((node) => node.id)} strategy={verticalListSortingStrategy}>
          <div className="node-list">
            {nodes.map((node, index) => (
              <SortableNode
                key={node.id}
                index={index}
                node={node}
                active={node.id === activeNodeId}
                onSelect={() => onSelectNode(node.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </aside>
  );
}

interface SortableNodeProps {
  node: StoryNode;
  index: number;
  active: boolean;
  onSelect: () => void;
}

function SortableNode({ node, index, active, onSelect }: SortableNodeProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      className={`story-node ${active ? "active" : ""} ${isDragging ? "dragging" : ""}`}
      onClick={onSelect}
      type="button"
    >
      <span className="drag-handle" {...attributes} {...listeners} aria-label="拖动节点">
        <GripVertical size={15} />
      </span>
      <span className="node-index">{String(index + 1).padStart(2, "0")}</span>
      <span className="node-main">
        <strong>{node.title}</strong>
        <small>{node.intent}</small>
      </span>
      <span className="node-side">
        <em>{node.role}</em>
        <small>{node.duration}</small>
      </span>
    </button>
  );
}
