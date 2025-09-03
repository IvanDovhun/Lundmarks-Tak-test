// Define this component at the top of your AdminDashboard.tsx file,
// or in a separate file and import it.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Eye, EyeOff } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React from "react"; // Import React if not already implicitly available
import { TrashIcon, ArrowUpCircleIcon, ArrowDownCircleIcon } from "@/icons/svg.tsx";

// Generic type for items, assuming they have an id and optionally sortOrder
type ItemWithId = { id: string | number; [key: string]: any; };
type ItemWithSortOrder = ItemWithId & { sortOrder: number };

export interface ColumnConfig<T extends ItemWithId> {
  header: string;
  accessorKey?: keyof T; // For simple data display
  renderCell?: (item: T) => React.ReactNode; // Custom cell rendering, overrides accessorKey for display

  // For inline editing
  isEditable?: boolean;
  editableFieldKey?: keyof T; // The item's key to update.
  inputType?: 'text' | 'number';
}

interface AdminSectionCardProps<T extends ItemWithId> {
  title: string;
  items: T[] | undefined;
  columns: Array<ColumnConfig<T>>;

  // Optional "Add" functionality
  addButtonText?: string;
  onAddClick?: () => void;

  // Optional item operations
  onUpdateItem?: (item: T, fieldKey: keyof T, newValue: string | number) => void;
  onDeleteItem?: (item: T) => void; // Parent handles confirmation/mutation
  onMoveSortOrder?: (itemType: 'roof' | 'material' | 'scaffolding' | 'chimney', item: T & ItemWithSortOrder, direction: 'up' | 'down') => void;
  itemTypeForSorting?: 'roof' | 'material' | 'scaffolding' | 'chimney'; // Required if onMoveSortOrder is used

  sortingColumnHeaderText?: string;
  actionColumnHeaderText?: string;
  customActionsHeaderText?: string;
  renderCustomActions?: (item: T) => React.ReactNode; // For actions beyond a standard delete button
  isLoading?: boolean; // Optional: To show a loading state, e.g., disable buttons
}

export function AdminSectionCard<T extends ItemWithId>({
  title,
  items,
  columns,
  addButtonText,
  onAddClick,
  onUpdateItem,
  onDeleteItem,
  onMoveSortOrder,
  itemTypeForSorting,
  sortingColumnHeaderText = "Sortering",
  actionColumnHeaderText = "Åtgärder",
  customActionsHeaderText,
  renderCustomActions,
  isLoading,
}: AdminSectionCardProps<T>) {
  const showActionColumn = onDeleteItem || onMoveSortOrder || renderCustomActions;

  return (
    <Card className="admin-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{title}</CardTitle>
        {onAddClick && addButtonText && (
          <Button onClick={onAddClick} size="sm" disabled={isLoading} className="admin-generic-add">
            <PlusCircle className="h-4 w-4" />
            {addButtonText}
          </Button>
        )}
      </CardHeader>
      <CardContent className="admin-table">
        <AdminSectionTable 
          title={title}
          items={items}
          columns={columns}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          onMoveSortOrder={onMoveSortOrder}
          itemTypeForSorting={itemTypeForSorting}
          sortingColumnHeaderText={sortingColumnHeaderText}
          actionColumnHeaderText={actionColumnHeaderText}
          customActionsHeaderText={customActionsHeaderText}
          renderCustomActions={renderCustomActions}
          isLoading={isLoading}>
        </AdminSectionTable>
        
        {items && items.length === 0 && (
          <p className="py-4 text-center text-muted-foreground">Inga objekt att visa.</p>
        )}
         {isLoading && !items && (
          <p className="py-4 text-center text-muted-foreground">Laddar data...</p>
        )}
      </CardContent>
    </Card>
  );
}


export function AdminSectionTable<T extends ItemWithId>({
  items,
  columns,
  onUpdateItem,
  onDeleteItem,
  onMoveSortOrder,
  itemTypeForSorting,
  sortingColumnHeaderText = "Sortering",
  actionColumnHeaderText = "Åtgärder",
  customActionsHeaderText,
  renderCustomActions,
  isLoading,
}: AdminSectionCardProps<T>) {
  const showActionColumn = onDeleteItem || onMoveSortOrder || renderCustomActions;
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.header} className="admin-table-header">{col.header}</TableHead>
          ))}
          {onMoveSortOrder && itemTypeForSorting && <TableHead className="admin-table-header">{sortingColumnHeaderText}</TableHead>}
          {customActionsHeaderText && <TableHead className="admin-table-header">{customActionsHeaderText}</TableHead>}
          {showActionColumn && <TableHead className="admin-table-header">{actionColumnHeaderText}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items?.map((item) => (
          <TableRow key={item.id}>
            {columns.map((col) => (
              <TableCell key={`${item.id}-${col.header}`}>
                {col.isEditable && col.editableFieldKey && onUpdateItem ? (
                  <Input
                    defaultValue={item[col.editableFieldKey] as string | number}
                    type={col.inputType || 'text'}
                    onBlur={(e) => {
                      const value = col.inputType === 'number' ? Number(e.target.value) : e.target.value;
                      onUpdateItem(item, col.editableFieldKey!, value);
                    }}
                    disabled={isLoading}
                  />
                ) : col.renderCell ? (
                  col.renderCell(item)
                ) : col.accessorKey ? (
                  String(item[col.accessorKey] ?? '')
                ) : null}
              </TableCell>
            ))}
            {showActionColumn && (
              <TableCell>
                <div className="flex items-center gap-1 sm:gap-2"> {/* Adjusted gap for smaller screens */}
                  {renderCustomActions && renderCustomActions(item)}
                  {onMoveSortOrder && itemTypeForSorting && typeof item.sortOrder === 'number' && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isLoading || !items || item.sortOrder === 1}
                        onClick={() => onMoveSortOrder(itemTypeForSorting, item as T & ItemWithSortOrder, 'up')}
                      >
                        <ArrowUpCircleIcon className="!h-6 !w-6" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isLoading || !items || item.sortOrder === (items.filter(i => typeof i.sortOrder === 'number').length || 0)}
                        onClick={() => onMoveSortOrder(itemTypeForSorting, item as T & ItemWithSortOrder, 'down')}
                      >
                        <ArrowDownCircleIcon className="!h-6 !w-6" />
                      </Button>
                    </>
                  )}

                </div>
              </TableCell>
            )}
            {onDeleteItem && (
              <TableCell>
                <div className="ms-6">
                    <Button
                      variant="default"
                      size="sm"
                      className="admin-remove-button h-8 w-8"
                      onClick={() => onDeleteItem(item)}
                      disabled={isLoading}
                    >
                      <TrashIcon className="!h-5 !w-5" />
                    </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}