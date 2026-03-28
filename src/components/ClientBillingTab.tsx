import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, FileText, ArrowRightLeft, Trash2, Pencil, Loader2 } from 'lucide-react';
import { useClientBilling, type Invoice, type Quote, type Expense, type LineItem } from '@/hooks/useClientBilling';
import { ClientInvoiceForm } from '@/components/ClientInvoiceForm';
import { ClientQuoteForm } from '@/components/ClientQuoteForm';
import { ClientExpenseForm } from '@/components/ClientExpenseForm';
import { ClientBillingSettings } from '@/components/ClientBillingSettings';

interface Props {
  clientId: string;
}

const statusColor = (status: string) => {
  const map: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    sent: 'bg-primary/10 text-primary',
    viewed: 'bg-accent text-accent-foreground',
    paid: 'bg-success text-success-foreground',
    overdue: 'bg-destructive/10 text-destructive',
    void: 'bg-muted text-muted-foreground',
    accepted: 'bg-success text-success-foreground',
    declined: 'bg-destructive/10 text-destructive',
    expired: 'bg-muted text-muted-foreground',
    pending: 'bg-warning text-warning-foreground',
    approved: 'bg-success text-success-foreground',
    rejected: 'bg-destructive/10 text-destructive',
  };
  return map[status] || 'bg-secondary text-secondary-foreground';
};

