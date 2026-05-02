import { useState, useMemo } from "react";
import { InputNumber, Segmented } from "antd";
import {
  DeleteOutlined,
  AppstoreOutlined,
  TableOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { AnimatePresence, motion } from "framer-motion";
import EmptyState from "../../shared/EmptyState";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { FALLBACK_ICON, marketUrl, handleImgError } from "../../../utils/helpers";
import { useTranslate } from "../../../hooks/useTranslate";
import type { TranslateFn } from "../../../hooks/useTranslate";
import type { InventoryPart } from "../../../types";

interface PartCardProps {
  part: InventoryPart;
  onUpdateQty: (uniqueName: string, qty: number) => void;
  onRemove: (uniqueName: string) => void;
  multiMode: boolean;
  isSelected: boolean;
  onToggleMulti: (uniqueName: string) => void;
}

function PartCard({ part, onUpdateQty, onRemove, multiMode, isSelected, onToggleMulti }: PartCardProps) {
  const { t } = useTranslate();
  return (
    <motion.div
      className={`item-card ${isSelected ? "multi-selected" : ""}`}
      onClick={multiMode ? () => onToggleMulti(part.uniqueName) : undefined}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      {multiMode && (
        <div className={`item-card-checkbox ${isSelected ? "checked" : ""}`} onClick={(e) => { e.stopPropagation(); onToggleMulti(part.uniqueName); }}>
          {isSelected && <CheckOutlined />}
        </div>
      )}
      <div className="item-card-img">
        <img
          src={part.parentImageUrl || FALLBACK_ICON}
          alt={part.name}
          onError={handleImgError} loading="lazy" decoding="async" />
        <span className="item-card-qty">x{part.quantity}</span>
      </div>
      <div className="item-card-body">
        <div className="item-card-name">{part.name}</div>
        <div className="item-card-type">{part.parentName}</div>
        <div className="item-card-footer">
          <InputNumber
            min={0}
            max={99}
            value={part.quantity}
            size="small"
            style={{ width: 64 }}
            onChange={(v) => onUpdateQty(part.uniqueName, v ?? 0)}
          />
          <div className="item-card-actions">
            <a
              className="item-card-action-btn market-btn"
              href={marketUrl(`${part.parentName} ${part.name}`)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={t("viewOnMarket")}
            >
              <img src="https://wiki.warframe.com/images/Platinum.png" alt="" className="market-plat-icon" loading="lazy" decoding="async" />
            </a>
            <button className="item-card-action-btn" onClick={() => onRemove(part.uniqueName)} title={t("removePart")}>
              <DeleteOutlined />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface PartsTableProps {
  partsList: InventoryPart[];
  onUpdateQty: (uniqueName: string, qty: number) => void;
  onRemove: (uniqueName: string) => void;
  t: TranslateFn;
}

function PartsTable({ partsList, onUpdateQty, onRemove, t }: PartsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<InventoryPart>[]>(
    () => [
      {
        id: "image",
        header: "",
        cell: ({ row }) => (
          <img
            src={row.original.parentImageUrl || FALLBACK_ICON}
            alt={row.original.name}
            width={36}
            height={36}
            style={{ objectFit: "contain" }}
            onError={handleImgError} loading="lazy" decoding="async" />
        ),
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: t("addPart"),
        cell: ({ row }) => row.original.name,
      },
      {
        accessorKey: "parentName",
        header: "Prime",
        cell: ({ row }) => row.original.parentName,
      },
      {
        accessorKey: "quantity",
        header: t("partQuantity"),
        cell: ({ row }) => (
          <InputNumber
            min={0}
            max={99}
            size="small"
            style={{ width: 72 }}
            value={row.original.quantity}
            onChange={(v) => onUpdateQty(row.original.uniqueName, v ?? 0)}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div style={{ display: "flex", gap: 4 }}>
            <a
              className="item-card-action-btn market-btn"
              href={marketUrl(`${row.original.parentName} ${row.original.name}`)}
              target="_blank"
              rel="noopener noreferrer"
              title={t("viewOnMarket")}
            >
              <img src="https://wiki.warframe.com/images/Platinum.png" alt="" className="market-plat-icon" loading="lazy" decoding="async" />
            </a>
            <button
              className="item-card-action-btn danger"
              onClick={() => onRemove(row.original.uniqueName)}
              title={t("removePart")}
            >
              <DeleteOutlined />
            </button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [t, onUpdateQty, onRemove],
  );

  const table = useReactTable({
    data: partsList,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="vault-table-wrapper">
      <table className="vault-table">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortDir = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    className={canSort ? "sortable" : ""}
                  >
                    <span className="vault-th-inner">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort && (
                        <span className="vault-th-sort">
                          {sortDir === "asc" && <CaretUpOutlined />}
                          {sortDir === "desc" && <CaretDownOutlined />}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface Props {
  partsList: InventoryPart[];
  onUpdateQty: (uniqueName: string, qty: number) => void;
  onRemove: (uniqueName: string) => void;
  multiMode: boolean;
  multiIds?: Set<string>;
  onToggleMulti: (uniqueName: string) => void;
  onOpenAddDrawer: () => void;
}

export default function PartsTab({ partsList, onUpdateQty, onRemove, multiMode, multiIds, onToggleMulti, onOpenAddDrawer }: Props) {
  const { t } = useTranslate();
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  if (partsList.length === 0) {
    return (
      <EmptyState
        icon="inventory"
        title={t("emptyInventoryTitle")}
        description={t("emptyInventoryDesc")}
        ctaLabel={t("emptyInventoryCta")}
        onCta={onOpenAddDrawer}
      />
    );
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <Segmented
          size="small"
          value={viewMode}
          onChange={(v) => setViewMode(v as "card" | "table")}
          options={[
            { value: "card", icon: <AppstoreOutlined /> },
            { value: "table", icon: <TableOutlined /> },
          ]}
        />
      </div>

      {viewMode === "card" ? (
        <div className="item-card-grid">
          <AnimatePresence mode="popLayout">
            {partsList.map((part) => (
              <PartCard
                key={part.uniqueName}
                part={part}
                onUpdateQty={onUpdateQty}
                onRemove={onRemove}
                multiMode={multiMode}
                isSelected={multiIds?.has(part.uniqueName) ?? false}
                onToggleMulti={onToggleMulti}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <PartsTable
          partsList={partsList}
          onUpdateQty={onUpdateQty}
          onRemove={onRemove}
          t={t}
        />
      )}
    </>
  );
}
