import { motion, AnimatePresence } from "framer-motion";
import { DeleteOutlined, HolderOutlined } from "@ant-design/icons";
import { Empty, Typography } from "antd";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FALLBACK_ICON } from "../../utils/helpers";
import DropInfoPopover from "../relic/DropInfoPopover";
import { useTranslate } from "../../hooks/useTranslate";
import { useRelativeTime } from "../../hooks/useRelativeTime";
import { useCraftStore } from "../../stores/craftStore";

const { Text } = Typography;

function AddedAtLabel({ timestamp }) {
  const relative = useRelativeTime(timestamp);
  if (!relative) return null;
  return (
    <div
      className="item-card-added-at"
      style={{ fontSize: 11, color: "var(--wf-text-muted)", marginTop: 2 }}
    >
      {relative}
    </div>
  );
}

function SortableItemCard({ item, index, enrichedByItem, onOpenDetail, onRemoveItem, t, tin, sortingDisabled }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.uniqueName, disabled: sortingDisabled });

  const reqs = enrichedByItem.get(item.uniqueName) || [];
  const total = reqs.length;
  const done = reqs.filter((r) => r.isDone).length;
  const allDone = total > 0 && done === total;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`item-card ${allDone ? "done" : ""} ${isDragging ? "dragging" : ""}`}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      onClick={() => onOpenDetail(item)}
    >
      {!sortingDisabled && (
        <button
          type="button"
          className="item-card-drag-handle"
          onClick={(e) => e.stopPropagation()}
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <HolderOutlined />
        </button>
      )}
      <div className="item-card-img">
                <img
                  src={item.imageUrl || FALLBACK_ICON}
                  alt={item.name}
                  onError={(e) => { e.target.src = FALLBACK_ICON; }}
                />
                <span className="item-card-qty">x{item.quantity}</span>
                {allDone && <span className="item-card-done-badge">{t("completeTag")}</span>}
              </div>
              <div className="item-card-body">
                <div className="item-card-name">{tin(item.uniqueName, item.name)}</div>
                <div className="item-card-type">
                  {item.type || item.category || t("unknown")}
                </div>
                <AddedAtLabel timestamp={item.addedAt} />
                <div className="item-card-progress-bar">
                  <div
                    className={`item-card-progress-fill ${allDone ? "green" : "cyan"}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="item-card-footer">
                  <span className={`item-card-progress-text ${allDone ? "done" : ""}`}>
                    {done} / {total}
                  </span>
                  <div className="item-card-actions" onClick={(e) => e.stopPropagation()}>
                    <DropInfoPopover uniqueName={item.uniqueName} itemName={item.name} t={t} />
                    <button
                      className="item-card-action-btn danger"
                      onClick={(e) => { e.stopPropagation(); onRemoveItem(item); }}
                      title={t("remove")}
                    >
                      <DeleteOutlined />
                    </button>
                  </div>
                </div>
              </div>
    </motion.div>
  );
}

export default function ItemCardGrid({ items, enrichedByItem, onOpenDetail, onRemoveItem }) {
  const { t, tin } = useTranslate();
  const selectedSearch = useCraftStore((s) => s.selectedSearch);
  const selectedFilter = useCraftStore((s) => s.selectedFilter);
  const selectedCategory = useCraftStore((s) => s.selectedCategory);
  const reorderItems = useCraftStore((s) => s.reorderItems);

  const sortingDisabled =
    Boolean(selectedSearch) ||
    selectedFilter !== "all" ||
    selectedCategory !== "all";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const storeItems = useCraftStore.getState().selectedItems;
    const oldIndex = storeItems.findIndex((i) => i.uniqueName === active.id);
    const newIndex = storeItems.findIndex((i) => i.uniqueName === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    reorderItems(oldIndex, newIndex);
  }

  if (items.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary">{t("noSelected")}</Text>} />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.uniqueName)}
        strategy={rectSortingStrategy}
      >
        <div className="item-card-grid">
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <SortableItemCard
                key={item.uniqueName}
                item={item}
                index={index}
                enrichedByItem={enrichedByItem}
                onOpenDetail={onOpenDetail}
                onRemoveItem={onRemoveItem}
                t={t}
                tin={tin}
                sortingDisabled={sortingDisabled}
              />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  );
}
