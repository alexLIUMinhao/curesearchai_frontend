import { Button } from '../common/Button';

type WorkflowActionsMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
};

export function WorkflowActionsMenu({ onEdit, onDelete }: WorkflowActionsMenuProps) {
  return (
    <div className="flex gap-2">
      <Button variant="ghost" onClick={onEdit}>
        Edit
      </Button>
      <Button variant="ghost" className="text-danger hover:bg-red-50" onClick={onDelete}>
        Delete
      </Button>
    </div>
  );
}
