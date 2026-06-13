"use client";
import { useActionState } from "react";
import { rollbackSnapshotAction } from "../../../actions";
import { EMPTY_ROLLBACK_STATE } from "../../../action-types";

export function RollbackButton({ snapshotId }: { snapshotId: number }) {
  const [state, formAction, pending] = useActionState(
    rollbackSnapshotAction,
    EMPTY_ROLLBACK_STATE,
  );
  return (
    <form
      action={formAction}
      data-testid="snapshot-rollback-form"
      onSubmit={(e) => {
        if (
          !confirm(
            "Roll back this snapshot? A new rollback snapshot will be recorded.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="snapshot_id" value={snapshotId} />
      <button
        type="submit"
        disabled={pending}
        data-testid="snapshot-rollback"
        className="rounded border border-amber-400 px-4 py-2 text-amber-700 disabled:opacity-50"
      >
        {pending ? "Rolling back…" : "Roll back this snapshot"}
      </button>
      {state && !state.ok && state.error ? (
        <p
          data-testid="snapshot-rollback-error"
          className="mt-2 text-sm text-red-300"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
