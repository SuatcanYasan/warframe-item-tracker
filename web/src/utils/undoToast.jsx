import toast from "react-hot-toast";

// Show a toast with an Undo button. The undo handler is called when
// the user clicks Undo within `duration` ms. Used for destructive
// actions: clear status, remove item, bulk operations.
//
// Usage:
//   import { showUndoToast } from "../../utils/undoToast";
//   const prev = currentValue;
//   doDestructiveAction();
//   showUndoToast({
//     message: t("undoMasteryCleared"),
//     undoLabel: t("undo"),
//     onUndo: () => restore(prev),
//   });
export function showUndoToast({ message, undoLabel = "Undo", onUndo, duration = 5000 }) {
  return toast(
    (tObj) => {
      const id = tObj.id;
      const handleUndo = () => {
        try { onUndo?.(); } catch (e) { /* swallow — toast must dismiss */ }
        toast.dismiss(id);
      };
      return (
        <div className="undo-toast">
          <span className="undo-toast-msg">{message}</span>
          <button type="button" className="undo-toast-btn" onClick={handleUndo}>
            ↶ {undoLabel}
          </button>
        </div>
      );
    },
    { duration, className: "undo-toast-wrap" },
  );
}
