import { ProductionOperation } from "@/types/production";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";

interface OperationsViewProps {
  operations: ProductionOperation[];
  machines: string[];
  plannedQuantity: number;
  onUpdateOperationActual?: (operationId: string, actualQuantity: number) => void;
  readOnly?: boolean;
}

export const OperationsView = ({ 
  operations, 
  machines, 
  plannedQuantity,
  onUpdateOperationActual,
  readOnly = false 
}: OperationsViewProps) => {
  const colorClasses = [
    "bg-purple-100 text-purple-700 border-purple-200",
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-teal-100 text-teal-700 border-teal-200",
    "bg-orange-100 text-orange-700 border-orange-200",
    "bg-pink-100 text-pink-700 border-pink-200",
    "bg-indigo-100 text-indigo-700 border-indigo-200",
  ];

  const getMachineColor = (machine: string) => {
    const index = machines.indexOf(machine);
    return index >= 0 ? colorClasses[index % colorClasses.length] : "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 80) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const calculateCompletion = (op: ProductionOperation) => {
    if (plannedQuantity === 0) return 0;
    const actual = op.actualQuantity || 0;
    return Math.round((actual / plannedQuantity) * 100);
  };

  return (
    <div className="space-y-2 py-2">
      {operations.map((op) => {
        const completion = calculateCompletion(op);
        const actual = op.actualQuantity || 0;
        
        return (
          <div key={op.id} className="bg-muted/30 rounded p-3 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Badge variant="outline" className="bg-background text-foreground shrink-0">
                  {op.operationNumber}
                </Badge>
                <span className="font-medium flex-1 min-w-0 truncate">{op.operationName}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <Badge variant="outline" className={`${getMachineColor(op.machine)} shrink-0 text-[10px] sm:text-xs`}>
                  {op.machine}
                </Badge>
                <span className="text-muted-foreground shrink-0 text-[10px] sm:text-xs">
                  <Icon name="Clock" size={12} className="inline mr-1" />
                  {op.timePerPart}м
                </span>
              </div>
            </div>

            {!readOnly && onUpdateOperationActual && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateOperationActual(op.id, Math.max(0, actual - 1))}
                    className="h-7 w-7 p-0 text-sm font-bold"
                  >
                    −
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    max={plannedQuantity}
                    value={actual}
                    onChange={(e) => onUpdateOperationActual(op.id, parseInt(e.target.value) || 0)}
                    className="w-16 h-7 text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateOperationActual(op.id, Math.min(plannedQuantity, actual + 1))}
                    className="h-7 w-7 p-0 text-sm font-bold"
                  >
                    +
                  </Button>
                  <span className="text-xs text-muted-foreground ml-1">/ {plannedQuantity}</span>
                </div>

                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden min-w-0">
                    <div 
                      className={`h-full transition-all ${getCompletionColor(completion)}`}
                      style={{ width: `${Math.min(completion, 100)}%` }}
                    />
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${completion >= 100 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-muted text-muted-foreground'} text-[10px] shrink-0`}
                  >
                    {completion}%
                  </Badge>
                </div>
              </div>
            )}

            {readOnly && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Выполнено: {actual} / {plannedQuantity}</span>
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all ${getCompletionColor(completion)}`}
                    style={{ width: `${Math.min(completion, 100)}%` }}
                  />
                </div>
                <Badge 
                  variant="outline" 
                  className={`${completion >= 100 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-muted text-muted-foreground'} text-[10px]`}
                >
                  {completion}%
                </Badge>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};