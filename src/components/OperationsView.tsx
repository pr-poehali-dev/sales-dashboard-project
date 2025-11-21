import { ProductionOperation } from "@/types/production";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";

interface OperationsViewProps {
  operations: ProductionOperation[];
  machines: string[];
}

export const OperationsView = ({ operations, machines }: OperationsViewProps) => {
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

  return (
    <div className="space-y-2 py-2">
      {operations.map((op) => (
        <div key={op.id} className="flex items-center gap-2 text-xs bg-muted/30 rounded p-2">
          <Badge variant="outline" className="bg-background text-foreground shrink-0">
            {op.operationNumber}
          </Badge>
          <span className="font-medium flex-1 min-w-0 truncate">{op.operationName}</span>
          <Badge variant="outline" className={`${getMachineColor(op.machine)} shrink-0`}>
            {op.machine}
          </Badge>
          <span className="text-muted-foreground shrink-0">
            <Icon name="Clock" size={12} className="inline mr-1" />
            {op.timePerPart}м
          </span>
        </div>
      ))}
    </div>
  );
};
