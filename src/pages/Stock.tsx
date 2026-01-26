import { useState } from 'react';
import { useStockItems } from '@/hooks/useStockItems';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Package, Minus, Trash2, ShieldCheck, RefreshCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Stock() {
  const { items, isLoading, addItem, issueItem, returnItem, deleteItem } = useStockItems();
  const { categories } = useCategories();
  const { role } = useAuth();
  
  const isKeeper = role === 'storekeeper';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [newItem, setNewItem] = useState({
    name: '',
    category_id: '',
    quantity: '',
  });

  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [selectedIssueItemId, setSelectedIssueItemId] = useState<string | null>(null);
  const [issueQuantity, setIssueQuantity] = useState<string>('');

  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [selectedRestockItemId, setSelectedRestockItemId] = useState<string | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<string>('');

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddItem = () => {
    if (!newItem.name || !newItem.quantity || !isKeeper) return;
    addItem.mutate({
      name: newItem.name,
      category_id: newItem.category_id || null,
      quantity: Number(newItem.quantity),
    });
    setNewItem({ name: '', category_id: '', quantity: '' });
    setIsAddOpen(false);
  };

  const openIssueDialog = (itemId: string) => {
    setSelectedIssueItemId(itemId);
    setIssueQuantity('');
    setIsIssueDialogOpen(true);
  };

  const handleIssueConfirm = () => {
    const qty = Number(issueQuantity);
    if (!selectedIssueItemId || qty <= 0 || !isKeeper) return;
    issueItem.mutate({ id: selectedIssueItemId, quantity: qty }, {
      onSuccess: () => {
        setIsIssueDialogOpen(false);
        setSelectedIssueItemId(null);
      }
    });
  };

  const openRestockDialog = (itemId: string) => {
    setSelectedRestockItemId(itemId);
    setRestockQuantity('');
    setIsRestockDialogOpen(true);
  };

  const handleRestockConfirm = () => {
    const qty = Number(restockQuantity);
    if (!selectedRestockItemId || qty <= 0 || !isKeeper) return;
    returnItem.mutate({ id: selectedRestockItemId, quantity: qty }, {
      onSuccess: () => {
        setIsRestockDialogOpen(false);
        setSelectedRestockItemId(null);
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">In Stock</Badge>;
      case 'low_stock': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Low Stock</Badge>;
      case 'out_of_stock': return <Badge variant="destructive">Out of Stock</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Inventory</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">Monitor and manage warehouse levels</p>
            {!isKeeper && (
              <Badge variant="outline" className="text-blue-500 border-blue-500/30 gap-1">
                <ShieldCheck className="w-3 h-3" /> View Only
              </Badge>
            )}
          </div>
        </div>

        {isKeeper && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Add Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Item</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newItem.category_id} onValueChange={(v) => setNewItem({ ...newItem, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Initial Quantity</Label>
                  <Input type="number" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })} />
                </div>
                <Button onClick={handleAddItem} className="w-full" disabled={!newItem.name || !newItem.quantity}>Save Item</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><RefreshCcw className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  {isKeeper && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      {item.category ? (
                        <Badge variant="outline" style={{ borderColor: item.category.color }}>{item.category.name}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-center font-mono">{item.quantity}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
                    </TableCell>
                    
                    {isKeeper && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openIssueDialog(item.id)} disabled={item.quantity <= 0}>
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openRestockDialog(item.id)}>
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => confirm('Delete?') && deleteItem.mutate(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ISSUE DIALOG */}
      <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue Items</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quantity to Remove</Label>
              <Input type="number" placeholder="0" value={issueQuantity} onChange={(e) => setIssueQuantity(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsIssueDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleIssueConfirm} variant="destructive">Confirm Removal</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* RESTOCK DIALOG */}
      <Dialog open={isRestockDialogOpen} onOpenChange={setIsRestockDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Restock Item</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quantity to Add</Label>
              <Input type="number" placeholder="0" value={restockQuantity} onChange={(e) => setRestockQuantity(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRestockDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleRestockConfirm} className="bg-green-600 hover:bg-green-700">Add to Stock</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
