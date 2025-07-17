import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/stores/store';
import { setInstructions } from '@/app/stores/dashboardFormSlice';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, Plus, Trash2 } from 'lucide-react';

interface CustomInstructionsProps {
  loading?: boolean;
  isSessionRunning?: boolean;
  sessionInstructions?: string[];
}

export default function CustomInstructions({ loading = false, isSessionRunning = false, sessionInstructions }: CustomInstructionsProps) {
  const instructions = useSelector((state: RootState) => state.dashboardForm.instructions);
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (sessionInstructions && Array.isArray(sessionInstructions) && sessionInstructions.length > 0) {
      dispatch(setInstructions(sessionInstructions));
    }
  }, [sessionInstructions, dispatch]);

  const handleInstructionChange = (idx: number, value: string) => {
    const updated = instructions.map((inst, i) => (i === idx ? value : inst));
    dispatch(setInstructions(updated));
  };

  const handleAddInstruction = () => {
    dispatch(setInstructions([...instructions, '']));
  };

  const handleRemoveInstruction = (idx: number) => {
    const updated = instructions.filter((_, i) => i !== idx);
    dispatch(setInstructions(updated));
  };

  return (
    <div>
      <Label className="flex items-center gap-2 mb-1">
        <FileText className="h-4 w-4" />
        Instructions
      </Label>
      <p className="text-sm text-muted-foreground mb-2">
        These instructions are applied to each page analysis, not to the entire website.
      </p>
      <div className="space-y-3">
        {instructions.map((inst, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <textarea
              value={inst}
              onChange={(e) => handleInstructionChange(idx, e.target.value)}
              placeholder={`Instruction ${idx + 1}`}
              className="flex-1 h-16 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              rows={2}
              disabled={loading || isSessionRunning}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleAddInstruction}
              aria-label="Add instruction"
              disabled={loading || isSessionRunning}
            >
              <Plus className="h-4 w-4" />
            </Button>
            {instructions.length > 1 && (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                onClick={() => handleRemoveInstruction(idx)}
                aria-label="Remove instruction"
                disabled={loading || isSessionRunning}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
