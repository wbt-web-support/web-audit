import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/stores/store';
import { setInstructions } from '@/app/stores/dashboardFormSlice';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';

interface CustomInstructionsProps {
  loading?: boolean;
  isProjectRunning?: boolean;
  projectInstructions?: string[];
}

export default function CustomInstructions({ loading = false, isProjectRunning = false, projectInstructions }: CustomInstructionsProps) {
  const instructions = useSelector((state: RootState) => state.dashboardForm.instructions);
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (projectInstructions && Array.isArray(projectInstructions) && projectInstructions.length > 0) {
      dispatch(setInstructions(projectInstructions));
    }
  }, [projectInstructions, dispatch]);

  const handleInstructionChange = (value: string) => {
    dispatch(setInstructions([value]));
  };

  return (
    <div>
      <Label className="flex items-center gap-2 mb-1">
        <FileText className="h-4 w-4" />
        Instructions
      </Label>
      <p className="text-sm text-muted-foreground mb-2">
        These instructions are applied to each page analysis.
      </p>
      <div className="space-y-3">
        <textarea
          value={instructions[0] || ''}
          onChange={(e) => handleInstructionChange(e.target.value)}
          placeholder="Enter your custom instructions here..."
          className="w-full h-16 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          rows={2}
          disabled={loading || isProjectRunning}
        />
      </div>
    </div>
  );
}