export const ClientBillingTab = ({ clientId }: Props) => {
  const billing = useClientBilling(clientId);
  const { settings, invoices, quotes, expenses, loading, stats } = billing;

  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingInvoiceLines, setEditingInvoiceLines] = useState<LineItem[]>([]);

  const [quoteFormOpen, setQuoteFormOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [editingQuoteLines, setEditingQuoteLines] = useState<LineItem[]>([]);

  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const openEditInvoice = async (inv: Invoice) => {
    const lines = await billing.fetchLineItems(inv.id);
    setEditingInvoice(inv);
    setEditingInvoiceLines(lines);
    setInvoiceFormOpen(true);
  };

  const openEditQuote = async (q: Quote) => {
    const lines = await billing.fetchLineItems(undefined, q.id);
    setEditingQuote(q);
    setEditingQuoteLines(lines);
    setQuoteFormOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-foreground">${stats.outstanding.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">Outstanding</p>
        </div>
        <div className="border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.overdueCount}</p>
          <p className="text-xs text-muted-foreground">Overdue</p>
        </div>
        <div className="border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-foreground">${stats.paidTotal.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">Paid</p>
        </div>
        <div className="border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-foreground">${stats.expenseTotal.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">Expenses</p>
        </div>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices <Badge variant="secondary" className="ml-1 text-xs">{stats.totalInvoices}</Badge></TabsTrigger>
          <TabsTrigger value="quotes">Quotes <Badge variant="secondary" className="ml-1 text-xs">{stats.totalQuotes}</Badge></TabsTrigger>
          <TabsTrigger value="expenses">Expenses <Badge variant="secondary" className="ml-1 text-xs">{stats.totalExpenses}</Badge></TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* INVOICES */}
        <TabsContent value="invoices">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-foreground">All Invoices</h4>
            <Button size="sm" onClick={() => { setEditingInvoice(null); setEditingInvoiceLines([]); setInvoiceFormOpen(true); }}>
              <Plus className="h-3 w-3 mr-1" /> New Invoice
            </Button>
          </div>
          {invoices.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No invoices yet</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(inv => (
                    <TableRow key={inv.id} className="cursor-pointer" onClick={() => openEditInvoice(inv)}>
                      <TableCell className="font-medium text-sm">{inv.invoice_number}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(inv.issue_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</TableCell>
                      <TableCell className="text-sm text-right font-medium">${Number(inv.total).toFixed(2)}</TableCell>
                      <TableCell><Badge className={`text-xs capitalize ${statusColor(inv.status)}`}>{inv.status}</Badge></TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3 w-3" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border">
                            <DropdownMenuItem onClick={() => openEditInvoice(inv)}><Pencil className="h-3 w-3 mr-2" />Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => billing.deleteInvoice(inv.id)}><Trash2 className="h-3 w-3 mr-2" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* QUOTES */}
        <TabsContent value="quotes">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-foreground">All Quotes</h4>
            <Button size="sm" onClick={() => { setEditingQuote(null); setEditingQuoteLines([]); setQuoteFormOpen(true); }}>
              <Plus className="h-3 w-3 mr-1" /> New Quote
            </Button>
          </div>
          {quotes.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No quotes yet</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map(q => (
                    <TableRow key={q.id} className="cursor-pointer" onClick={() => openEditQuote(q)}>
                      <TableCell className="font-medium text-sm">{q.quote_number}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(q.issue_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{q.valid_until ? new Date(q.valid_until).toLocaleDateString() : '—'}</TableCell>
                      <TableCell className="text-sm text-right font-medium">${Number(q.total).toFixed(2)}</TableCell>
                      <TableCell><Badge className={`text-xs capitalize ${statusColor(q.status)}`}>{q.status}</Badge></TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3 w-3" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border">
                            <DropdownMenuItem onClick={() => openEditQuote(q)}><Pencil className="h-3 w-3 mr-2" />Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => billing.convertQuoteToInvoice(q.id)}><ArrowRightLeft className="h-3 w-3 mr-2" />Convert to Invoice</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => billing.deleteQuote(q.id)}><Trash2 className="h-3 w-3 mr-2" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* EXPENSES */}
        <TabsContent value="expenses">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-foreground">All Expenses</h4>
            <Button size="sm" onClick={() => { setEditingExpense(null); setExpenseFormOpen(true); }}>
              <Plus className="h-3 w-3 mr-1" /> Log Expense
            </Button>
          </div>
          {expenses.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No expenses logged</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map(exp => (
                    <TableRow key={exp.id}>
                      <TableCell className="text-sm text-muted-foreground">{new Date(exp.expense_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm font-medium">{exp.category}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{exp.vendor || '—'}</TableCell>
                      <TableCell className="text-sm text-right font-medium">${Number(exp.amount).toFixed(2)}</TableCell>
                      <TableCell><Badge className={`text-xs capitalize ${statusColor(exp.status)}`}>{exp.status}</Badge></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3 w-3" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border">
                            <DropdownMenuItem onClick={() => { setEditingExpense(exp); setExpenseFormOpen(true); }}><Pencil className="h-3 w-3 mr-2" />Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => billing.deleteExpense(exp.id)}><Trash2 className="h-3 w-3 mr-2" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings">
          <ClientBillingSettings settings={settings} onSave={billing.upsertSettings} />
        </TabsContent>
      </Tabs>

      <ClientInvoiceForm
        isOpen={invoiceFormOpen}
        onClose={() => { setInvoiceFormOpen(false); setEditingInvoice(null); }}
        onSave={async (data) => {
          if (editingInvoice) await billing.updateInvoice(editingInvoice.id, data);
          else await billing.createInvoice(data);
        }}
        existingInvoice={editingInvoice}
        existingLineItems={editingInvoiceLines}
        defaultTaxRate={settings?.default_tax_rate || 0}
        defaultNotes={settings?.invoice_notes || ''}
        defaultPaymentTerms={settings?.default_payment_terms || 30}
      />

      <ClientQuoteForm
        isOpen={quoteFormOpen}
        onClose={() => { setQuoteFormOpen(false); setEditingQuote(null); }}
        onSave={async (data) => {
          if (editingQuote) await billing.updateQuote(editingQuote.id, data);
          else await billing.createQuote(data);
        }}
        existingQuote={editingQuote}
        existingLineItems={editingQuoteLines}
        defaultTaxRate={settings?.default_tax_rate || 0}
        defaultNotes={settings?.quote_notes || ''}
      />

      <ClientExpenseForm
        isOpen={expenseFormOpen}
        onClose={() => { setExpenseFormOpen(false); setEditingExpense(null); }}
        onSave={async (data) => {
          if (editingExpense) await billing.updateExpense(editingExpense.id, data);
          else await billing.createExpense(data);
        }}
        existingExpense={editingExpense}
      />
    </div>
  );
};
