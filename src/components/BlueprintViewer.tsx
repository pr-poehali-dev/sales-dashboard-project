import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BlueprintViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blueprintUrl?: string;
}

export const BlueprintViewer = ({ open, onOpenChange, blueprintUrl }: BlueprintViewerProps) => {
  if (!blueprintUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Просмотр чертежа</DialogTitle>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 h-full">
          <iframe
            src={blueprintUrl}
            className="w-full h-full border rounded-lg"
            title="PDF Viewer"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
