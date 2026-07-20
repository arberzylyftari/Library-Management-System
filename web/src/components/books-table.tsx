import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice, statusBadgeVariant, statusLabel } from "@/lib/book-display";
import type { Book } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BooksTableProps {
  books: Book[];
  showOwner?: boolean;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
}

export function BooksTable({ books, showOwner, onEdit, onDelete }: BooksTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Genre</TableHead>
            {showOwner && <TableHead>Owner</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence initial={false}>
            {books.map((book) => (
              <motion.tr
                key={book.id}
                layout
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "border-b transition-colors last:border-0 hover:bg-muted/50",
                )}
              >
                <TableCell className="font-medium">{book.title}</TableCell>
                <TableCell className="text-muted-foreground">{book.author}</TableCell>
                <TableCell className="text-muted-foreground">{book.genre}</TableCell>
                {showOwner && (
                  <TableCell className="text-muted-foreground">
                    {book.user?.name ?? "—"}
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant={statusBadgeVariant(book.status)}>
                    {statusLabel(book.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPrice(book.price)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(book)}>
                        <Pencil /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => onDelete(book)}>
                        <Trash2 /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}
