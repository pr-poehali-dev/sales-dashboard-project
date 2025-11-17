import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { BlueprintFile } from "@/types/production";

interface BlueprintsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blueprints: BlueprintFile[];
  partName: string;
}

export const BlueprintsDialog = ({ open, onOpenChange, blueprints, partName }: BlueprintsDialogProps) => {
  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return 'FileText';
    return 'Box';
  };

  const getFileColor = (type: string) => {
    if (type.includes('pdf')) return 'text-red-600';
    return 'text-blue-600';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Files" size={20} />
            Файлы чертежей: {partName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {blueprints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Icon name="FileX" size={48} className="text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Нет прикреплённых файлов</p>
            </div>
          ) : (
            blueprints.map((file, index) => (
              <div key={index} className="flex items-center justify-between gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Icon name={getFileIcon(file.type)} size={24} className={`${getFileColor(file.type)} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.type.split('/').pop()?.toUpperCase() || 'Файл'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => window.open(file.url, '_blank')}
                  size="sm"
                  className="flex-shrink-0"
                >
                  <Icon name="Download" size={16} className="mr-2" />
                  Открыть
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
